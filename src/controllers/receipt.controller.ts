import type { Request, Response, NextFunction } from 'express';
import { receiptService } from '../services/receipt.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createReceiptSchema, updateReceiptSchema, idParamSchema, receiptQuerySchema } from '../validators';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReceiptController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        return;
      }
      const data = createReceiptSchema.parse(req.body);
      const receipt = await receiptService.create({ ...data, createdById: req.user.id });
      sendSuccess(res, receipt, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = receiptQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await receiptService.findAll({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const receipt = await receiptService.findById(id);
      sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateReceiptSchema.parse(req.body);
      const receipt = await receiptService.update(id, data);
      sendSuccess(res, receipt);
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
      const receipt = await receiptService.validate(id, req.user.id);
      sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const receipt = await receiptService.cancel(id);
      sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  }
}

export const receiptController = new ReceiptController();