const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// GET all payments (for the logged-in company)
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ companyId: req.user.currentCompanyId })
      .sort({ date: -1 }); // Sort by newest first
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new payment record
router.post('/', auth, async (req, res) => {
  try {
    // Auto-generate a Payment ID if the client didn't send one (optional safeguard)
    let paymentId = req.body.paymentId;
    if (!paymentId) {
        const count = await Payment.countDocuments({ companyId: req.user.currentCompanyId });
        paymentId = `PAY-${1000 + count + 1}`;
    }

    const payment = new Payment({
      ...req.body,
      paymentId: paymentId,
      companyId: req.user.currentCompanyId
    });

    const newPayment = await payment.save();
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE payment details (PUT)
router.put('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE payment status only (PATCH)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      { status: req.body.status },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({ 
      _id: req.params.id, 
      companyId: req.user.currentCompanyId 
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;