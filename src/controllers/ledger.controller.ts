import { Request, Response, NextFunction } from 'express';
import { ledgerService } from '../services/ledger.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { idParamSchema, ledgerQuerySchema, productIdParamSchema, locationIdParamSchema } from '../validators';

export class LedgerController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ledgerQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await ledgerService.findAll({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const ledger = await ledgerService.findById(id);
      sendSuccess(res, ledger);
    } catch (error) {
      next(error);
    }
  }

  async findByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = productIdParamSchema.parse(req.params);
      const query = ledgerQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await ledgerService.findByProduct(productId, { ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findByLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId } = locationIdParamSchema.parse(req.params);
      const query = ledgerQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await ledgerService.findByLocation(locationId, { ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }
}

export const ledgerController = new LedgerController();