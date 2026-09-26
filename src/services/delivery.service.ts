import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { OperationStatus, StockLedgerType } from '../constants';
import { PaginatedResult } from '../types';
import { inventoryService } from './inventory.service';
import { DeliveryQuery } from '../validators';

export interface DeliveryCreateInput {
  customerName: string;
  items: Array<{
    productId: string;
    locationId: string;
    quantity: number;
  }>;
  createdById: string;
}

export interface DeliveryUpdateInput {
  customerName?: string;
  items?: Array<{
    productId: string;
    locationId: string;
    quantity: number;
  }>;
}

export class DeliveryService {
  async create(data: DeliveryCreateInput) {
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

    // Generate delivery number
    const count = await prisma.delivery.count();
    const deliveryNumber = `DEL-${String(count + 1).padStart(3, '0')}`;

    return prisma.delivery.create({
      data: {
        deliveryNumber,
        customerName: data.customerName,
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
            location: { include: { warehouse: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: DeliveryQuery): Promise<PaginatedResult<any>> {
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
      prisma.delivery.findMany({
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
      prisma.delivery.count({ where }),
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
    const delivery = await prisma.delivery.findUnique({
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

    if (!delivery) {
      throw new AppError('NOT_FOUND', 'Delivery not found', 404);
    }

    return delivery;
  }

  async update(id: string, data: DeliveryUpdateInput) {
    const delivery = await this.findById(id);

    if (delivery.status !== OperationStatus.DRAFT) {
      throw new AppError('INVALID_STATUS', 'Can only update draft deliveries', 400);
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
      const updated = await tx.delivery.update({
        where: { id },
        data: {
          customerName: data.customerName,
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

  async pick(id: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== OperationStatus.DRAFT) {
      throw new AppError('INVALID_STATUS', 'Can only pick draft deliveries', 400);
    }

    return prisma.delivery.update({
      where: { id },
      data: { status: OperationStatus.WAITING },
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

  async pack(id: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== OperationStatus.WAITING) {
      throw new AppError('INVALID_STATUS', 'Can only pack waiting deliveries', 400);
    }

    return prisma.delivery.update({
      where: { id },
      data: { status: OperationStatus.READY, packedAt: new Date() },
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

  async validate(id: string, userId: string) {
    const delivery = await this.findById(id);

    if (delivery.status !== OperationStatus.READY) {
      throw new AppError('INVALID_STATUS', 'Delivery must be packed before validation', 400);
    }

    // Check sufficient stock for all items
    for (const item of delivery.items) {
      const availableStock = await inventoryService.getAvailableStock(item.productId, item.locationId);
      if (availableStock < item.quantity) {
        throw new AppError('INSUFFICIENT_STOCK', `Insufficient stock for ${item.product.name} at ${item.location.name}`, 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      // Decrease inventory for each item and create ledger entries
      for (const item of delivery.items) {
        await inventoryService.decreaseStock({
          productId: item.productId,
          locationId: item.locationId,
          quantity: item.quantity,
          type: StockLedgerType.DELIVERY,
          referenceId: delivery.id,
          referenceType: 'DELIVERY',
          createdById: userId,
        });
      }

      // Update delivery status
      const updated = await tx.delivery.update({
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
    const delivery = await this.findById(id);

    if (delivery.status === OperationStatus.DONE) {
      throw new AppError('INVALID_STATUS', 'Cannot cancel a completed delivery. Use an adjustment instead.', 400);
    }

    if (delivery.status === OperationStatus.CANCELED) {
      throw new AppError('INVALID_STATUS', 'Delivery is already canceled', 400);
    }

    return prisma.delivery.update({
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

export const deliveryService = new DeliveryService();