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
  },
  quotationSettings: {
    prefix: { type: String, default: 'QUO' },
    defaultValidityDays: { type: Number, default: 30 },
    defaultSubject: { type: String, default: 'Quotation for Services' },
    defaultIntro: { type: String, default: 'Thank you for considering our services. We are pleased to provide the following quotation.' },
    terms: { type: String, default: '1. Payment terms: 50% advance, 50% on completion.\n2. Validity: 30 days from date of quotation.\n3. All prices are exclusive of GST.' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);