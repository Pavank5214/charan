const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  poNumber: {
    type: String,
    required: true
  },
  vendor: {
    name: { type: String, required: true },
    address: String,
    gstin: String,
    email: String,
    mobile: String
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'cancelled'],
    default: 'draft'
  },
  items: [{
    description: String,
    qty: Number,
    unit: String,
    rate: Number
  }],
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);