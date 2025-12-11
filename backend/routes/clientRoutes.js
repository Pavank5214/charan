const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const auth = require('../middleware/auth');

// GET all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ companyId: req.user.currentCompanyId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one client
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE new client
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.currentCompanyId) {
      const Company = require('../models/Company');
      const company = new Company({
        user: req.user._id,
        name: `${req.user.name}'s Company`,
        email: req.user.email,
        phone: req.user.phone
      });
      await company.save();
      req.user.currentCompanyId = company._id;
      await req.user.save();
    }
    const client = new Client({
      ...req.body,
      companyId: req.user.currentCompanyId
    });
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Client with this GSTIN or mobile already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

// UPDATE client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.currentCompanyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE client
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.currentCompanyId
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
