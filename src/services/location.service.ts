import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PaginatedResult } from '../types';

export interface LocationCreateInput {
  warehouseId: string;
  name: string;
  code: string;
}

export interface LocationUpdateInput {
  name?: string;
  code?: string;
}

export interface LocationQuery {
  page: number;
  limit: number;
  search?: string;
  warehouseId?: string;
}

export class LocationService {
  async create(data: LocationCreateInput) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });

    if (!warehouse) {
      throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    }

    const existingCode = await prisma.location.findFirst({
      where: { warehouseId: data.warehouseId, code: data.code },
    });

    if (existingCode) {
      throw new AppError('VALIDATION_ERROR', 'Location code already exists in this warehouse', 409);
    }

    return prisma.location.create({
      data,
      include: { warehouse: true },
    });
  }

  async findAll(query: LocationQuery): Promise<PaginatedResult<any>> {
    const { page, limit, search, warehouseId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: true,
          _count: {
            select: { inventory: true },
          },
        },
      }),
      prisma.location.count({ where }),
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
    const location = await prisma.location.findUnique({
      where: { id },
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

    return location;
  }

  async update(id: string, data: LocationUpdateInput) {
    await this.findById(id);

    if (data.code) {
      const location = await prisma.location.findUnique({
        where: { id },
      });

      if (location) {
        const existingCode = await prisma.location.findFirst({
          where: { warehouseId: location.warehouseId, code: data.code, NOT: { id } },
        });

        if (existingCode) {
          throw new AppError('VALIDATION_ERROR', 'Location code already exists in this warehouse', 409);
        }
      }
    }

    return prisma.location.update({
      where: { id },
      data,
      include: { warehouse: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const inventoryCount = await prisma.inventory.count({
      where: { locationId: id },
    });

    if (inventoryCount > 0) {
      throw new AppError('RESOURCE_IN_USE', 'Cannot delete location with existing inventory', 409);
    }

    return prisma.location.delete({
      where: { id },
    });
  }
}

export const locationService = new LocationService();