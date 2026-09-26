import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from './auth.middleware';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403));
    }

    next();
  };
}

export const requireInventoryManager = requireRole(UserRole.INVENTORY_MANAGER);
export const requireWarehouseStaff = requireRole(UserRole.WAREHOUSE_STAFF, UserRole.INVENTORY_MANAGER);