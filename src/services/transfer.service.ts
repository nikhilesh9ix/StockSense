import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { OperationStatus, StockLedgerType } from '../constants';
import { PaginatedResult } from '../types';
import { inventoryService } from './inventory.service';
import { TransferQuery } from '../validators';

export interface TransferCreateInput {
  items: Array<{
    productId: string;
    sourceLocationId: string;
    destinationLocationId: string;
    quantity: number;
  }>;
  createdById: string;
}

export interface TransferUpdateInput {
  items?: Array<{
    productId: string;
    sourceLocationId: string;
    destinationLocationId: string;
    quantity: number;
  }>;
}

export class TransferService {
  async create(data: TransferCreateInput) {
    // Validate all items
    for (const item of data.items) {
      if (item.sourceLocationId === item.destinationLocationId) {
        throw new AppError('INVALID_TRANSFER', 'Source and destination locations must be different', 400);
      }
      if (item.quantity <= 0) {
        throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
      }

      const [product, sourceLocation, destLocation] = await Promise.all([
        prisma.product.findUnique({ where: { id: item.productId } }),
        prisma.location.findUnique({ where: { id: item.sourceLocationId } }),
        prisma.location.findUnique({ where: { id: item.destinationLocationId } }),
      ]);

      if (!product) {
        throw new AppError('NOT_FOUND', `Product ${item.productId} not found`, 404);
      }
      if (!sourceLocation) {
        throw new AppError('NOT_FOUND', `Source location ${item.sourceLocationId} not found`, 404);
      }
      if (!destLocation) {
        throw new AppError('NOT_FOUND', `Destination location ${item.destinationLocationId} not found`, 404);
      }
    }

    // Generate transfer number
    const count = await prisma.transfer.count();
    const transferNumber = `TRF-${String(count + 1).padStart(3, '0')}`;

    return prisma.transfer.create({
      data: {
        transferNumber,
        status: OperationStatus.DRAFT,
        createdById: data.createdById,
        items: {
          create: data.items,
        },
      },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            sourceLocation: { include: { warehouse: true } },
            destinationLocation: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: TransferQuery): Promise<PaginatedResult<any>> {
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
      prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              sourceLocation: { include: { warehouse: true } },
              destinationLocation: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.transfer.count({ where }),
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
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            sourceLocation: { include: { warehouse: true } },
            destinationLocation: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transfer) {
      throw new AppError('NOT_FOUND', 'Transfer not found', 404);
    }

    return transfer;
  }

  async update(id: string, data: TransferUpdateInput) {
    const transfer = await this.findById(id);

    if (transfer.status !== OperationStatus.DRAFT) {
      throw new AppError('INVALID_STATUS', 'Can only update draft transfers', 400);
    }

    // Validate items if provided
    if (data.items) {
      for (const item of data.items) {
        if (item.sourceLocationId === item.destinationLocationId) {
          throw new AppError('INVALID_TRANSFER', 'Source and destination locations must be different', 400);
        }
        if (item.quantity <= 0) {
          throw new AppError('INVALID_QUANTITY', 'Quantity must be positive', 400);
        }

        const [product, sourceLocation, destLocation] = await Promise.all([
          prisma.product.findUnique({ where: { id: item.productId } }),
          prisma.location.findUnique({ where: { id: item.sourceLocationId } }),
          prisma.location.findUnique({ where: { id: item.destinationLocationId } }),
        ]);

        if (!product) {
          throw new AppError('NOT_FOUND', `Product ${item.productId} not found`, 404);
        }
        if (!sourceLocation) {
          throw new AppError('NOT_FOUND', `Source location ${item.sourceLocationId} not found`, 404);
        }
        if (!destLocation) {
          throw new AppError('NOT_FOUND', `Destination location ${item.destinationLocationId} not found`, 404);
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transfer.update({
        where: { id },
        data: {
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
              sourceLocation: { include: { warehouse: true } },
              destinationLocation: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });
  }

  async validate(id: string, userId: string) {
    const transfer = await this.findById(id);

    if (transfer.status !== OperationStatus.DRAFT && transfer.status !== OperationStatus.WAITING && transfer.status !== OperationStatus.READY) {
      throw new AppError('INVALID_STATUS', 'Transfer cannot be validated in current status', 400);
    }

    // Check sufficient stock at source for all items
    for (const item of transfer.items) {
      const availableStock = await inventoryService.getAvailableStock(item.productId, item.sourceLocationId);
      if (availableStock < item.quantity) {
        throw new AppError('INSUFFICIENT_STOCK', `Insufficient stock for ${item.product.name} at source location ${item.sourceLocation.name}`, 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      // Transfer stock for each item (creates both TRANSFER_OUT and TRANSFER_IN ledger entries)
      for (const item of transfer.items) {
        await inventoryService.transferStock({
          productId: item.productId,
          sourceLocationId: item.sourceLocationId,
          destinationLocationId: item.destinationLocationId,
          quantity: item.quantity,
          referenceId: transfer.id,
          referenceType: 'TRANSFER',
          createdById: userId,
        });
      }

      // Update transfer status
      const updated = await tx.transfer.update({
        where: { id },
        data: {
          status: OperationStatus.DONE,
          validatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              sourceLocation: { include: { warehouse: true } },
              destinationLocation: { include: { warehouse: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return updated;
    });
  }

  async cancel(id: string) {
    const transfer = await this.findById(id);

    if (transfer.status === OperationStatus.DONE) {
      throw new AppError('INVALID_STATUS', 'Cannot cancel a completed transfer. Use a reverse transfer instead.', 400);
    }

    if (transfer.status === OperationStatus.CANCELED) {
      throw new AppError('INVALID_STATUS', 'Transfer is already canceled', 400);
    }

    return prisma.transfer.update({
      where: { id },
      data: { status: OperationStatus.CANCELED },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            sourceLocation: { include: { warehouse: true } },
            destinationLocation: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

export const transferService = new TransferService();