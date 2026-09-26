import type { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/location.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createLocationSchema, updateLocationSchema, idParamSchema, warehouseIdParamSchema } from '../validators';

export class LocationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId } = warehouseIdParamSchema.parse(req.params);
      const data = createLocationSchema.parse(req.body);
      const location = await locationService.create({ ...data, warehouseId });
      sendSuccess(res, location, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search } = getPaginationParams(req.query);
      const { warehouseId } = warehouseIdParamSchema.parse(req.params);
      const result = await locationService.findAll({ page, limit, search, warehouseId });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const location = await locationService.findById(id);
      sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateLocationSchema.parse(req.body);
      const location = await locationService.update(id, data);
      sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      await locationService.delete(id);
      sendSuccess(res, { message: 'Location deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();