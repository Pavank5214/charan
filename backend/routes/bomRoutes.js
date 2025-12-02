const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BOM = require('../models/BOM');

// ---------- CREATE ----------
router.post('/', auth, async (req, res) => {
  try {
    const bom = new BOM({
      ...req.body,
      user: req.user.id // Attach to logged-in user
    });
    
    const saved = await bom.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('BOM Save Error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'BOM number already exists' });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ---------- READ ALL ----------
router.get('/', auth, async (req, res) => {
  try {
    const boms = await BOM.find({ user: req.user.id })
      .sort({ createdAt: -1 }); // Newest first
    res.json(boms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- READ ONE ----------
router.get('/:id', auth, async (req, res) => {
  try {
    const bom = await BOM.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!bom) return res.status(404).json({ message: 'BOM not found' });
    res.json(bom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- UPDATE FULL (EDIT) ----------
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await BOM.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'BOM not found' });
    res.json(updated);
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
  
  try {
    const bom = await BOM.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    );

    if (!bom) return res.status(404).json({ message: 'BOM not found' });
    res.json(bom);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ---------- DELETE ----------
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await BOM.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!deleted) return res.status(404).json({ message: 'BOM not found or unauthorized' });
    res.json({ message: 'BOM deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;