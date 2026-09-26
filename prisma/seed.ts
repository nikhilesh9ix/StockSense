import { PrismaClient, UserRole, OperationStatus, StockLedgerType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.stockLedger.deleteMany();
  await prisma.adjustmentItem.deleteMany();
  await prisma.adjustment.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await argon2.hash('Admin@123');
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@stocksense.dev',
      passwordHash,
      role: UserRole.INVENTORY_MANAGER,
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Warehouse Staff',
      email: 'staff@stocksense.dev',
      passwordHash: await argon2.hash('Staff@123'),
      role: UserRole.WAREHOUSE_STAFF,
    },
  });

  console.log('✅ Users created');

  // Create Categories
  const rawMaterials = await prisma.category.create({
    data: {
      name: 'Raw Materials',
      description: 'Raw materials for production',
    },
  });

  const finishedGoods = await prisma.category.create({
    data: {
      name: 'Finished Goods',
      description: 'Finished products ready for sale',
    },
  });

  const officeSupplies = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      description: 'Office and administrative supplies',
    },
  });

  console.log('✅ Categories created');

  // Create Products
  const steelRod = await prisma.product.create({
    data: {
      name: 'Steel Rod',
      sku: 'STL-001',
      categoryId: rawMaterials.id,
      unitOfMeasure: 'PCS',
      reorderLevel: 20,
    },
  });

  const officeChair = await prisma.product.create({
    data: {
      name: 'Office Chair',
      sku: 'CHR-001',
      categoryId: finishedGoods.id,
      unitOfMeasure: 'PCS',
      reorderLevel: 10,
    },
  });

  const laptop = await prisma.product.create({
    data: {
      name: 'Laptop',
      sku: 'LAP-001',
      categoryId: finishedGoods.id,
      unitOfMeasure: 'PCS',
      reorderLevel: 5,
    },
  });

  const printerPaper = await prisma.product.create({
    data: {
      name: 'Printer Paper A4',
      sku: 'PAP-001',
      categoryId: officeSupplies.id,
      unitOfMeasure: 'REAM',
      reorderLevel: 50,
    },
  });

  const inkCartridge = await prisma.product.create({
    data: {
      name: 'Ink Cartridge Black',
      sku: 'INK-001',
      categoryId: officeSupplies.id,
      unitOfMeasure: 'PCS',
      reorderLevel: 15,
    },
  });

  console.log('✅ Products created');

  // Create Warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      address: '123 Industrial Blvd, City',
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      address: '456 Commerce Ave, City',
    },
  });

  console.log('✅ Warehouses created');

  // Create Locations
  const rackA = await prisma.location.create({
    data: {
      warehouseId: mainWarehouse.id,
      name: 'Rack A',
      code: 'RACK-A',
    },
  });

  const rackB = await prisma.location.create({
    data: {
      warehouseId: mainWarehouse.id,
      name: 'Rack B',
      code: 'RACK-B',
    },
  });

  const productionFloor = await prisma.location.create({
    data: {
      warehouseId: mainWarehouse.id,
      name: 'Production Floor',
      code: 'PROD-FLOOR',
    },
  });

  const secondaryRack = await prisma.location.create({
    data: {
      warehouseId: secondaryWarehouse.id,
      name: 'Rack 1',
      code: 'RACK-1',
    },
  });

  console.log('✅ Locations created');

  // Create Initial Inventory
  await prisma.inventory.createMany({
    data: [
      { productId: steelRod.id, locationId: rackA.id, quantity: 100 },
      { productId: officeChair.id, locationId: rackB.id, quantity: 50 },
      { productId: laptop.id, locationId: rackA.id, quantity: 20 },
      { productId: printerPaper.id, locationId: secondaryRack.id, quantity: 200 },
      { productId: inkCartridge.id, locationId: rackB.id, quantity: 30 },
    ],
  });

  console.log('✅ Initial inventory created');

  // Create Stock Ledger entries for initial inventory
  const initialLedgerEntries = [
    { productId: steelRod.id, locationId: rackA.id, type: StockLedgerType.RECEIPT, quantity: 100, balanceAfter: 100, referenceId: 'INIT', referenceType: 'INITIAL', createdById: admin.id },
    { productId: officeChair.id, locationId: rackB.id, type: StockLedgerType.RECEIPT, quantity: 50, balanceAfter: 50, referenceId: 'INIT', referenceType: 'INITIAL', createdById: admin.id },
    { productId: laptop.id, locationId: rackA.id, type: StockLedgerType.RECEIPT, quantity: 20, balanceAfter: 20, referenceId: 'INIT', referenceType: 'INITIAL', createdById: admin.id },
    { productId: printerPaper.id, locationId: secondaryRack.id, type: StockLedgerType.RECEIPT, quantity: 200, balanceAfter: 200, referenceId: 'INIT', referenceType: 'INITIAL', createdById: admin.id },
    { productId: inkCartridge.id, locationId: rackB.id, type: StockLedgerType.RECEIPT, quantity: 30, balanceAfter: 30, referenceId: 'INIT', referenceType: 'INITIAL', createdById: admin.id },
  ];

  await prisma.stockLedger.createMany({ data: initialLedgerEntries });

  console.log('✅ Initial stock ledger entries created');

  // Create Sample Receipt
  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber: 'RCPT-001',
      supplierName: 'Steel Suppliers Inc.',
      status: OperationStatus.DONE,
      createdById: admin.id,
      validatedAt: new Date(),
      items: {
        create: [
          { productId: steelRod.id, locationId: rackA.id, quantity: 50 },
          { productId: officeChair.id, locationId: rackB.id, quantity: 20 },
        ],
      },
    },
  });

  // Update inventory for receipt
  await prisma.inventory.update({
    where: { productId_locationId: { productId: steelRod.id, locationId: rackA.id } },
    data: { quantity: { increment: 50 } },
  });

  await prisma.inventory.update({
    where: { productId_locationId: { productId: officeChair.id, locationId: rackB.id } },
    data: { quantity: { increment: 20 } },
  });

  // Create ledger entries for receipt
  await prisma.stockLedger.createMany({
    data: [
      { productId: steelRod.id, locationId: rackA.id, type: StockLedgerType.RECEIPT, quantity: 50, balanceAfter: 150, referenceId: receipt.id, referenceType: 'RECEIPT', createdById: admin.id },
      { productId: officeChair.id, locationId: rackB.id, type: StockLedgerType.RECEIPT, quantity: 20, balanceAfter: 70, referenceId: receipt.id, referenceType: 'RECEIPT', createdById: admin.id },
    ],
  });

  console.log('✅ Sample receipt created');

  // Create Sample Delivery
  const delivery = await prisma.delivery.create({
    data: {
      deliveryNumber: 'DEL-001',
      customerName: 'Office Solutions Ltd.',
      status: OperationStatus.DONE,
      createdById: admin.id,
      validatedAt: new Date(),
      items: {
        create: [
          { productId: laptop.id, locationId: rackA.id, quantity: 5 },
        ],
      },
    },
  });

  // Update inventory for delivery
  await prisma.inventory.update({
    where: { productId_locationId: { productId: laptop.id, locationId: rackA.id } },
    data: { quantity: { decrement: 5 } },
  });

  // Create ledger entries for delivery
  await prisma.stockLedger.createMany({
    data: [
      { productId: laptop.id, locationId: rackA.id, type: StockLedgerType.DELIVERY, quantity: -5, balanceAfter: 15, referenceId: delivery.id, referenceType: 'DELIVERY', createdById: admin.id },
    ],
  });

  console.log('✅ Sample delivery created');

  // Create Sample Transfer
  const transfer = await prisma.transfer.create({
    data: {
      transferNumber: 'TRF-001',
      status: OperationStatus.DONE,
      createdById: admin.id,
      validatedAt: new Date(),
      items: {
        create: [
          { productId: steelRod.id, sourceLocationId: rackA.id, destinationLocationId: productionFloor.id, quantity: 30 },
        ],
      },
    },
  });

  // Update inventory for transfer
  await prisma.inventory.update({
    where: { productId_locationId: { productId: steelRod.id, locationId: rackA.id } },
    data: { quantity: { decrement: 30 } },
  });

  await prisma.inventory.upsert({
    where: { productId_locationId: { productId: steelRod.id, locationId: productionFloor.id } },
    update: { quantity: { increment: 30 } },
    create: { productId: steelRod.id, locationId: productionFloor.id, quantity: 30 },
  });

  // Create ledger entries for transfer
  await prisma.stockLedger.createMany({
    data: [
      { productId: steelRod.id, locationId: rackA.id, type: StockLedgerType.TRANSFER_OUT, quantity: -30, balanceAfter: 120, referenceId: transfer.id, referenceType: 'TRANSFER', createdById: admin.id },
      { productId: steelRod.id, locationId: productionFloor.id, type: StockLedgerType.TRANSFER_IN, quantity: 30, balanceAfter: 30, referenceId: transfer.id, referenceType: 'TRANSFER', createdById: admin.id },
    ],
  });

  console.log('✅ Sample transfer created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });