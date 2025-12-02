// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT middleware
const User = require('../models/User');
const Company = require('../models/Company');

// @route   GET /api/settings/me
// @desc    Get current user's business & invoice settings
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const company = await Company.findOne({ user: req.user.id });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      company: company || {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/business
// @desc    Update business details
router.put('/business', auth, async (req, res) => {
  const { name, gstin, address, city, state, pincode, phone, email } = req.body;

  try {
    let company = await Company.findOne({ user: req.user.id });

    if (!company) {
      company = new Company({ user: req.user.id });
    }

    company.name = name;
    company.gstin = gstin?.toUpperCase();
    company.address = address;
    company.city = city;
    company.state = state;
    company.pincode = pincode;
    company.phone = phone;
    company.email = email;

    await company.save();

    // Also update user phone/email if provided
    await User.findByIdAndUpdate(req.user.id, {
      $set: { phone: phone || req.user.phone, email: email || req.user.email }
    });

    res.json({ message: 'Business details updated', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/invoice-defaults
// @desc    Update invoice defaults (bank, logo, notes, etc.)
router.put('/invoice-defaults', auth, async (req, res) => {
  const {
    bankName, accountNumber, ifsc, upiId,
    paymentTerms, notes, footerText, logo
  } = req.body;

  try {
    let company = await Company.findOne({ user: req.user.id });

    if (!company) {
      company = new Company({ user: req.user.id });
    }

    // Initialize nested objects if they don't exist
    if (!company.bankDetails) company.bankDetails = {};
    if (!company.invoiceSettings) company.invoiceSettings = {};

    // Update bank details
    company.bankDetails.bankName = bankName;
    company.bankDetails.accountNumber = accountNumber;
    company.bankDetails.ifsc = ifsc?.toUpperCase();
    company.bankDetails.upiId = upiId;

    // Update invoice settings
    company.invoiceSettings.paymentTerms = paymentTerms;
    company.invoiceSettings.notes = notes;
    company.invoiceSettings.footerText = footerText;

    // Update logo (base64 string)
    if (logo) company.logo = logo;

    await company.save();

    res.json({ message: 'Invoice defaults updated', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/quotation-defaults
// @desc    Update quotation defaults (prefix, validity, terms, etc.)
router.put('/quotation-defaults', auth, async (req, res) => {
  const {
    prefix, defaultValidityDays, defaultSubject, defaultIntro, terms
  } = req.body;

  try {
    let company = await Company.findOne({ user: req.user.id });

    if (!company) {
      company = new Company({ user: req.user.id });
    }

    // Initialize nested object if it doesn't exist
    if (!company.quotationSettings) company.quotationSettings = {};

    // Update quotation settings
    company.quotationSettings.prefix = prefix;
    company.quotationSettings.defaultValidityDays = defaultValidityDays;
    company.quotationSettings.defaultSubject = defaultSubject;
    company.quotationSettings.defaultIntro = defaultIntro;
    company.quotationSettings.terms = terms;

    await company.save();

    res.json({ message: 'Quotation defaults updated', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;