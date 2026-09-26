import mongoose from 'mongoose';
import { Product, Warehouse, Location, Stock } from './src/models';

mongoose.connect('mongodb://localhost:27017/stocksense').then(async () => {
  await Product.deleteMany({});
  await Warehouse.deleteMany({});
  await Location.deleteMany({});
  await Stock.deleteMany({});
  const p1 = await Product.create({ name: 'Steel Rod', sku: 'SR-100', category: 'Raw Material' });
  const p2 = await Product.create({ name: 'Copper Wire', sku: 'CW-200', category: 'Raw Material' });
  const p3 = await Product.create({ name: 'Screws', sku: 'SC-300', category: 'Hardware' });
  const w1 = await Warehouse.create({ name: 'Main Warehouse', code: 'WH1' });
  const l1 = await Location.create({ name: 'Rack A1', warehouseId: w1._id });
  const l2 = await Location.create({ name: 'Rack B2', warehouseId: w1._id });
  await Stock.create({ productId: p1._id, warehouseId: w1._id, locationId: l1._id, quantity: 100 });
  await Stock.create({ productId: p2._id, warehouseId: w1._id, locationId: l1._id, quantity: 50 });
  console.log('Seeded successfully!');
  process.exit(0);
});
