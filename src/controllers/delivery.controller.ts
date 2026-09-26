import type { Request, Response, NextFunction } from 'express';
import { deliveryService } from '../services/delivery.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createDeliverySchema, updateDeliverySchema, idParamSchema, deliveryQuerySchema } from '../validators';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DeliveryController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        return;
      }
      const data = createDeliverySchema.parse(req.body);
      const delivery = await deliveryService.create({ ...data, createdById: req.user.id });
      sendSuccess(res, delivery, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = deliveryQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await deliveryService.findAll({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const delivery = await deliveryService.findById(id);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateDeliverySchema.parse(req.body);
      const delivery = await deliveryService.update(id, data);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async pick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const delivery = await deliveryService.pick(id);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async pack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const delivery = await deliveryService.pack(id);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async validate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        return;
      }
      const { id } = idParamSchema.parse(req.params);
      const delivery = await deliveryService.validate(id, req.user.id);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const delivery = await deliveryService.cancel(id);
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }
}

export const deliveryController = new DeliveryController();