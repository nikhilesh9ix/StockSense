import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PaginatedResult } from '../types';

export interface CategoryCreateInput {
  name: string;
  description?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
}

export interface CategoryQuery {
  page: number;
  limit: number;
  search?: string;
}

export class CategoryService {
  async create(data: CategoryCreateInput) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('VALIDATION_ERROR', 'Category with this name already exists', 409);
    }

    return prisma.category.create({
      data,
    });
  }

  async findAll(query: CategoryQuery): Promise<PaginatedResult<any>> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.category.count({ where }),
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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('NOT_FOUND', 'Category not found', 404);
    }

    return category;
  }

  async update(id: string, data: CategoryUpdateInput) {
    await this.findById(id);

    if (data.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        throw new AppError('VALIDATION_ERROR', 'Category with this name already exists', 409);
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new AppError('RESOURCE_IN_USE', 'Cannot delete category with associated products', 409);
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();