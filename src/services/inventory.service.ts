import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { StockLedgerType } from '../constants';
import { InventorySummary, PaginatedResult } from '../types';
import { inventoryQuerySchema } from '../validators';

export interface StockMutationInput {
  productId: string;
  locationId: string;
  quantity: number;
  type: StockLedgerType;
  referenceId: string;
  referenceType: string;
  createdById: string;
}

export interface TransferStockInput {
  productId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  quantity: number;
  referenceId: string;
  referenceType: string;
  createdById: string;
}

export interface AdjustStockInput {
  productId: string;
  locationId: string;
  countedQuantity: number;
  referenceId: string;
  referenceType: string;
  createdById: string;
}

export class InventoryService {
  async getAvailableStock(productId: string, locationId: string): Promise<number> {
    const inventory = await prisma.inventory.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    return inventory?.quantity ?? 0;
  }

  async getTotalStock(productId: string): Promise<number> {
    const inventories = await prisma.inventory.findMany({
      where: { productId },
      select: { quantity: true },
    });

    return inventories.reduce((sum, inv) => sum + inv.quantity, 0);
  }

  async increaseStock(input: StockMutationInput): Promise<void> {
    const { productId, locationId, quantity, type, referenceId, referenceType, createdById } = input;

    if (quantity <= 0) {
      throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Update or create inventory
      const inventory = await tx.inventory.upsert({
        where: { productId_locationId: { productId, locationId } },
        update: { quantity: { increment: quantity } },
        create: { productId, locationId, quantity },
      });

      // Create stock ledger entry
      await tx.stockLedger.create({
        data: {
          productId,
          locationId,
          type,
          quantity,
          balanceAfter: inventory.quantity,
          referenceId,
          referenceType,
          createdById,
        },
      });
    });
  }

  async decreaseStock(input: StockMutationInput): Promise<void> {
    const { productId, locationId, quantity, type, referenceId, referenceType, createdById } = input;

    if (quantity <= 0) {
      throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Check current stock
      const inventory = await tx.inventory.findUnique({
        where: { productId_locationId: { productId, locationId } },
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new AppError('INSUFFICIENT_STOCK', 'Insufficient stock available', 400);
      }

      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { productId_locationId: { productId, locationId } },
        data: { quantity: { decrement: quantity } },
      });

      // Create stock ledger entry
      await tx.stockLedger.create({
        data: {
          productId,
          locationId,
          type,
          quantity: -quantity,
          balanceAfter: updatedInventory.quantity,
          referenceId,
          referenceType,
          createdById,
        },
      });
    });
  }

  async transferStock(input: TransferStockInput): Promise<void> {
    const { productId, sourceLocationId, destinationLocationId, quantity, referenceId, referenceType, createdById } = input;

    if (quantity <= 0) {
      throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
    }

    if (sourceLocationId === destinationLocationId) {
      throw new AppError('INVALID_TRANSFER', 'Source and destination locations must be different', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Check source stock
      const sourceInventory = await tx.inventory.findUnique({
        where: { productId_locationId: { productId, locationId: sourceLocationId } },
      });

      if (!sourceInventory || sourceInventory.quantity < quantity) {
        throw new AppError('INSUFFICIENT_STOCK', 'Insufficient stock at source location', 400);
      }

      // Decrease source inventory
      const updatedSource = await tx.inventory.update({
        where: { productId_locationId: { productId, locationId: sourceLocationId } },
        data: { quantity: { decrement: quantity } },
      });

      // Create TRANSFER_OUT ledger entry
      await tx.stockLedger.create({
        data: {
          productId,
          locationId: sourceLocationId,
          type: StockLedgerType.TRANSFER_OUT,
          quantity: -quantity,
          balanceAfter: updatedSource.quantity,
          referenceId,
          referenceType,
          createdById,
        },
      });

      // Increase destination inventory
      const destInventory = await tx.inventory.upsert({
        where: { productId_locationId: { productId, locationId: destinationLocationId } },
        update: { quantity: { increment: quantity } },
        create: { productId, locationId: destinationLocationId, quantity },
      });

      // Create TRANSFER_IN ledger entry
      await tx.stockLedger.create({
        data: {
          productId,
          locationId: destinationLocationId,
          type: StockLedgerType.TRANSFER_IN,
          quantity,
          balanceAfter: destInventory.quantity,
          referenceId,
          referenceType,
          createdById,
        },
      });
    });
  }

  async adjustStock(input: AdjustStockInput): Promise<void> {
    const { productId, locationId, countedQuantity, referenceId, referenceType, createdById } = input;

    if (countedQuantity < 0) {
      throw new AppError('INVALID_QUANTITY', 'Counted quantity cannot be negative', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Get current system quantity
      const inventory = await tx.inventory.findUnique({
        where: { productId_locationId: { productId, locationId } },
      });

      const systemQuantity = inventory?.quantity ?? 0;
      const difference = countedQuantity - systemQuantity;

      // Update inventory to counted quantity
      const updatedInventory = await tx.inventory.upsert({
        where: { productId_locationId: { productId, locationId } },
        update: { quantity: countedQuantity },
        create: { productId, locationId, quantity: countedQuantity },
      });

      // Create adjustment ledger entry (only if there's a difference)
      if (difference !== 0) {
        await tx.stockLedger.create({
          data: {
            productId,
            locationId,
            type: StockLedgerType.ADJUSTMENT,
            quantity: difference,
            balanceAfter: updatedInventory.quantity,
            referenceId,
            referenceType,
            createdById,
          },
        });
      }
    });
  }

  async getInventorySummary(query: any): Promise<PaginatedResult<InventorySummary>> {
    const { page, limit, productId, warehouseId, locationId, categoryId, lowStock, outOfStock, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause for products
    const productWhere: any = {};

    if (productId) productWhere.id = productId;
    if (categoryId) productWhere.categoryId = categoryId;
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get products with inventory
    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        inventory: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
          where: locationId ? { locationId } : warehouseId ? { location: { warehouseId } } : undefined,
        },
      },
    });

    // Filter by warehouse if specified
    let filteredProducts = products;
    if (warehouseId && !locationId) {
      filteredProducts = products.filter((p) =>
        p.inventory.some((inv) => inv.location.warehouseId === warehouseId)
      );
    }

    // Calculate totals and status
    const summaries: InventorySummary[] = filteredProducts.map((product) => {
      const relevantInventory = product.inventory.filter((inv) => {
        if (locationId) return inv.locationId === locationId;
        if (warehouseId) return inv.location.warehouseId === warehouseId;
        return true;
      });

      const totalQuantity = relevantInventory.reduce((sum, inv) => sum + inv.quantity, 0);
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';

      if (totalQuantity === 0) {
        status = 'OUT_OF_STOCK';
      } else if (totalQuantity <= product.reorderLevel) {
        status = 'LOW_STOCK';
      }

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        categoryName: product.category.name,
        unitOfMeasure: product.unitOfMeasure,
        reorderLevel: product.reorderLevel,
        totalQuantity,
        locations: relevantInventory.map((inv) => ({
          locationId: inv.locationId,
          locationName: inv.location.name,
          locationCode: inv.location.code,
          warehouseName: inv.location.warehouse.name,
          quantity: inv.quantity,
        })),
        status,
      };
    });

    // Apply lowStock/outOfStock filters
    let finalSummaries = summaries;
    if (lowStock) {
      finalSummaries = summaries.filter((s) => s.status === 'LOW_STOCK');
    }
    if (outOfStock) {
      finalSummaries = summaries.filter((s) => s.status === 'OUT_OF_STOCK');
    }

    const total = finalSummaries.length;
    const paginatedData = finalSummaries.slice(skip, skip + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductInventory(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        inventory: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('NOT_FOUND', 'Product not found', 404);
    }

    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';

    if (totalQuantity === 0) {
      status = 'OUT_OF_STOCK';
    } else if (totalQuantity <= product.reorderLevel) {
      status = 'LOW_STOCK';
    }

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      categoryName: product.category.name,
      unitOfMeasure: product.unitOfMeasure,
      reorderLevel: product.reorderLevel,
      totalQuantity,
      locations: product.inventory.map((inv) => ({
        locationId: inv.locationId,
        locationName: inv.location.name,
        locationCode: inv.location.code,
        warehouseName: inv.location.warehouse.name,
        quantity: inv.quantity,
      })),
      status,
    };
  }

  async getLocationInventory(locationId: string) {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        warehouse: true,
        inventory: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!location) {
      throw new AppError('NOT_FOUND', 'Location not found', 404);
    }

    return {
      locationId: location.id,
      locationName: location.name,
      locationCode: location.code,
      warehouseName: location.warehouse.name,
      items: location.inventory.map((inv) => ({
        productId: inv.productId,
        productName: inv.product.name,
        productSku: inv.product.sku,
        categoryName: inv.product.category.name,
        unitOfMeasure: inv.product.unitOfMeasure,
        reorderLevel: inv.product.reorderLevel,
        quantity: inv.quantity,
        status: inv.quantity === 0 ? 'OUT_OF_STOCK' : inv.quantity <= inv.product.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK',
      })),
    };
  }
}

export const inventoryService = new InventoryService();