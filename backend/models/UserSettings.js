const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  // Link to the User model (assuming you use req.user.id which is an ObjectId)
  // Changed type to ObjectId to match standard Mongoose relationships if using 'user' in routes
  // Or kept as String if you specifically store auth0/firebase IDs. 
  // Based on your routes (req.user.id), this usually maps to the user field.
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  profile: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, default: 'Owner' },
    imgUrl: { type: String, default: '' }
  },

  // Flattned fields to match your 'settingsRoutes.js' usage (company.name, company.gstin)
  // OR kept as nested 'business' object if you plan to update routes to use company.business.name
  // For safety with your CURRENT routes, I've added the root level fields that the routes expect,
  // while keeping your structure as well. 
  
  // -- Fields matching your settingsRoutes.js --
  name: { type: String },
  gstin: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  phone: { type: String },
  email: { type: String },
  logo: { type: String }, // Base64 or URL

  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    upiId: { type: String }
  },

  invoiceSettings: {
    paymentTerms: { type: String, default: 'Due on receipt' },
    notes: { type: String, default: 'Thank you for your business!' },
    footerText: { type: String }
  },

  // -- NEW: Quotation Defaults --
  quotationSettings: {
    prefix: { type: String, default: 'SMEC/25-26/QUO' },
    defaultValidityDays: { type: String, default: '15' },
    defaultSubject: { type: String, default: 'SUB: QUOTATION FOR ELECTRICAL PANEL / WORKS.' },
    defaultIntro: { type: String, default: 'We thank you for your enquiry and we have pleasure in submitting our offer towards above mentioned to subject which requires your approval.' },
    terms: { type: String, default: `a. Price Basis : Above prices are inclusive of all taxes & duties
b. Payment : 50% advance.
c. Transport : Extra
d. Taxes & duties : The statutory levies rates given under are as applicable at present, however the rate applicable at the time of dispatch shall be applicable.
a) GST @ 18% Includes
e. Validity: 15 days from today & thereafter subject to our confirmation.` }
  },

  // -- Keeping your original structure for future use or other modules --
  business: {
    name: { type: String, default: 'SRI MANJUNATHA ELECTRICAL & CONTROLS' },
    gstin: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: 'Karnataka' },
    taxType: { type: String, default: 'Regular' }
  },

  notifications: {
    newInvoice: { type: Boolean, default: true },
    paymentReceived: { type: Boolean, default: true },
    invoiceOverdue: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
    gstReminder: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', UserSettingsSchema);