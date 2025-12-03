const express = require('express');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const router = express.Router();

// ---------- CREATE ----------
router.post('/', auth, async (req, res) => {
  try {
    const { clientId } = req.body;

    // Validate clientId if provided
    if (clientId && !require('mongoose').Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: 'Please select a valid client before saving the invoice' });
    }

    const invoice = new Invoice({
      ...req.body,
      companyId: req.user.currentCompanyId // Attach to logged-in user's company
    });
    const saved = await invoice.save();
    await saved.populate('clientId');
    res.status(201).json({ invoice: saved });
  } catch (err) {
    console.error('Invoice Save Error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ---------- READ ALL ----------
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ companyId: req.user.currentCompanyId })
      .populate('clientId')
      .sort({ createdAt: -1 }); // Newest first
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- READ ONE ----------
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    }).populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- UPDATE FULL (EDIT) ----------
router.put('/:id', auth, async (req, res) => {
  try {
    const { clientId } = req.body;

    // Validate clientId if provided
    if (clientId && !require('mongoose').Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: 'Valid client ID is required' });
    }

    const updated = await Invoice.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Invoice not found' });

    // Trigger pre-save hook to recalculate totals
    await updated.save();

    // Populate client after save
    await updated.populate('clientId');

    res.json({ invoice: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msgs });
    }
    res.status(500).json({ message: err.message });
  }
});

// ---------- UPDATE STATUS ONLY ----------
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });
  if (!['draft', 'sent', 'paid', 'overdue'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      { status },
      { new: true }
    ).populate('clientId');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ---------- DELETE ----------
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Invoice.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    });
    
    if (!deleted) return res.status(404).json({ message: 'Invoice not found or unauthorized' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;