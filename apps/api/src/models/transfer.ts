import mongoose from 'mongoose';

const transferItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  lotId: { type: String }, 
  quantity: { type: Number, required: true },
});

const transferSchema = new mongoose.Schema({
  transferNumber: { type: String, required: true, unique: true }, 
  status: { type: String, enum: ['Draft', 'In Transit', 'Completed', 'Cancelled'], default: 'Draft' },
  sourceLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  destinationLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  items: [transferItemSchema],
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Transfer = mongoose.model('Transfer', transferSchema);
