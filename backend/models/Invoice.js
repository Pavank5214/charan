// models/invoice.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceItemSchema = new Schema({
  description: { type: String, required: true, trim: true },
  hsn:         { type: String, trim: true },
  qty:         { type: Number, required: true, min: [0, 'Qty cannot be negative'] },
  unit:        { type: String, required: true, trim: true },
  rate:        { type: Number, required: true, min: [0, 'Rate cannot be negative'] },
  discount:    { type: Number, default: 0, min: [0, 'Discount cannot be negative'], max: [100, 'Discount cannot exceed 100%'] },
});

const invoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true, trim: true },
  invoiceDate:   { type: Date, required: true },
  placeOfSupply: { type: String, required: true, trim: true },

  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },

  items: [invoiceItemSchema],

  gstRate: { type: Number, required: true, min: [0, 'GST rate cannot be negative'], max: [100, 'GST rate cannot exceed 100%'] },
  basicPrice: { type: Number, default: 0, min: [0, 'Basic price cannot be negative'] },

  subtotal: { type: Number, default: 0 },
  gst:      { type: Number, default: 0 },
  total:    { type: Number, default: 0 },

  bank: {
    name:    { type: String,  },
    account: { type: String,  },
    ifsc:    { type: String, }
  },

  // ADD THIS: Status field
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },

  // Company reference for multi-company support
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

}, { timestamps: true });

// Recalculate totals before save
invoiceSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((sum, it) => {
    const afterDisc = it.rate * (1 - it.discount / 100);
    return sum + it.qty * afterDisc;
  }, 0) + (this.basicPrice || 0);

  this.gst   = Number((this.subtotal * (this.gstRate / 100)).toFixed(2));
  this.total = Number((this.subtotal + this.gst).toFixed(2));

  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);