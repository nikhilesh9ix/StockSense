import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PaginatedResult } from '../types';

export interface WarehouseCreateInput {
  name: string;
  address?: string;
}

export interface WarehouseUpdateInput {
  name?: string;
  address?: string;
}

export interface WarehouseQuery {
  page: number;
  limit: number;
  search?: string;
}

export class WarehouseService {
  async create(data: WarehouseCreateInput) {
    return prisma.warehouse.create({
      data,
    });
  }

  async findAll(query: WarehouseQuery): Promise<PaginatedResult<any>> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          locations: true,
          _count: {
            select: { locations: true },
          },
        },
      }),
      prisma.warehouse.count({ where }),
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
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
      },
    });

    if (!warehouse) {
      throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    }

    return warehouse;
  }

  async update(id: string, data: WarehouseUpdateInput) {
    await this.findById(id);

    return prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const locationCount = await prisma.location.count({
      where: { warehouseId: id },
    });

    if (locationCount > 0) {
      throw new AppError('RESOURCE_IN_USE', 'Cannot delete warehouse with existing locations', 409);
    }

    return prisma.warehouse.delete({
      where: { id },
    });
  }
}

export const warehouseService = new WarehouseService();