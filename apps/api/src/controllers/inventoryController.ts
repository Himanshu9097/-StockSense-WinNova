import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Product, Warehouse, Location, Zone, InventoryBalance } from '../models';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching products' });
  }
};

export const getWarehouses = async (req: AuthRequest, res: Response) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.status(200).json(warehouses);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching warehouses' });
  }
};

export const getLocations = async (req: AuthRequest, res: Response) => {
  try {
    const warehouseId = req.query.warehouseId as string;
    const query = warehouseId ? { warehouseId } : {};
    const locations = await Location.find(query).sort({ code: 1 });
    res.status(200).json(locations);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching locations' });
  }
};

export const getStock = async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId as string;
    const warehouseId = req.query.warehouseId as string;
    const locationId = req.query.locationId as string;
    if (!productId || !warehouseId || !locationId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    const balance: any = await InventoryBalance.findOne({ productId, warehouseId, locationId }).lean();
    res.status(200).json({ quantity: balance ? balance.onHand : 0 });
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching stock' });
  }
};

// Seeder endpoint for demo purposes
export const seedInventory = async (req: AuthRequest, res: Response) => {
  try {
    await Product.deleteMany({});
    await Warehouse.deleteMany({});
    await Zone.deleteMany({});
    await Location.deleteMany({});
    await InventoryBalance.deleteMany({});

    const p1 = await Product.create({ name: 'Steel Rod', sku: 'SR-100', category: 'Raw Material' });
    const p2 = await Product.create({ name: 'Copper Wire', sku: 'CW-200', category: 'Raw Material' });
    const p3 = await Product.create({ name: 'Screws', sku: 'SC-300', category: 'Hardware' });

    const w1 = await Warehouse.create({ name: 'Main Warehouse', code: 'WH1' });
    
    const z1 = await Zone.create({ name: 'Storage Zone A', code: 'Z-A', warehouseId: w1._id });

    const l1 = await Location.create({ code: 'WH1-ZA-R1-S1-B1', type: 'BIN', warehouseId: w1._id, zoneId: z1._id });
    const l2 = await Location.create({ code: 'WH1-ZA-R1-S1-B2', type: 'BIN', warehouseId: w1._id, zoneId: z1._id });

    await InventoryBalance.create({ productId: p1._id, warehouseId: w1._id, locationId: l1._id, onHand: 100 });
    await InventoryBalance.create({ productId: p2._id, warehouseId: w1._id, locationId: l2._id, onHand: 50 });
    await InventoryBalance.create({ productId: p3._id, warehouseId: w1._id, locationId: l1._id, onHand: 500 });

    res.status(200).json({ message: 'Seeded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

