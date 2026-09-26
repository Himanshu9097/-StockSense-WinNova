import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Receipt, PutawayTask, StockLedger, InventoryBalance, Location } from '../models';
import { PutawayService } from '../services/putawayService';
import mongoose from 'mongoose';

export const getReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await Receipt.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
};

export const getReceiptById = async (req: AuthRequest, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('lines.productId', 'name sku');
    
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.status(200).json(receipt);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};

export const createReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, supplier, reference, lines, notes } = req.body;
    
    const receiptNumber = `RCV-${Date.now()}`;
    
    const receipt = new Receipt({
      receiptNumber,
      warehouseId,
      supplier,
      reference,
      lines,
      notes,
      createdBy: req.user!.userId,
      status: 'EXPECTED'
    });
    
    await receipt.save();
    res.status(201).json(receipt);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create receipt' });
  }
};

// Simplified receiving flow for MVP: Arrive -> Receive -> Generate Putaway Tasks
export const receiveItems = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { receiptId, lines } = req.body; // lines: [{ productId, receivedQuantity, lotId, serialId }]
    
    const receipt = await Receipt.findById(receiptId).session(session);
    if (!receipt) throw new Error('Receipt not found');
    
    if (receipt.status !== 'EXPECTED' && receipt.status !== 'ARRIVED' && receipt.status !== 'RECEIVING') {
      throw new Error(`Cannot receive against receipt in ${receipt.status} status`);
    }

    // Process each received line
    for (const updateLine of lines) {
      const receiptLine = receipt.lines.find((l: any) => l.productId.toString() === updateLine.productId);
      if (!receiptLine) throw new Error(`Product ${updateLine.productId} not on this receipt`);
      
      receiptLine.receivedQuantity += updateLine.receivedQuantity;
      
      // Generate putaway recommendation
      const suggestion = await PutawayService.suggestBin(receipt.warehouseId.toString(), updateLine.productId, updateLine.receivedQuantity);
      
      const task = new PutawayTask({
        taskId: `PTW-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        receiptId: receipt._id,
        productId: updateLine.productId,
        quantity: updateLine.receivedQuantity,
        lotId: updateLine.lotId,
        serialId: updateLine.serialId,
        suggestedLocationId: suggestion.recommendedBin.locationId,
        status: 'PENDING'
      });
      await task.save({ session });
    }
    
    receipt.status = 'RECEIVING'; // Or PUTAWAY if fully received
    await receipt.save({ session });
    
    await session.commitTransaction();
    res.status(200).json({ message: 'Items received and putaway tasks generated' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Complete a putaway task
export const completePutaway = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { taskId, actualLocationId } = req.body;
    
    const task = await PutawayTask.findById(taskId).session(session);
    if (!task) throw new Error('Putaway task not found');
    if (task.status === 'COMPLETED') throw new Error('Task already completed');
    
    const receipt = await Receipt.findById(task.receiptId).session(session);
    if (!receipt) throw new Error('Associated receipt not found');
    
    // 1. Update InventoryBalance
    let balance = await InventoryBalance.findOne({ 
      productId: task.productId, 
      locationId: actualLocationId,
      lotId: task.lotId,
      serialId: task.serialId
    }).session(session);
    
    if (!balance) {
      balance = new InventoryBalance({
        productId: task.productId,
        warehouseId: receipt.warehouseId,
        locationId: actualLocationId,
        lotId: task.lotId,
        serialId: task.serialId,
        onHand: 0
      });
    }
    
    balance.onHand += task.quantity;
    await balance.save({ session });
    
    // 2. Create StockLedger Entry
    const ledger = new StockLedger({
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      operation: 'PUTAWAY',
      productId: task.productId,
      lotId: task.lotId,
      serialId: task.serialId,
      destinationLocationId: actualLocationId,
      quantity: task.quantity,
      beforeQuantity: balance.onHand - task.quantity,
      afterQuantity: balance.onHand,
      referenceType: 'PutawayTask',
      referenceId: task._id,
      performedBy: req.user!.userId
    });
    await ledger.save({ session });
    
    // 3. Update task
    task.status = 'COMPLETED';
    task.actualLocationId = actualLocationId;
    task.completedBy = req.user!.userId as any;
    task.completedAt = new Date();
    await task.save({ session });
    
    // (In a real system, we'd check if all tasks for the receipt are done and mark receipt COMPLETED)
    
    await session.commitTransaction();
    res.status(200).json({ message: 'Putaway completed successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
