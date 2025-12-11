const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Index for search
clientSchema.index({ name: 1, gstin: 1, mobile: 1 });

module.exports = mongoose.model('Client', clientSchema);
