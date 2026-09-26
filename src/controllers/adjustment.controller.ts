import { Request, Response, NextFunction } from 'express';
import { adjustmentService } from '../services/adjustment.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createAdjustmentSchema, updateAdjustmentSchema, idParamSchema, adjustmentQuerySchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AdjustmentController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        return;
      }
      const data = createAdjustmentSchema.parse(req.body);
      const adjustment = await adjustmentService.create({ ...data, createdById: req.user.id });
      sendSuccess(res, adjustment, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adjustmentQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await adjustmentService.findAll({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const adjustment = await adjustmentService.findById(id);
      sendSuccess(res, adjustment);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateAdjustmentSchema.parse(req.body);
      const adjustment = await adjustmentService.update(id, data);
      sendSuccess(res, adjustment);
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
      const adjustment = await adjustmentService.validate(id, req.user.id);
      sendSuccess(res, adjustment);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const adjustment = await adjustmentService.cancel(id);
      sendSuccess(res, adjustment);
    } catch (error) {
      next(error);
    }
  }
}

export const adjustmentController = new AdjustmentController();