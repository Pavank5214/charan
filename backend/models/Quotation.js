// models/Quotation.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: String,
  qty: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }
});

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  gstin: String,
  mobile: String,
  email: String
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  quotationDate: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },

  client: { type: clientSchema, required: true },

  items: [itemSchema],
  gstRate: { type: Number, default: 18 },
  basicPrice: { type: Number, default: 0, min: 0 },

  subtotal: { type: Number, required: true },
  gst: { type: Number, required: true },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'accepted', 'rejected', 'converted'],
    default: 'draft'
  },

  notes: String,
  terms: String,

  // Company reference for multi-company support
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quotationSchema.pre('save', function(next) {
  // Calculate subtotal including basic price
  this.subtotal = this.items.reduce((sum, item) => {
    const afterDisc = item.rate * (1 - item.discount / 100);
    return sum + item.qty * afterDisc;
  }, 0) + (this.basicPrice || 0);

  this.gst = Number((this.subtotal * (this.gstRate / 100)).toFixed(2));
  this.total = Number((this.subtotal + this.gst).toFixed(2));

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);