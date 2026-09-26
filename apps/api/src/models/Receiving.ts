import mongoose from 'mongoose';

const receiptLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  expectedQuantity: { type: Number, required: true },
  receivedQuantity: { type: Number, default: 0 },
  acceptedQuantity: { type: Number, default: 0 },
  rejectedQuantity: { type: Number, default: 0 },
  lotId: { type: String },
  serialId: { type: String },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
});

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  supplier: { type: String },
  reference: { type: String }, // e.g. PO number
  
  status: { 
    type: String, 
    enum: ['DRAFT', 'EXPECTED', 'ARRIVED', 'RECEIVING', 'QC', 'PUTAWAY', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  
  expectedArrivalDate: { type: Date },
  arrivedAt: { type: Date },
  completedAt: { type: Date },
  
  lines: [receiptLineSchema],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String }
}, { timestamps: true });

export const Receipt = mongoose.model('Receipt', receiptSchema);

const putawayTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  quantity: { type: Number, required: true },
  lotId: { type: String },
  serialId: { type: String },
  
  suggestedLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  actualLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, // Where it actually went
  
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date }
}, { timestamps: true });

export const PutawayTask = mongoose.model('PutawayTask', putawayTaskSchema);
