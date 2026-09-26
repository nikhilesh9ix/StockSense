export const UserRole = {
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OperationStatus = {
  DRAFT: 'DRAFT',
  WAITING: 'WAITING',
  READY: 'READY',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
} as const;

export type OperationStatus = (typeof OperationStatus)[keyof typeof OperationStatus];

export const StockLedgerType = {
  RECEIPT: 'RECEIPT',
  DELIVERY: 'DELIVERY',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type StockLedgerType = (typeof StockLedgerType)[keyof typeof StockLedgerType];

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_TRANSFER: 'INVALID_TRANSFER',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;