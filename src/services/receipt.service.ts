import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { OperationStatus, StockLedgerType } from '../constants';
import { PaginatedResult } from '../types';
import { inventoryService } from './inventory.service';
import { ReceiptQuery } from '../validators';

export interface ReceiptCreateInput {
  supplierName: string;
  items: Array<{
    productId: string;
    locationId: string;
    quantity: number;
  }>;
  createdById: string;
}

export interface ReceiptUpdateInput {
  supplierName?: string;
  items?: Array<{
    productId: string;
    locationId: string;
    quantity: number;
  }>;
}

export class ReceiptService {
  async create(data: ReceiptCreateInput) {
    // Validate all products and locations exist
    for (const item of data.items) {
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
      if (item.quantity <= 0) {
        throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
      }
    }

    // Generate receipt number
    const count = await prisma.receipt.count();
    const receiptNumber = `RCPT-${String(count + 1).padStart(3, '0')}`;

    return prisma.receipt.create({
      data: {
        receiptNumber,
        supplierName: data.supplierName,
        status: OperationStatus.DRAFT,
        createdById: data.createdById,
        items: {
          create: data.items,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            location: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(query: ReceiptQuery): Promise<PaginatedResult<any>> {
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
      prisma.receipt.findMany({
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
      prisma.receipt.count({ where }),
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
    const receipt = await prisma.receipt.findUnique({
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

    if (!receipt) {
      throw new AppError('NOT_FOUND', 'Receipt not found', 404);
    }

    return receipt;
  }

  async update(id: string, data: ReceiptUpdateInput) {
    const receipt = await this.findById(id);

    if (receipt.status !== OperationStatus.DRAFT) {
      throw new AppError('INVALID_STATUS', 'Can only update draft receipts', 400);
    }

    // Validate items if provided
    if (data.items) {
      for (const item of data.items) {
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
        if (item.quantity <= 0) {
          throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      // Update receipt
      const updated = await tx.receipt.update({
        where: { id },
        data: {
          supplierName: data.supplierName,
          items: data.items
            ? {
                deleteMany: {},
                create: data.items,
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
    const receipt = await this.findById(id);

    if (receipt.status !== OperationStatus.DRAFT && receipt.status !== OperationStatus.WAITING && receipt.status !== OperationStatus.READY) {
      throw new AppError('INVALID_STATUS', 'Receipt cannot be validated in current status', 400);
    }

    // Validate all items have valid quantities
    for (const item of receipt.items) {
      if (item.quantity <= 0) {
        throw new AppError('INVALID_QUANTITY', `Invalid quantity for product ${item.productId}`, 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      // Increase inventory for each item and create ledger entries
      for (const item of receipt.items) {
        await inventoryService.increaseStock({
          productId: item.productId,
          locationId: item.locationId,
          quantity: item.quantity,
          type: StockLedgerType.RECEIPT,
          referenceId: receipt.id,
          referenceType: 'RECEIPT',
          createdById: userId,
        });
      }

      // Update receipt status
      const updated = await tx.receipt.update({
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
    const receipt = await this.findById(id);

    if (receipt.status === OperationStatus.DONE) {
      throw new AppError('INVALID_STATUS', 'Cannot cancel a completed receipt. Use an adjustment instead.', 400);
    }

    if (receipt.status === OperationStatus.CANCELED) {
      throw new AppError('INVALID_STATUS', 'Receipt is already canceled', 400);
    }

    return prisma.receipt.update({
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

export const receiptService = new ReceiptService();