import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PutawayService } from '../putawayService';
import { Product, Location, Warehouse, Zone, InventoryBalance } from '../../models';

jest.setTimeout(60000);

describe('PutawayService', () => {
  let warehouse: any;
  let zone: any;
  let product: any;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Location.deleteMany({});
    await Warehouse.deleteMany({});
    await Zone.deleteMany({});
    await InventoryBalance.deleteMany({});

    warehouse = await Warehouse.create({ name: 'Test WH', code: 'TWH1' });
    zone = await Zone.create({ name: 'Storage', code: 'Z1', warehouseId: warehouse._id, zoneType: 'STORAGE' });
    
    product = await Product.create({ 
      name: 'Widget', 
      sku: 'WDG-1', 
      weight: 10,
      storageConstraints: ['STORAGE'] 
    });
  });

  it('should suggest a bin based on capacity and affinity', async () => {
    // Bin 1: empty, high capacity
    const bin1 = await Location.create({ 
      code: 'BIN-1', 
      type: 'BIN', 
      warehouseId: warehouse._id, 
      zoneId: zone._id,
      capacity: 100 
    });

    // Bin 2: has some of the same product (Affinity)
    const bin2 = await Location.create({ 
      code: 'BIN-2', 
      type: 'BIN', 
      warehouseId: warehouse._id, 
      zoneId: zone._id,
      capacity: 100 
    });
    
    await InventoryBalance.create({ 
      productId: product._id, 
      warehouseId: warehouse._id, 
      locationId: bin2._id, 
      onHand: 10 
    });

    const suggestion = await PutawayService.suggestBin(warehouse._id.toString(), product._id.toString(), 20);

    // Bin 2 should score higher because of affinity (+50 points)
    expect(suggestion.recommendedBin.locationId.toString()).toBe(bin2._id.toString());
    expect(suggestion.reasons).toContain('Same SKU already stored here');
  });

  it('should reject bins that would overflow capacity', async () => {
    const bin1 = await Location.create({ 
      code: 'BIN-1', 
      type: 'BIN', 
      warehouseId: warehouse._id, 
      zoneId: zone._id,
      capacity: 15 // Capacity is 15
    });

    // Try to putaway 20
    await expect(
      PutawayService.suggestBin(warehouse._id.toString(), product._id.toString(), 20)
    ).rejects.toThrow('No eligible bins found for this product and quantity.');
  });
});
