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
    let company = await Company.findOne({ user: req.user.id });

    if (company) {
      // Ensure quotationSettings has defaults for each field if missing or empty
      if (!company.quotationSettings) company.quotationSettings = {};
      if (company.quotationSettings.prefix === undefined || company.quotationSettings.prefix === '') company.quotationSettings.prefix = 'QUO';
      if (company.quotationSettings.defaultValidityDays === undefined || company.quotationSettings.defaultValidityDays === 0) company.quotationSettings.defaultValidityDays = 30;
      if (company.quotationSettings.defaultSubject === undefined || company.quotationSettings.defaultSubject === '') company.quotationSettings.defaultSubject = 'Quotation for Services';
      if (company.quotationSettings.defaultIntro === undefined || company.quotationSettings.defaultIntro === '') company.quotationSettings.defaultIntro = 'Thank you for considering our services. We are pleased to provide the following quotation.';
      if (company.quotationSettings.terms === undefined || company.quotationSettings.terms === '') company.quotationSettings.terms = '1. Payment terms: 50% advance, 50% on completion.\n2. Validity: 30 days from date of quotation.\n3. All prices are exclusive of GST.';
      await company.save(); // Save to persist defaults
    }

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
router.put('/invoice-defaults', auth, async (req, res) => {
  const {
    bankName, accountNumber, ifsc, upiId,
    paymentTerms, notes, footerText, logo
  } = req.body;

  const updateFields = {
    "bankDetails.bankName": bankName,
    "bankDetails.accountNumber": accountNumber,
    "bankDetails.ifsc": ifsc?.toUpperCase(),
    "bankDetails.upiId": upiId,
    "invoiceSettings.paymentTerms": paymentTerms,
    "invoiceSettings.notes": notes,
    "invoiceSettings.footerText": footerText,
  };

  // Only update logo if a new one is provided
  if (logo) updateFields["logo"] = logo;

  try {
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Invoice defaults updated', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// @route   PUT /api/settings/quotation-defaults
// @desc    Update quotation defaults (Atomic Operation)
router.put('/quotation-defaults', auth, async (req, res) => {
  const {
    prefix, defaultValidityDays, defaultSubject, defaultIntro, terms
  } = req.body;

  const updateFields = {
    "quotationSettings.prefix": prefix,
    "quotationSettings.defaultValidityDays": defaultValidityDays,
    "quotationSettings.defaultSubject": defaultSubject,
    "quotationSettings.defaultIntro": defaultIntro,
    "quotationSettings.terms": terms
  };

  try {
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Quotation defaults updated', company });
  } catch (err) {
    console.error("Quotation Save Error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;