import mongoose from 'mongoose';

const deliveryLineSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  quantity: { type: Number, required: true, min: 1 },
  pickedQuantity: { type: Number, default: 0 },
  lotId: { type: String },
  serialId: { type: String }
});

const deliveryOrderSchema = new mongoose.Schema({
  deliveryNumber: { type: String, required: true, unique: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, // default source location
  customer: { type: String },
  reference: { type: String }, // e.g. Sales Order number

  status: {
    type: String,
    enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED'],
    default: 'DRAFT'
  },

  lines: [deliveryLineSchema],

  scheduledDate: { type: Date },
  completedAt: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String }
}, { timestamps: true });

export const DeliveryOrder = mongoose.model('DeliveryOrder', deliveryOrderSchema);
