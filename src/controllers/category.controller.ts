import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createCategorySchema, updateCategorySchema, idParamSchema } from '../validators';

export class CategoryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoryService.create(data);
      sendSuccess(res, category, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = getPaginationParams(req.query);
      const result = await categoryService.findAll({ page, limit, search });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const category = await categoryService.findById(id);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(id, data);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      await categoryService.delete(id);
      sendSuccess(res, { message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();