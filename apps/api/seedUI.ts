import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product, Location, Warehouse, Zone, InventoryBalance, Receipt, PutawayTask } from './src/models';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksense');
  console.log('Connected to DB');

  const w = await Warehouse.create({ name: 'Central Fulfillment Center', code: 'CFC-1' });
  const z = await Zone.create({ name: 'High Velocity A', code: 'Z-HVA', warehouseId: w._id, zoneType: 'STORAGE' });

  // 10 Bins
  for (let i = 1; i <= 10; i++) {
    await Location.create({
      code: `A-01-${i.toString().padStart(2, '0')}`,
      type: 'BIN',
      warehouseId: w._id,
      zoneId: z._id,
      capacity: 500,
      status: 'ACTIVE'
    });
  }

  // 5 Products
  const p1 = await Product.create({ name: 'Ergonomic Chair', sku: 'FUR-EC-01', uom: 'PCS', category: 'Furniture' });
  const p2 = await Product.create({ name: 'Mechanical Keyboard', sku: 'ELC-MK-01', uom: 'PCS', category: 'Electronics', trackSerial: true });
  const p3 = await Product.create({ name: 'Monitor Arm', sku: 'ELC-MA-02', uom: 'PCS', category: 'Electronics' });

  // 2 Receipts
  const adminUser = new mongoose.Types.ObjectId(); // fake user
  
  const r1 = await Receipt.create({
    receiptNumber: `RCV-${Date.now()}-1`,
    warehouseId: w._id,
    supplier: 'Herman Miller',
    status: 'EXPECTED',
    createdBy: adminUser,
    lines: [
      { productId: p1._id, expectedQuantity: 50, receivedQuantity: 0 }
    ]
  });

  const r2 = await Receipt.create({
    receiptNumber: `RCV-${Date.now()}-2`,
    warehouseId: w._id,
    supplier: 'Keychron',
    status: 'RECEIVING',
    createdBy: adminUser,
    lines: [
      { productId: p2._id, expectedQuantity: 100, receivedQuantity: 20 }
    ]
  });

  // A Putaway Task
  const bin = await Location.findOne();
  await PutawayTask.create({
    taskId: `PTW-${Date.now()}`,
    receiptId: r2._id,
    productId: p2._id,
    quantity: 20,
    suggestedLocationId: bin!._id,
    status: 'PENDING'
  });

  console.log('Seeded data! Go check the UI.');
  await mongoose.disconnect();
}

seed();
