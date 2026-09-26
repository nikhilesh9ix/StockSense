import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { OperationStatus } from '../constants';
import type { PaginatedResult } from '../types';
import { inventoryService } from './inventory.service';
import type { AdjustmentQuery } from '../validators';

export interface AdjustmentCreateInput {
  reason: string;
  items: Array<{
    productId: string;
    locationId: string;
    countedQuantity: number;
  }>;
  createdById: string;
}

export interface AdjustmentUpdateInput {
  reason?: string;
  items?: Array<{
    productId: string;
    locationId: string;
    countedQuantity: number;
  }>;
}

export class AdjustmentService {
  async create(data: AdjustmentCreateInput) {
    // Validate all items
    for (const item of data.items) {
      if (item.countedQuantity < 0) {
        throw new AppError('INVALID_QUANTITY', 'Counted quantity cannot be negative', 400);
      }

      const [product, location] = await Promise.all([
        prisma.product.findUnique({ where: { id: item.productId } }),
        prisma.location.findUnique({ where: { id: item.locationId } }),
      ]);

      if (!product) {
        throw new AppError('NOT_FOUND', `Product ${item.productId} not found`, 404);
      }
      if (!location) {
        throw new AppError('NOT_FOUND', `Location ${item.locationId} not found`, 404);
      }
    }

    // Generate adjustment number
    const count = await prisma.adjustment.count();
    const adjustmentNumber = `ADJ-${String(count + 1).padStart(3, '0')}`;

    // Get system quantities for each item
    const itemsWithSystemQty = await Promise.all(
      data.items.map(async (item) => {
        const systemQuantity = await inventoryService.getAvailableStock(item.productId, item.locationId);
        const difference = item.countedQuantity - systemQuantity;
        return { ...item, systemQuantity, difference };
      })
    );

    return prisma.adjustment.create({
      data: {
        adjustmentNumber,
        reason: data.reason,
        status: OperationStatus.DRAFT,
        createdById: data.createdById,
        items: {
          create: itemsWithSystemQty.map((item) => ({
            productId: item.productId,
            locationId: item.locationId,
            systemQuantity: item.systemQuantity,
            countedQuantity: item.countedQuantity,
            difference: item.difference,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            location: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: AdjustmentQuery): Promise<PaginatedResult<any>> {
    const { page, limit, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.adjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.adjustment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            location: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!adjustment) {
      throw new AppError('NOT_FOUND', 'Adjustment not found', 404);
    }

    return adjustment;
  }

  async update(id: string, data: AdjustmentUpdateInput) {
    const adjustment = await this.findById(id);

    if (adjustment.status !== OperationStatus.DRAFT) {
      throw new AppError('INVALID_STATUS', 'Can only update draft adjustments', 400);
    }

    // Validate items if provided
    if (data.items) {
      for (const item of data.items) {
        if (item.countedQuantity < 0) {
          throw new AppError('INVALID_QUANTITY', 'Counted quantity cannot be negative', 400);
        }

        const [product, location] = await Promise.all([
          prisma.product.findUnique({ where: { id: item.productId } }),
          prisma.location.findUnique({ where: { id: item.locationId } }),
        ]);

        if (!product) {
          throw new AppError('NOT_FOUND', `Product ${item.productId} not found`, 404);
        }
        if (!location) {
          throw new AppError('NOT_FOUND', `Location ${item.locationId} not found`, 404);
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      const itemsWithSystemQty = data.items
        ? await Promise.all(
            data.items.map(async (item) => {
              const systemQuantity = await inventoryService.getAvailableStock(item.productId, item.locationId);
              const difference = item.countedQuantity - systemQuantity;
              return { ...item, systemQuantity, difference };
            })
          )
        : undefined;

      const updated = await tx.adjustment.update({
        where: { id },
        data: {
          reason: data.reason,
          items: itemsWithSystemQty
            ? {
                deleteMany: {},
                create: itemsWithSystemQty.map((item) => ({
                  productId: item.productId,
                  locationId: item.locationId,
                  systemQuantity: item.systemQuantity,
                  countedQuantity: item.countedQuantity,
                  difference: item.difference,
                })),
              }
            : undefined,
        },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });
  }

  async validate(id: string, userId: string) {
    const adjustment = await this.findById(id);

    if (adjustment.status !== OperationStatus.DRAFT && adjustment.status !== OperationStatus.WAITING && adjustment.status !== OperationStatus.READY) {
      throw new AppError('INVALID_STATUS', 'Adjustment cannot be validated in current status', 400);
    }

    return prisma.$transaction(async (tx) => {
      // Adjust stock for each item
      for (const item of adjustment.items) {
        await inventoryService.adjustStock({
          productId: item.productId,
          locationId: item.locationId,
          countedQuantity: item.countedQuantity,
          referenceId: adjustment.id,
          referenceType: 'ADJUSTMENT',
          createdById: userId,
        });
      }

      // Update adjustment status
      const updated = await tx.adjustment.update({
        where: { id },
        data: {
          status: OperationStatus.DONE,
          validatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              location: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });
  }

  async cancel(id: string) {
    const adjustment = await this.findById(id);

    if (adjustment.status === OperationStatus.DONE) {
      throw new AppError('INVALID_STATUS', 'Cannot cancel a completed adjustment. Use a new adjustment instead.', 400);
    }

    if (adjustment.status === OperationStatus.CANCELED) {
      throw new AppError('INVALID_STATUS', 'Adjustment is already canceled', 400);
    }

    return prisma.adjustment.update({
      where: { id },
      data: { status: OperationStatus.CANCELED },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            location: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

export const adjustmentService = new AdjustmentService();