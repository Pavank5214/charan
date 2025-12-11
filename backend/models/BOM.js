const mongoose = require('mongoose');

const BOMSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional: Link to original quotation if this BOM was generated from one
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  bomNumber: {
    type: String,
    required: true,
    unique: true
  },
  bomDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  client: {
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    mobile: { type: String },
    email: { type: String }
  },
  // BOM items often focus on Make/Qty/Description rather than Rate/Amount
  items: [{
    description: { type: String, required: true },
    make: { type: String }, // Crucial for BOM
    qty: { type: Number, required: true },
    unit: { type: String },
    // Rate/Amount included in case you need costing, but optional for pure BOM
    rate: { type: Number, default: 0 }, 
    amount: { type: Number, default: 0 }
  }],
  status: {
    type: String,
    enum: ['draft', 'approved', 'in-production', 'completed'],
    default: 'draft'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('BOM', BOMSchema);