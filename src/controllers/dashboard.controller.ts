import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { dashboardQuerySchema } from '../validators';

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = dashboardQuerySchema.parse(req.query);
      const summary = await dashboardService.getSummary(query);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getFilteredDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = dashboardQuerySchema.parse(req.query);
      const documents = await dashboardService.getFilteredDocuments(query);
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();