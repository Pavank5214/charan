const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  gstin: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  email: String,
  logo: String, // base64
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    upiId: String
  },
  invoiceSettings: {
    paymentTerms: { type: String, default: 'Due on receipt' },
    notes: { type: String, default: 'Thank you for your business!' },
    footerText: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);