// routes/quotation.js
const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const auth = require('../middleware/auth');

// GET all quotations
router.get('/', auth, async (req, res) => {
  try {
    const quotations = await Quotation.find({ companyId: req.user.currentCompanyId }).sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one quotation
router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new quotation
router.post('/', auth, async (req, res) => {
  try {
    const quotation = new Quotation({
      ...req.body,
      companyId: req.user.currentCompanyId
    });
    await quotation.save();
    res.status(201).json(quotation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Quotation number already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

// UPDATE full quotation (edit)
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Quotation not found' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: msgs });
    }
    res.status(500).json({ message: err.message });
  }
});

// UPDATE status (draft → sent → accepted → etc.)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['draft', 'sent', 'approved', 'accepted', 'rejected', 'converted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE quotation
router.delete('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;