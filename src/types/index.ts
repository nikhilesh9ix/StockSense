import { UserRole, OperationStatus, StockLedgerType } from '../constants';

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventorySummary {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string;
  unitOfMeasure: string;
  reorderLevel: number;
  totalQuantity: number;
  locations: Array<{
    locationId: string;
    locationName: string;
    locationCode: string;
    warehouseName: string;
    quantity: number;
  }>;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface DashboardSummary {
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export interface LedgerEntry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  warehouseName: string;
  type: StockLedgerType;
  quantity: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: string;
  createdByName: string;
  createdAt: Date;
}

export interface StockMovement {
  productId: string;
  locationId: string;
  quantity: number;
  type: StockLedgerType;
  referenceId: string;
  referenceType: string;
  createdById: string;
}

export interface ValidateOperationResult {
  success: boolean;
  message?: string;
}

export interface InventoryAdjustment {
  productId: string;
  locationId: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
}