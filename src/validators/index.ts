import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']).default('WAREHOUSE_STAFF'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50),
  categoryId: z.string().cuid('Invalid category ID'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(20),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative').default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().cuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
});

export const updateLocationSchema = createLocationSchema.partial();

export const warehouseIdParamSchema = z.object({
  warehouseId: z.string().cuid(),
});

export const locationIdParamSchema = z.object({
  locationId: z.string().cuid(),
});

export const productIdParamSchema = z.object({
  productId: z.string().cuid(),
});

export const receiptItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  locationId: z.string().cuid('Invalid location ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createReceiptSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200),
  items: z.array(receiptItemSchema).min(1, 'At least one item is required'),
});

export const updateReceiptSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200).optional(),
  items: z.array(receiptItemSchema).min(1, 'At least one item is required').optional(),
});

export const receiptQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const deliveryItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  locationId: z.string().cuid('Invalid location ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createDeliverySchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  items: z.array(deliveryItemSchema).min(1, 'At least one item is required'),
});

export const updateDeliverySchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200).optional(),
  items: z.array(deliveryItemSchema).min(1, 'At least one item is required').optional(),
});

export const deliveryQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const transferItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  sourceLocationId: z.string().cuid('Invalid source location ID'),
  destinationLocationId: z.string().cuid('Invalid destination location ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createTransferSchema = z.object({
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
});

export const updateTransferSchema = z.object({
  items: z.array(transferItemSchema).min(1, 'At least one item is required').optional(),
});

export const transferQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const adjustmentItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  locationId: z.string().cuid('Invalid location ID'),
  countedQuantity: z.number().int().min(0, 'Counted quantity cannot be negative'),
});

export const createAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  items: z.array(adjustmentItemSchema).min(1, 'At least one item is required'),
});

export const updateAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500).optional(),
  items: z.array(adjustmentItemSchema).min(1, 'At least one item is required').optional(),
});

export const adjustmentQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const inventoryQuerySchema = paginationSchema.extend({
  productId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
});

export const ledgerQuerySchema = paginationSchema.extend({
  productId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  type: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const dashboardQuerySchema = z.object({
  documentType: z.enum(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT']).optional(),
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']).optional(),
  warehouseId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ReceiptQuery = z.infer<typeof receiptQuerySchema>;
export type DeliveryQuery = z.infer<typeof deliveryQuerySchema>;
export type TransferQuery = z.infer<typeof transferQuerySchema>;
export type AdjustmentQuery = z.infer<typeof adjustmentQuerySchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;