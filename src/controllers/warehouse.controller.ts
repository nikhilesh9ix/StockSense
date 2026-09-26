import { Request, Response, NextFunction } from 'express';
import { warehouseService } from '../services/warehouse.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createWarehouseSchema, updateWarehouseSchema, idParamSchema } from '../validators';

export class WarehouseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createWarehouseSchema.parse(req.body);
      const warehouse = await warehouseService.create(data);
      sendSuccess(res, warehouse, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = getPaginationParams(req.query);
      const result = await warehouseService.findAll({ page, limit, search });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const warehouse = await warehouseService.findById(id);
      sendSuccess(res, warehouse);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateWarehouseSchema.parse(req.body);
      const warehouse = await warehouseService.update(id, data);
      sendSuccess(res, warehouse);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      await warehouseService.delete(id);
      sendSuccess(res, { message: 'Warehouse deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const warehouseController = new WarehouseController();