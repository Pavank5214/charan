const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const auth = require('../middleware/auth');

// GET all purchase orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ companyId: req.user.currentCompanyId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single purchase order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ 
      _id: req.params.id, 
      companyId: req.user.currentCompanyId 
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new purchase order
router.post('/', auth, async (req, res) => {
  try {
    const order = new PurchaseOrder({
      ...req.body,
      companyId: req.user.currentCompanyId
    });
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE purchase order
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE purchase order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndDelete({ 
      _id: req.params.id, 
      companyId: req.user.currentCompanyId 
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;