const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  hsn: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    default: 'NOS',
    uppercase: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate item names within the same company
itemSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema);