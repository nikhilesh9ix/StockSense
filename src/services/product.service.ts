import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PaginatedResult } from '../types';
import { ProductQuery } from '../validators';

export interface ProductCreateInput {
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasure: string;
  reorderLevel?: number;
}

export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  categoryId?: string;
  unitOfMeasure?: string;
  reorderLevel?: number;
}

export class ProductService {
  async create(data: ProductCreateInput) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new AppError('DUPLICATE_SKU', 'SKU already exists', 409);
    }

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new AppError('NOT_FOUND', 'Category not found', 404);
    }

    return prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async findAll(query: ProductQuery): Promise<PaginatedResult<any>> {
    const { page, limit, search, categoryId, lowStock, outOfStock } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate stock status for each product
    const productsWithStatus = data.map((product) => {
      const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      
      if (totalQuantity === 0) {
        status = 'OUT_OF_STOCK';
      } else if (totalQuantity <= product.reorderLevel) {
        status = 'LOW_STOCK';
      }

      return {
        ...product,
        totalQuantity,
        status,
      };
    });

    // Filter by lowStock/outOfStock if requested
    let filteredData = productsWithStatus;
    if (lowStock) {
      filteredData = filteredData.filter((p) => p.status === 'LOW_STOCK');
    }
    if (outOfStock) {
      filteredData = filteredData.filter((p) => p.status === 'OUT_OF_STOCK');
    }

    return {
      data: filteredData,
      pagination: {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
      },
    };
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
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
      ...product,
      totalQuantity,
      status,
    };
  }

  async update(id: string, data: ProductUpdateInput) {
    await this.findById(id);

    if (data.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku && existingSku.id !== id) {
        throw new AppError('DUPLICATE_SKU', 'SKU already exists', 409);
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new AppError('NOT_FOUND', 'Category not found', 404);
      }
    }

    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    // Check if product has any inventory records
    const inventoryCount = await prisma.inventory.count({
      where: { productId: id },
    });

    if (inventoryCount > 0) {
      throw new AppError('RESOURCE_IN_USE', 'Cannot delete product with existing inventory', 409);
    }

    // Check if product has any transaction records
    const [receiptItems, deliveryItems, transferItems, adjustmentItems] = await Promise.all([
      prisma.receiptItem.count({ where: { productId: id } }),
      prisma.deliveryItem.count({ where: { productId: id } }),
      prisma.transferItem.count({ where: { productId: id } }),
      prisma.adjustmentItem.count({ where: { productId: id } }),
    ]);

    if (receiptItems > 0 || deliveryItems > 0 || transferItems > 0 || adjustmentItems > 0) {
      throw new AppError('RESOURCE_IN_USE', 'Cannot delete product with transaction history', 409);
    }

    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productService = new ProductService();