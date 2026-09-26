import { describe, it, expect, beforeEach } from 'vitest';
import { testPrisma } from './setup';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { OperationStatus, StockLedgerType, UserRole } from '../src/constants';

// Import services
import { inventoryService } from '../src/services/inventory.service';
import { receiptService } from '../src/services/receipt.service';
import { deliveryService } from '../src/services/delivery.service';
import { transferService } from '../src/services/transfer.service';
import { adjustmentService } from '../src/services/adjustment.service';
import { categoryService } from '../src/services/category.service';
import { productService } from '../src/services/product.service';
import { warehouseService } from '../src/services/warehouse.service';
import { locationService } from '../src/services/location.service';

describe('StockSense Core Integration Test', () => {
  let adminUser: any;
  let steelRod: any;
  let mainWarehouse: any;
  let rackA: any;
  let productionFloor: any;

  beforeEach(async () => {
    // Create admin user
    const passwordHash = await argon2.hash('Admin@123');
    adminUser = await testPrisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@stocksense.dev',
        passwordHash,
        role: UserRole.INVENTORY_MANAGER,
      },
    });

    // Create category
    const rawMaterials = await testPrisma.category.create({
      data: {
        name: 'Raw Materials',
        description: 'Raw materials for production',
      },
    });

    // Create product
    steelRod = await testPrisma.product.create({
      data: {
        name: 'Steel Rod',
        sku: 'STL-001',
        categoryId: rawMaterials.id,
        unitOfMeasure: 'PCS',
        reorderLevel: 20,
      },
    });

    // Create warehouse
    mainWarehouse = await testPrisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        address: '123 Industrial Blvd, City',
      },
    });

    // Create locations
    rackA = await testPrisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Rack A',
        code: 'RACK-A',
      },
    });

    productionFloor = await testPrisma.location.create({
      data: {
        warehouseId: mainWarehouse.id,
        name: 'Production Floor',
        code: 'PROD-FLOOR',
      },
    });
  });

  it('should complete full inventory lifecycle: Create Product -> Warehouse -> Locations -> Receipt -> Transfer -> Delivery -> Adjustment', async () => {
    // =============================================
    // STEP 1: Create Receipt for 100 units
    // =============================================
    const receipt = await receiptService.create({
      supplierName: 'Steel Suppliers Inc.',
      items: [
        { productId: steelRod.id, locationId: rackA.id, quantity: 100 },
      ],
      createdById: adminUser.id,
    });

    // Validate receipt (this should increase inventory)
    const validatedReceipt = await receiptService.validate(receipt.id, adminUser.id);
    expect(validatedReceipt.status).toBe(OperationStatus.DONE);

    // Verify inventory = 100
    const inventoryAfterReceipt = await inventoryService.getAvailableStock(steelRod.id, rackA.id);
    expect(inventoryAfterReceipt).toBe(100);

    // Verify ledger entry
    const ledgerAfterReceipt = await testPrisma.stockLedger.findMany({
      where: { productId: steelRod.id, locationId: rackA.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(ledgerAfterReceipt).toHaveLength(1);
    expect(ledgerAfterReceipt[0].type).toBe(StockLedgerType.RECEIPT);
    expect(ledgerAfterReceipt[0].quantity).toBe(100);
    expect(ledgerAfterReceipt[0].balanceAfter).toBe(100);

    // =============================================
    // STEP 2: Transfer 40 units from Rack A to Production Floor
    // =============================================
    const transfer = await transferService.create({
      items: [
        {
          productId: steelRod.id,
          sourceLocationId: rackA.id,
          destinationLocationId: productionFloor.id,
          quantity: 40,
        },
      ],
      createdById: adminUser.id,
    });

    const validatedTransfer = await transferService.validate(transfer.id, adminUser.id);
    expect(validatedTransfer.status).toBe(OperationStatus.DONE);

    // Verify source = 60
    const sourceStock = await inventoryService.getAvailableStock(steelRod.id, rackA.id);
    expect(sourceStock).toBe(60);

    // Verify destination = 40
    const destStock = await inventoryService.getAvailableStock(steelRod.id, productionFloor.id);
    expect(destStock).toBe(40);

    // Verify total inventory remains 100
    const totalStock = await inventoryService.getTotalStock(steelRod.id);
    expect(totalStock).toBe(100);

    // Verify ledger entries (TRANSFER_OUT and TRANSFER_IN)
    const ledgerAfterTransfer = await testPrisma.stockLedger.findMany({
      where: { productId: steelRod.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(ledgerAfterTransfer).toHaveLength(3);
    expect(ledgerAfterTransfer[1].type).toBe(StockLedgerType.TRANSFER_OUT);
    expect(ledgerAfterTransfer[1].quantity).toBe(-40);
    expect(ledgerAfterTransfer[1].balanceAfter).toBe(60);
    expect(ledgerAfterTransfer[2].type).toBe(StockLedgerType.TRANSFER_IN);
    expect(ledgerAfterTransfer[2].quantity).toBe(40);
    expect(ledgerAfterTransfer[2].balanceAfter).toBe(40);

    // =============================================
    // STEP 3: Deliver 20 units from Production Floor
    // =============================================
    const delivery = await deliveryService.create({
      customerName: 'Office Solutions Ltd.',
      items: [
        { productId: steelRod.id, locationId: productionFloor.id, quantity: 20 },
      ],
      createdById: adminUser.id,
    });

    // Pick -> Pack -> Validate
    await deliveryService.pick(delivery.id);
    await deliveryService.pack(delivery.id);
    const validatedDelivery = await deliveryService.validate(delivery.id, adminUser.id);
    expect(validatedDelivery.status).toBe(OperationStatus.DONE);

    // Verify destination = 20 (was 40, delivered 20)
    const destStockAfterDelivery = await inventoryService.getAvailableStock(steelRod.id, productionFloor.id);
    expect(destStockAfterDelivery).toBe(20);

    // Verify ledger entry
    const ledgerAfterDelivery = await testPrisma.stockLedger.findMany({
      where: { productId: steelRod.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(ledgerAfterDelivery).toHaveLength(4);
    expect(ledgerAfterDelivery[3].type).toBe(StockLedgerType.DELIVERY);
    expect(ledgerAfterDelivery[3].quantity).toBe(-20);
    expect(ledgerAfterDelivery[3].balanceAfter).toBe(20);

    // =============================================
    // STEP 4: Adjust to 17 units (counted 17, system had 20)
    // =============================================
    const adjustment = await adjustmentService.create({
      reason: 'Physical count discrepancy',
      items: [
        { productId: steelRod.id, locationId: productionFloor.id, countedQuantity: 17 },
      ],
      createdById: adminUser.id,
    });

    const validatedAdjustment = await adjustmentService.validate(adjustment.id, adminUser.id);
    expect(validatedAdjustment.status).toBe(OperationStatus.DONE);

    // Verify final inventory = 17
    const finalStock = await inventoryService.getAvailableStock(steelRod.id, productionFloor.id);
    expect(finalStock).toBe(17);

    // Verify total stock = 60 (source) + 17 (dest) = 77
    const finalTotalStock = await inventoryService.getTotalStock(steelRod.id);
    expect(finalTotalStock).toBe(77);

    // Verify ledger entry
    const ledgerAfterAdjustment = await testPrisma.stockLedger.findMany({
      where: { productId: steelRod.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(ledgerAfterAdjustment).toHaveLength(5);
    expect(ledgerAfterAdjustment[4].type).toBe(StockLedgerType.ADJUSTMENT);
    expect(ledgerAfterAdjustment[4].quantity).toBe(-3); // 17 - 20 = -3
    expect(ledgerAfterAdjustment[4].balanceAfter).toBe(17);

    // =============================================
    // FINAL VERIFICATION: Complete ledger history
    // =============================================
    const finalLedger = await testPrisma.stockLedger.findMany({
      where: { productId: steelRod.id },
      orderBy: { createdAt: 'asc' },
      select: {
        type: true,
        quantity: true,
        balanceAfter: true,
        locationId: true,
      },
    });

    expect(finalLedger).toEqual([
      // RECEIPT +100 at Rack A
      expect.objectContaining({
        type: StockLedgerType.RECEIPT,
        quantity: 100,
        balanceAfter: 100,
        locationId: rackA.id,
      }),
      // TRANSFER_OUT -40 from Rack A
      expect.objectContaining({
        type: StockLedgerType.TRANSFER_OUT,
        quantity: -40,
        balanceAfter: 60,
        locationId: rackA.id,
      }),
      // TRANSFER_IN +40 to Production Floor
      expect.objectContaining({
        type: StockLedgerType.TRANSFER_IN,
        quantity: 40,
        balanceAfter: 40,
        locationId: productionFloor.id,
      }),
      // DELIVERY -20 from Production Floor
      expect.objectContaining({
        type: StockLedgerType.DELIVERY,
        quantity: -20,
        balanceAfter: 20,
        locationId: productionFloor.id,
      }),
      // ADJUSTMENT -3 at Production Floor
      expect.objectContaining({
        type: StockLedgerType.ADJUSTMENT,
        quantity: -3,
        balanceAfter: 17,
        locationId: productionFloor.id,
      }),
    ]);
  });

  it('should prevent negative inventory on delivery validation', async () => {
    // Create a product with no stock
    const rawMaterials = await testPrisma.category.create({
      data: { name: 'Raw Materials', description: '' },
    });

    const product = await testPrisma.product.create({
      data: {
        name: 'Test Product',
        sku: 'TEST-001',
        categoryId: rawMaterials.id,
        unitOfMeasure: 'PCS',
        reorderLevel: 10,
      },
    });

    const delivery = await deliveryService.create({
      customerName: 'Test Customer',
      items: [{ productId: product.id, locationId: rackA.id, quantity: 10 }],
      createdById: adminUser.id,
    });

    await deliveryService.pick(delivery.id);
    await deliveryService.pack(delivery.id);

    // Should fail due to insufficient stock
    await expect(deliveryService.validate(delivery.id, adminUser.id)).rejects.toThrow('INSUFFICIENT_STOCK');
  });

  it('should reject transfer with same source and destination', async () => {
    await expect(
      transferService.create({
        items: [
          {
            productId: steelRod.id,
            sourceLocationId: rackA.id,
            destinationLocationId: rackA.id,
            quantity: 10,
          },
        ],
        createdById: adminUser.id,
      })
    ).rejects.toThrow('INVALID_TRANSFER');
  });

  it('should calculate adjustment difference correctly', async () => {
    // Set initial stock
    await inventoryService.increaseStock({
      productId: steelRod.id,
      locationId: rackA.id,
      quantity: 100,
      type: StockLedgerType.RECEIPT,
      referenceId: 'TEST-INIT',
      referenceType: 'TEST',
      createdById: adminUser.id,
    });

    // Create adjustment: system=100, counted=97, difference=-3
    const adjustment = await adjustmentService.create({
      reason: 'Test adjustment',
      items: [{ productId: steelRod.id, locationId: rackA.id, countedQuantity: 97 }],
      createdById: adminUser.id,
    });

    expect(adjustment.items[0].systemQuantity).toBe(100);
    expect(adjustment.items[0].countedQuantity).toBe(97);
    expect(adjustment.items[0].difference).toBe(-3);

    // Validate adjustment
    await adjustmentService.validate(adjustment.id, adminUser.id);

    // Verify final stock = 97
    const finalStock = await inventoryService.getAvailableStock(steelRod.id, rackA.id);
    expect(finalStock).toBe(97);

    // Verify ledger entry has difference
    const ledger = await testPrisma.stockLedger.findFirst({
      where: { referenceId: adjustment.id, type: StockLedgerType.ADJUSTMENT },
    });
    expect(ledger?.quantity).toBe(-3);
  });
});

describe('Authentication Tests', () => {
  it('should register a new user', async () => {
    const { authService } = await import('../src/services/auth.service');
    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      role: UserRole.WAREHOUSE_STAFF,
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.tokens.accessToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    const { authService } = await import('../src/services/auth.service');
    
    await authService.register({
      name: 'Test User',
      email: 'duplicate@example.com',
      password: 'Password123',
      role: UserRole.WAREHOUSE_STAFF,
    });

    await expect(
      authService.register({
        name: 'Test User 2',
        email: 'duplicate@example.com',
        password: 'Password123',
        role: UserRole.WAREHOUSE_STAFF,
      })
    ).rejects.toThrow('DUPLICATE_EMAIL');
  });

  it('should login with correct credentials', async () => {
    const { authService } = await import('../src/services/auth.service');
    
    await authService.register({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'Password123',
      role: UserRole.WAREHOUSE_STAFF,
    });

    const result = await authService.login('login@example.com', 'Password123');
    expect(result.user).toBeDefined();
    expect(result.tokens.accessToken).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const { authService } = await import('../src/services/auth.service');
    
    await authService.register({
      name: 'Login Test',
      email: 'login2@example.com',
      password: 'Password123',
      role: UserRole.WAREHOUSE_STAFF,
    });

    await expect(
      authService.login('login2@example.com', 'WrongPassword')
    ).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('Product Tests', () => {
  let category: any;

  beforeEach(async () => {
    category = await testPrisma.category.create({
      data: { name: 'Test Category', description: '' },
    });
  });

  it('should create a product', async () => {
    const product = await productService.create({
      name: 'Test Product',
      sku: 'TEST-001',
      categoryId: category.id,
      unitOfMeasure: 'PCS',
      reorderLevel: 10,
    });

    expect(product).toBeDefined();
    expect(product.sku).toBe('TEST-001');
  });

  it('should reject duplicate SKU', async () => {
    await productService.create({
      name: 'Test Product',
      sku: 'DUPLICATE-001',
      categoryId: category.id,
      unitOfMeasure: 'PCS',
    });

    await expect(
      productService.create({
        name: 'Test Product 2',
        sku: 'DUPLICATE-001',
        categoryId: category.id,
        unitOfMeasure: 'PCS',
      })
    ).rejects.toThrow('DUPLICATE_SKU');
  });

  it('should search products by name and SKU', async () => {
    await productService.create({
      name: 'Steel Rod',
      sku: 'STL-001',
      categoryId: category.id,
      unitOfMeasure: 'PCS',
    });

    await productService.create({
      name: 'Steel Beam',
      sku: 'STL-002',
      categoryId: category.id,
      unitOfMeasure: 'PCS',
    });

    const results = await productService.findAll({ page: 1, limit: 10, search: 'STL-001' });
    expect(results.data).toHaveLength(1);
    expect(results.data[0].sku).toBe('STL-001');
  });
});

describe('Receipt Tests', () => {
  let product: any;
  let location: any;
  let user: any;

  beforeEach(async () => {
    const passwordHash = await argon2.hash('Admin@123');
    user = await testPrisma.user.create({
      data: { name: 'Test', email: 'receipt@test.com', passwordHash, role: UserRole.INVENTORY_MANAGER },
    });

    const category = await testPrisma.category.create({ data: { name: 'Test', description: '' } });
    product = await testPrisma.product.create({
      data: { name: 'Product', sku: 'REC-001', categoryId: category.id, unitOfMeasure: 'PCS' },
    });

    const warehouse = await testPrisma.warehouse.create({ data: { name: 'Warehouse', address: '' } });
    location = await testPrisma.location.create({ data: { warehouseId: warehouse.id, name: 'Loc', code: 'LOC' } });
  });

  it('should create receipt and validate to increase stock', async () => {
    const receipt = await receiptService.create({
      supplierName: 'Supplier',
      items: [{ productId: product.id, locationId: location.id, quantity: 50 }],
      createdById: user.id,
    });

    expect(receipt.status).toBe(OperationStatus.DRAFT);

    await receiptService.validate(receipt.id, user.id);

    const stock = await inventoryService.getAvailableStock(product.id, location.id);
    expect(stock).toBe(50);
  });
});

describe('Transfer Tests', () => {
  let product: any;
  let sourceLocation: any;
  let destLocation: any;
  let user: any;

  beforeEach(async () => {
    const passwordHash = await argon2.hash('Admin@123');
    user = await testPrisma.user.create({
      data: { name: 'Test', email: 'transfer@test.com', passwordHash, role: UserRole.INVENTORY_MANAGER },
    });

    const category = await testPrisma.category.create({ data: { name: 'Test', description: '' } });
    product = await testPrisma.product.create({
      data: { name: 'Product', sku: 'TRF-001', categoryId: category.id, unitOfMeasure: 'PCS' },
    });

    const warehouse = await testPrisma.warehouse.create({ data: { name: 'Warehouse', address: '' } });
    sourceLocation = await testPrisma.location.create({ data: { warehouseId: warehouse.id, name: 'Source', code: 'SRC' } });
    destLocation = await testPrisma.location.create({ data: { warehouseId: warehouse.id, name: 'Dest', code: 'DST' } });
  });

  it('should transfer stock and create two ledger entries', async () => {
    // Add initial stock to source
    await inventoryService.increaseStock({
      productId: product.id,
      locationId: sourceLocation.id,
      quantity: 100,
      type: StockLedgerType.RECEIPT,
      referenceId: 'INIT',
      referenceType: 'INIT',
      createdById: user.id,
    });

    const transfer = await transferService.create({
      items: [{ productId: product.id, sourceLocationId: sourceLocation.id, destinationLocationId: destLocation.id, quantity: 40 }],
      createdById: user.id,
    });

    await transferService.validate(transfer.id, user.id);

    const sourceStock = await inventoryService.getAvailableStock(product.id, sourceLocation.id);
    const destStock = await inventoryService.getAvailableStock(product.id, destLocation.id);

    expect(sourceStock).toBe(60);
    expect(destStock).toBe(40);

    // Verify two ledger entries
    const ledger = await testPrisma.stockLedger.findMany({
      where: { referenceId: transfer.id },
    });
    expect(ledger).toHaveLength(2);
    expect(ledger[0].type).toBe(StockLedgerType.TRANSFER_OUT);
    expect(ledger[1].type).toBe(StockLedgerType.TRANSFER_IN);
  });

  it('should reject transfer with insufficient stock', async () => {
    const transfer = await transferService.create({
      items: [{ productId: product.id, sourceLocationId: sourceLocation.id, destinationLocationId: destLocation.id, quantity: 10 }],
      createdById: user.id,
    });

    await expect(transferService.validate(transfer.id, user.id)).rejects.toThrow('INSUFFICIENT_STOCK');
  });
});

describe('Adjustment Tests', () => {
  let product: any;
  let location: any;
  let user: any;

  beforeEach(async () => {
    const passwordHash = await argon2.hash('Admin@123');
    user = await testPrisma.user.create({
      data: { name: 'Test', email: 'adj@test.com', passwordHash, role: UserRole.INVENTORY_MANAGER },
    });

    const category = await testPrisma.category.create({ data: { name: 'Test', description: '' } });
    product = await testPrisma.product.create({
      data: { name: 'Product', sku: 'ADJ-001', categoryId: category.id, unitOfMeasure: 'PCS' },
    });

    const warehouse = await testPrisma.warehouse.create({ data: { name: 'Warehouse', address: '' } });
    location = await testPrisma.location.create({ data: { warehouseId: warehouse.id, name: 'Loc', code: 'LOC' } });
  });

  it('should adjust inventory to counted quantity and create ledger', async () => {
    // System has 100
    await inventoryService.increaseStock({
      productId: product.id,
      locationId: location.id,
      quantity: 100,
      type: StockLedgerType.RECEIPT,
      referenceId: 'INIT',
      referenceType: 'INIT',
      createdById: user.id,
    });

    // Counted 97, difference = -3
    const adjustment = await adjustmentService.create({
      reason: 'Cycle count',
      items: [{ productId: product.id, locationId: location.id, countedQuantity: 97 }],
      createdById: user.id,
    });

    expect(adjustment.items[0].systemQuantity).toBe(100);
    expect(adjustment.items[0].difference).toBe(-3);

    await adjustmentService.validate(adjustment.id, user.id);

    const finalStock = await inventoryService.getAvailableStock(product.id, location.id);
    expect(finalStock).toBe(97);

    const ledger = await testPrisma.stockLedger.findFirst({
      where: { referenceId: adjustment.id, type: StockLedgerType.ADJUSTMENT },
    });
    expect(ledger?.quantity).toBe(-3);
  });
});