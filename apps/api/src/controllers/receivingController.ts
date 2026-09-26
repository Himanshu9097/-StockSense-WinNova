import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Receipt, PutawayTask, StockLedger, InventoryBalance, Location } from '../models';
import { PutawayService } from '../services/putawayService';
import mongoose from 'mongoose';

export const getReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const receipts = await Receipt.find()
      .populate('createdBy', 'name')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type')
      .populate('lines.productId', 'name sku')
      .sort({ createdAt: -1 });
    res.status(200).json(receipts);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
};

export const getPutawayTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await PutawayTask.find({ status: { $ne: 'COMPLETED' } })
      .populate('productId', 'name sku')
      .populate('suggestedLocationId', 'code type')
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getReceiptById = async (req: AuthRequest, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type')
      .populate('lines.productId', 'name sku uom')
      .populate('lines.locationId', 'code type');
    
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.status(200).json(receipt);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};

export const createReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, locationId, supplier, reference, expectedArrivalDate, lines, notes, draft } = req.body;

    if (!warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Warehouse and at least one line are required.' });
    }
    for (const line of lines) {
      if (!line.productId || !line.expectedQuantity || line.expectedQuantity <= 0) {
        return res.status(400).json({ error: 'Each line must have a product and expected quantity greater than 0.' });
      }
    }

    const receiptNumber = `RCV-${Date.now()}`;

    const receipt = new Receipt({
      receiptNumber,
      warehouseId,
      locationId: locationId || undefined,
      supplier,
      reference,
      expectedArrivalDate: expectedArrivalDate ? new Date(expectedArrivalDate) : undefined,
      lines,
      notes,
      createdBy: req.user!.userId,
      status: draft ? 'DRAFT' : 'EXPECTED'
    });

    await receipt.save();
    const populated = await Receipt.findById(receipt._id)
      .populate('createdBy', 'name')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type')
      .populate('lines.productId', 'name sku uom')
      .populate('lines.locationId', 'code type');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create receipt' });
  }
};

export const updateReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status === 'COMPLETED' || receipt.status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot update receipt in ${receipt.status} status` });
    }

    const { warehouseId, locationId, supplier, reference, expectedArrivalDate, lines, notes, status } = req.body;

    if (warehouseId) receipt.warehouseId = warehouseId;
    if (locationId !== undefined) receipt.locationId = locationId || undefined;
    if (supplier !== undefined) receipt.supplier = supplier;
    if (reference !== undefined) receipt.reference = reference;
    if (expectedArrivalDate !== undefined) receipt.expectedArrivalDate = expectedArrivalDate ? new Date(expectedArrivalDate) : undefined;
    if (notes !== undefined) receipt.notes = notes;
    if (status && ['DRAFT', 'EXPECTED', 'ARRIVED', 'RECEIVING'].includes(status)) {
      receipt.status = status;
    }
    if (lines && Array.isArray(lines)) {
      receipt.lines = lines as any;
    }

    await receipt.save();
    const populated = await Receipt.findById(receipt._id)
      .populate('createdBy', 'name')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type')
      .populate('lines.productId', 'name sku uom')
      .populate('lines.locationId', 'code type');
    res.status(200).json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update receipt' });
  }
};

export const cancelReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel a completed receipt' });
    }

    receipt.status = 'CANCELLED';
    await receipt.save();
    res.status(200).json({ message: 'Receipt cancelled', receipt });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel receipt' });
  }
};

export const deleteReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    if (receipt.status !== 'DRAFT' && receipt.status !== 'CANCELLED') {
      return res.status(400).json({ error: 'Only DRAFT or CANCELLED receipts can be deleted' });
    }

    await Receipt.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete receipt' });
  }
};

// Validate receipt: increase stock + write ledger (idempotent guard)
export const validateReceipt = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('lines.productId', 'name sku')
      .session(session);

    if (!receipt) throw new Error('Receipt not found');

    if (receipt.status === 'COMPLETED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'This receipt has already been validated.' });
    }
    if (receipt.status === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Cannot validate a cancelled receipt.' });
    }

    // Apply any updated line quantities or lots passed from the client
    const clientLines: any[] = req.body?.lines;
    if (clientLines && Array.isArray(clientLines)) {
      for (const cl of clientLines) {
        const line = receipt.lines.find(
          (l: any) => (cl._id && l._id?.toString() === cl._id.toString()) || 
                      (cl.productId && (l.productId?._id?.toString() === cl.productId.toString() || l.productId?.toString() === cl.productId.toString()))
        );
        if (line) {
          if (cl.receivedQuantity !== undefined && cl.receivedQuantity !== null) {
            line.receivedQuantity = Number(cl.receivedQuantity);
          }
          if (cl.locationId) line.locationId = cl.locationId;
          if (cl.lotId !== undefined) line.lotId = cl.lotId;
          if (cl.serialId !== undefined) line.serialId = cl.serialId;
        }
      }
    }

    for (const line of receipt.lines) {
      const qty = (line.receivedQuantity !== undefined && line.receivedQuantity !== null && line.receivedQuantity > 0)
        ? line.receivedQuantity 
        : line.expectedQuantity;
      if (qty <= 0) continue;

      // Use line-level locationId, fallback to receipt-level locationId
      const locationId = (line as any).locationId || (receipt as any).locationId;
      if (!locationId) {
        throw new Error(`No destination location assigned for product ${(line.productId as any)?.name || line.productId}. Please select a location.`);
      }

      const prodId = (line.productId as any)?._id || line.productId;

      let balance = await InventoryBalance.findOne({
        productId: prodId,
        locationId,
        lotId: line.lotId || null,
        serialId: line.serialId || null
      }).session(session);

      const beforeQty = balance ? balance.onHand : 0;

      if (!balance) {
        balance = new InventoryBalance({
          productId: prodId,
          warehouseId: receipt.warehouseId,
          locationId,
          lotId: line.lotId,
          serialId: line.serialId,
          onHand: 0
        });
      }

      balance.onHand += qty;
      await balance.save({ session });

      const ledger = new StockLedger({
        transactionId: `RCV-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        operation: 'RECEIPT',
        productId: prodId,
        lotId: line.lotId,
        serialId: line.serialId,
        destinationLocationId: locationId,
        quantity: qty,
        beforeQuantity: beforeQty,
        afterQuantity: balance.onHand,
        referenceType: 'Receipt',
        referenceId: receipt._id,
        reason: `Receipt validated: ${receipt.receiptNumber}`,
        performedBy: req.user!.userId
      });
      await ledger.save({ session });

      // Mark received quantities
      line.receivedQuantity = qty;
      line.acceptedQuantity = qty;
    }

    receipt.status = 'COMPLETED';
    receipt.completedAt = new Date();
    await receipt.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Receipt.findById(receipt._id)
      .populate('createdBy', 'name')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type')
      .populate('lines.productId', 'name sku uom')
      .populate('lines.locationId', 'code type');
    res.status(200).json({ message: 'Receipt validated. Stock updated.', receipt: populated });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message || 'Unable to complete the operation. Please try again.' });
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
    
    await session.commitTransaction();
    res.status(200).json({ message: 'Putaway completed successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
