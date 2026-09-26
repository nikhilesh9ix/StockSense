import type { Request as ExpressRequest } from 'express';
import type { UserRole } from '../constants';

export interface Request extends ExpressRequest {
  requestId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}