import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
  });

  if (isAppError(error)) {
    sendError(res, { code: error.code, message: error.message, details: error.details }, error.statusCode);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      HTTP_STATUS.BAD_REQUEST
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field';
      sendError(
        res,
        { code: 'VALIDATION_ERROR', message: `Duplicate value for ${target}` },
        HTTP_STATUS.CONFLICT
      );
      return;
    }
    if (error.code === 'P2003') {
      sendError(
        res,
        { code: 'VALIDATION_ERROR', message: 'Referenced record not found' },
        HTTP_STATUS.BAD_REQUEST
      );
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    sendError(
      res,
      { code: 'VALIDATION_ERROR', message: 'Invalid data provided' },
      HTTP_STATUS.BAD_REQUEST
    );
    return;
  }

  sendError(
    res,
    { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }, 404);
}