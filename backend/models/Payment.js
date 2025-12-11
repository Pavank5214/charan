const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['UPI', 'Bank Transfer', 'Cheque', 'Cash', 'Credit Card', 'Other'],
    default: 'UPI'
  },
  status: {
    type: String,
    enum: ['verified', 'pending', 'failed'],
    default: 'verified'
  },
  referenceId: {
    type: String,
    trim: true
  },
  invoiceNo: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);