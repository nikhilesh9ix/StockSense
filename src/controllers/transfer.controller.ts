import { Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transfer.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { createTransferSchema, updateTransferSchema, idParamSchema, transferQuerySchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class TransferController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
        return;
      }
      const data = createTransferSchema.parse(req.body);
      const transfer = await transferService.create({ ...data, createdById: req.user.id });
      sendSuccess(res, transfer, 201);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = transferQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await transferService.findAll({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const transfer = await transferService.findById(id);
      sendSuccess(res, transfer);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateTransferSchema.parse(req.body);
      const transfer = await transferService.update(id, data);
      sendSuccess(res, transfer);
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
      const transfer = await transferService.validate(id, req.user.id);
      sendSuccess(res, transfer);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const transfer = await transferService.cancel(id);
      sendSuccess(res, transfer);
    } catch (error) {
      next(error);
    }
  }
}

export const transferController = new TransferController();