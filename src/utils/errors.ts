import { ErrorCode, HTTP_STATUS } from '../constants';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
  }

  static duplicateSku(): AppError {
    return new AppError(ErrorCode.DUPLICATE_SKU, 'SKU already exists', HTTP_STATUS.CONFLICT);
  }

  static duplicateEmail(): AppError {
    return new AppError(ErrorCode.DUPLICATE_EMAIL, 'Email already exists', HTTP_STATUS.CONFLICT);
  }

  static insufficientStock(): AppError {
    return new AppError(ErrorCode.INSUFFICIENT_STOCK, 'Insufficient stock available', HTTP_STATUS.BAD_REQUEST);
  }

  static invalidStatus(): AppError {
    return new AppError(ErrorCode.INVALID_STATUS, 'Invalid status transition', HTTP_STATUS.BAD_REQUEST);
  }

  static invalidTransfer(): AppError {
    return new AppError(ErrorCode.INVALID_TRANSFER, 'Invalid transfer operation', HTTP_STATUS.BAD_REQUEST);
  }

  static invalidQuantity(): AppError {
    return new AppError(ErrorCode.INVALID_QUANTITY, 'Invalid quantity', HTTP_STATUS.BAD_REQUEST);
  }

  static resourceInUse(resource = 'Resource'): AppError {
    return new AppError(ErrorCode.RESOURCE_IN_USE, `${resource} is in use and cannot be deleted`, HTTP_STATUS.CONFLICT);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}