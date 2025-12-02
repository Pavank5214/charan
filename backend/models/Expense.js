const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  payee: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Operational', 'Salary', 'Utilities', 'Travel', 'Purchase', 'Other'],
    default: 'Operational'
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
    enum: ['UPI', 'Bank Transfer', 'Cheque', 'Cash', 'Card'],
    default: 'UPI'
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'paid'
  },
  referenceNo: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries by date and category
expenseSchema.index({ companyId: 1, date: -1 });
expenseSchema.index({ companyId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);