import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import type { PaginatedResult } from '../types';

export interface LedgerQuery {
  page: number;
  limit: number;
  productId?: string;
  locationId?: string;
  warehouseId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export class LedgerService {
  async findAll(query: LedgerQuery): Promise<PaginatedResult<any>> {
    const { page, limit, productId, locationId, warehouseId, type, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (productId) where.productId = productId;
    if (locationId) where.locationId = locationId;
    if (warehouseId) {
      where.location = { warehouseId };
    }
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { include: { category: true } },
          location: { include: { warehouse: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.stockLedger.count({ where }),
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
    const ledger = await prisma.stockLedger.findUnique({
      where: { id },
      include: {
        product: { include: { category: true } },
        location: { include: { warehouse: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ledger) {
      throw new AppError('NOT_FOUND', 'Ledger entry not found', 404);
    }

    return ledger;
  }

  async findByProduct(productId: string, query: Omit<LedgerQuery, 'productId'>): Promise<PaginatedResult<any>> {
    return this.findAll({ ...query, productId });
  }

  async findByLocation(locationId: string, query: Omit<LedgerQuery, 'locationId'>): Promise<PaginatedResult<any>> {
    return this.findAll({ ...query, locationId });
  }
}

export const ledgerService = new LedgerService();