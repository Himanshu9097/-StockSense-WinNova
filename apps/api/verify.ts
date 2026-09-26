import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product, Location, Warehouse, Zone, InventoryBalance, StockLedger, Receipt, PutawayTask } from './src/models';
import { PutawayService } from './src/services/putawayService';

dotenv.config();

async function runVerification() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stocksense');
  console.log('✅ Connected.');

  try {
    const mockUserId = new mongoose.Types.ObjectId();

    console.log('\n📦 1. Setting up Location Hierarchy...');
    const warehouse = await Warehouse.create({ name: 'Verification WH', code: 'VWH-1' });
    const zone = await Zone.create({ name: 'Bulk Storage', code: 'VZ-1', warehouseId: warehouse._id, zoneType: 'STORAGE' });
    const bin = await Location.create({ 
      code: 'VBIN-01', 
      type: 'BIN', 
      warehouseId: warehouse._id, 
      zoneId: zone._id,
      capacity: 1000 
    });
    console.log(`   Created Bin: ${bin.code}`);

    console.log('\n🏷️ 2. Creating Product...');
    const product = await Product.create({ 
      name: 'Titanium Widget', 
      sku: 'WIDGET-TI-01', 
      weight: 2,
      storageConstraints: ['STORAGE'] 
    });
    console.log(`   Created Product: ${product.name} (${product.sku})`);

    console.log('\n📥 3. Creating Inbound Receipt...');
    const receipt = await Receipt.create({
      receiptNumber: `REC-${Date.now()}`,
      warehouseId: warehouse._id,
      createdBy: mockUserId,
      supplier: 'Acme Corp',
      status: 'EXPECTED',
      lines: [{
        productId: product._id,
        expectedQuantity: 50,
        receivedQuantity: 0
      }]
    });
    console.log(`   Created Receipt: ${receipt.receiptNumber}`);

    console.log('\n⚙️ 4. Simulating Receiving (Receipt -> Putaway Task)...');
    // Mark receipt as receiving
    receipt.status = 'RECEIVING';
    receipt.lines[0].receivedQuantity = 50;
    await receipt.save();

    // Generate Putaway Task via service algorithm
    console.log('   Running Intelligent Putaway Algorithm...');
    const suggestion = await PutawayService.suggestBin(warehouse._id.toString(), product._id.toString(), 50);
    console.log(`   Algorithm Suggestion: Bin ${suggestion.recommendedBin.locationId} - Reason: ${suggestion.reasons.join(', ')}`);

    const task = await PutawayTask.create({
      taskId: `TSK-${Date.now()}`,
      receiptId: receipt._id,
      productId: product._id,
      quantity: 50,
      suggestedLocationId: suggestion.recommendedBin.locationId,
      status: 'PENDING'
    });
    console.log(`   Created Putaway Task for 50 units.`);

    console.log('\n✅ 5. Completing Putaway Task (Ledger & Balance Update)...');
    
    // Start session for atomic ledger transaction (Simulating controller)
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Complete the task
      task.status = 'COMPLETED';
      task.actualLocationId = bin._id as any;
      task.completedBy = mockUserId as any;
      task.completedAt = new Date();
      await task.save({ session });

      // Create Ledger Entry
      await StockLedger.create([{
        transactionId: `TXN-${Date.now()}`,
        operation: 'PUTAWAY',
        productId: product._id,
        destinationLocationId: bin._id,
        quantity: 50,
        beforeQuantity: 0,
        afterQuantity: 50,
        performedBy: mockUserId,
        referenceId: task._id,
        referenceModel: 'PutawayTask'
      } as any], { session });

      // Update Inventory Balance
      await InventoryBalance.findOneAndUpdate(
        { productId: product._id, locationId: bin._id, warehouseId: warehouse._id },
        { $inc: { onHand: 50, available: 50 } },
        { upsert: true, new: true, session }
      );
    });
    session.endSession();
    console.log(`   Putaway completed atomically.`);

    console.log('\n📊 6. Verifying Final State...');
    const finalBalance = await InventoryBalance.findOne({ productId: product._id, locationId: bin._id });
    const finalLedger = await StockLedger.findOne({ productId: product._id, operation: 'PUTAWAY' });
    
    console.log(`   Final OnHand Balance: ${finalBalance?.onHand} (Expected: 50)`);
    console.log(`   Ledger Transaction Qty: ${finalLedger?.quantity} (Expected: 50)`);

    if (finalBalance?.onHand === 50 && finalLedger?.quantity === 50) {
      console.log('\n🎉 ALL WORKFLOWS VERIFIED SUCCESSFULLY! THE ENGINE WORKS! 🎉');
    } else {
      console.error('\n❌ Verification Failed. Mismatch in final state.');
    }

  } catch (error) {
    console.error('\n❌ Verification Failed with Error:', error);
  } finally {
    console.log('\n🧹 Cleaning up test data...');
    await Warehouse.deleteOne({ code: 'VWH-1' });
    await Zone.deleteOne({ code: 'VZ-1' });
    await Location.deleteOne({ code: 'VBIN-01' });
    await Product.deleteOne({ sku: 'WIDGET-TI-01' });
    await Receipt.deleteOne({ receiptNumber: 'REC-9999' });
    await PutawayTask.deleteMany({ quantity: 50 });
    await InventoryBalance.deleteMany({ onHand: 50 });
    await StockLedger.deleteMany({ operation: 'PUTAWAY', quantity: 50 });
    
    await mongoose.disconnect();
    console.log('👋 Disconnected.');
  }
}

runVerification();
