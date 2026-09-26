import { prisma } from '../config/prisma';
import { OperationStatus } from '../constants';
import { DashboardSummary } from '../types';
import { dashboardQuerySchema } from '../validators';

export interface DashboardQuery {
  documentType?: string;
  status?: string;
  warehouseId?: string;
  locationId?: string;
  categoryId?: string;
}

export class DashboardService {
  async getSummary(query: DashboardQuery = {}): Promise<DashboardSummary> {
    const { warehouseId, locationId, categoryId } = query;

    // Build base where clause for inventory
    const inventoryWhere: any = {};
    if (locationId) inventoryWhere.locationId = locationId;
    if (warehouseId) inventoryWhere.location = { warehouseId };

    // Get inventories with product and location
    const inventories = await prisma.inventory.findMany({
      where: inventoryWhere,
      include: {
        product: { select: { id: true, reorderLevel: true, categoryId: true } },
        location: { select: { warehouseId: true } },
      },
    });

    // Filter by category if specified
    const filteredInventories = categoryId
      ? inventories.filter((inv) => inv.product && inv.product.categoryId === categoryId)
      : inventories;

    const totalStock = filteredInventories.reduce((sum, inv) => sum + inv.quantity, 0);

    // Get low stock and out of stock counts
    let lowStockItems = 0;
    let outOfStockItems = 0;

    for (const inv of filteredInventories) {
      if (inv.product) {
        if (inv.quantity === 0) {
          outOfStockItems++;
        } else if (inv.quantity <= inv.product.reorderLevel) {
          lowStockItems++;
        }
      }
    }

    // Get pending counts
    const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
      prisma.receipt.count({
        where: {
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        },
      }),
      prisma.delivery.count({
        where: {
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        },
      }),
      prisma.transfer.count({
        where: {
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
        },
      }),
    ]);

    return {
      totalStock,
      lowStockItems,
      outOfStockItems,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
    };
  }

  async getFilteredDocuments(query: DashboardQuery) {
    const { documentType, status, warehouseId, locationId, categoryId } = query;

    const results: any = {};

    if (!documentType || documentType === 'RECEIPT') {
      const where: any = {};
      if (status) where.status = status;
      results.receipts = await prisma.receipt.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    if (!documentType || documentType === 'DELIVERY') {
      const where: any = {};
      if (status) where.status = status;
      results.deliveries = await prisma.delivery.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    if (!documentType || documentType === 'TRANSFER') {
      const where: any = {};
      if (status) where.status = status;
      results.transfers = await prisma.transfer.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              sourceLocation: { include: { warehouse: true } },
              destinationLocation: { include: { warehouse: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    if (!documentType || documentType === 'ADJUSTMENT') {
      const where: any = {};
      if (status) where.status = status;
      results.adjustments = await prisma.adjustment.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    return results;
  }
}

export const dashboardService = new DashboardService();