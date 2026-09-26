import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/response';
import { idParamSchema, inventoryQuerySchema, productIdParamSchema, locationIdParamSchema } from '../validators';

export class InventoryController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = inventoryQuerySchema.parse(req.query);
      const { page, limit } = getPaginationParams(query);
      const result = await inventoryService.getInventorySummary({ ...query, page, limit });
      sendPaginatedSuccess(res, result.data, result.pagination.page, result.pagination.limit, result.pagination.total);
    } catch (error) {
      next(error);
    }
  }

  async findByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = productIdParamSchema.parse(req.params);
      const inventory = await inventoryService.getProductInventory(productId);
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  }

  async findByLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId } = locationIdParamSchema.parse(req.params);
      const inventory = await inventoryService.getLocationInventory(locationId);
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();