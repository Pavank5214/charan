const express = require('express');
const router = express.Router();
const Item = require('../models/item');
const auth = require('../middleware/auth');

// GET all items
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ companyId: req.user.currentCompanyId })
      .sort({ name: 1 }); // Sort alphabetically
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOne({ 
      _id: req.params.id, 
      companyId: req.user.currentCompanyId 
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new item
router.post('/', auth, async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      companyId: req.user.currentCompanyId
    });
    
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Item with this name already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

// UPDATE item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Item with this name already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

// DELETE item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ 
      _id: req.params.id, 
      companyId: req.user.currentCompanyId 
    });

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;