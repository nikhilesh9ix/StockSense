import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient({
  log: ['error'],
});

beforeAll(async () => {
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  await testPrisma.stockLedger.deleteMany();
  await testPrisma.adjustmentItem.deleteMany();
  await testPrisma.adjustment.deleteMany();
  await testPrisma.transferItem.deleteMany();
  await testPrisma.transfer.deleteMany();
  await testPrisma.deliveryItem.deleteMany();
  await testPrisma.delivery.deleteMany();
  await testPrisma.receiptItem.deleteMany();
  await testPrisma.receipt.deleteMany();
  await testPrisma.inventory.deleteMany();
  await testPrisma.location.deleteMany();
  await testPrisma.warehouse.deleteMany();
  await testPrisma.product.deleteMany();
  await testPrisma.category.deleteMany();
  await testPrisma.user.deleteMany();
});

afterEach(async () => {
  // Clean up after each test
});

vi.setConfig({ testTimeout: 10000 });