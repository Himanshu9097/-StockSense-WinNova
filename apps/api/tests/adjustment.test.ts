import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import { AdjustmentService } from '../src/services/adjustmentService';
import { Product, Warehouse, Location, Stock, Adjustment, StockLedger } from '../src/models';

dotenv.config();

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksense');
  console.log('Connected to MongoDB for tests');

  // Setup mock data
  const p = await Product.create({ name: 'Test Product', sku: 'TEST-001' });
  const w = await Warehouse.create({ name: 'Test Warehouse', code: 'TW1' });
  const w2 = await Warehouse.create({ name: 'Test Warehouse 2', code: 'TW2' });
  const l = await Location.create({ name: 'Test Location', warehouseId: w._id });
  
  await Stock.create({ productId: p._id, warehouseId: w._id, locationId: l._id, quantity: 100 });

  console.log('--- Running Tests ---');
  let passed = 0;
  let failed = 0;

  const mockUserId = new mongoose.Types.ObjectId().toString();

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`❌ ${name}`);
      console.error(e.message);
      failed++;
    }
  }

  await test('Test 1 — Decrease', async () => {
    const adj = await AdjustmentService.createAdjustment({
      productId: p._id.toString(),
      warehouseId: w._id.toString(),
      locationId: l._id.toString(),
      expectedSystemQuantity: 100,
      countedQuantity: 97,
      reason: 'Damaged'
    }, mockUserId);

    const stock = await Stock.findOne({ productId: p._id, locationId: l._id });
    assert.strictEqual(stock!.quantity, 97);
    assert.strictEqual(adj.difference, -3);

    const ledger = await StockLedger.findOne({ productId: p._id }).sort({ createdAt: -1 });
    assert.strictEqual(ledger!.change, -3);
  });

  await test('Test 2 — Increase', async () => {
    const adj = await AdjustmentService.createAdjustment({
      productId: p._id.toString(),
      warehouseId: w._id.toString(),
      locationId: l._id.toString(),
      expectedSystemQuantity: 97, // from prev test
      countedQuantity: 110,
      reason: 'Found'
    }, mockUserId);

    const stock = await Stock.findOne({ productId: p._id, locationId: l._id });
    assert.strictEqual(stock!.quantity, 110);
    assert.strictEqual(adj.difference, 13); // Wait, if prev was 97 and new is 110, diff is 13.

    const ledger = await StockLedger.findOne({ productId: p._id }).sort({ createdAt: -1 });
    assert.strictEqual(ledger!.change, 13);
  });

  await test('Test 3 — Same Quantity', async () => {
    try {
      await AdjustmentService.createAdjustment({
        productId: p._id.toString(),
        warehouseId: w._id.toString(),
        locationId: l._id.toString(),
        expectedSystemQuantity: 110,
        countedQuantity: 110,
        reason: 'Counting Error'
      }, mockUserId);
      throw new Error('Should have thrown No adjustment required');
    } catch (err: any) {
      assert.strictEqual(err.message, 'No adjustment required');
    }
  });

  await test('Test 4 — Invalid Negative Count', async () => {
    try {
      await AdjustmentService.createAdjustment({
        productId: p._id.toString(),
        warehouseId: w._id.toString(),
        locationId: l._id.toString(),
        expectedSystemQuantity: 110,
        countedQuantity: -5,
        reason: 'Counting Error'
      }, mockUserId);
      throw new Error('Should have thrown Physical count cannot be negative');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Physical count cannot be negative');
    }
  });

  await test('Test 5 — Invalid Location', async () => {
    try {
      await AdjustmentService.createAdjustment({
        productId: p._id.toString(),
        warehouseId: w2._id.toString(), // w2 does not own l
        locationId: l._id.toString(),
        expectedSystemQuantity: 110,
        countedQuantity: 90,
        reason: 'Counting Error'
      }, mockUserId);
      throw new Error('Should have thrown Location does not belong to selected warehouse');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Location does not belong to selected warehouse');
    }
  });

  await test('Test 7 — Concurrent Update', async () => {
    try {
      await AdjustmentService.createAdjustment({
        productId: p._id.toString(),
        warehouseId: w._id.toString(),
        locationId: l._id.toString(),
        expectedSystemQuantity: 50, // actual is 110
        countedQuantity: 40,
        reason: 'Counting Error'
      }, mockUserId);
      throw new Error('Should have thrown Stock changed');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Stock changed since this adjustment was started. Please refresh and recount.');
    }
  });

  console.log(`\nTests passed: ${passed}, Tests failed: ${failed}`);

  // Cleanup
  await Product.deleteOne({ _id: p._id });
  await Warehouse.deleteMany({ _id: { $in: [w._id, w2._id] } });
  await Location.deleteOne({ _id: l._id });
  await Stock.deleteOne({ productId: p._id });
  await Adjustment.deleteMany({ productId: p._id });
  await StockLedger.deleteMany({ productId: p._id });

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
