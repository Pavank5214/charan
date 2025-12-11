const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const router = express.Router();

// --- 1. LOGIN ROUTE (Unchanged) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Single User/Company Logic: Fetch the only company
    const company = await Company.findOne(); 

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company: company ? { id: company._id, name: company.name, gstin: company.gstin } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 2. NEW: CREATE USER (ADMIN ONLY) ---
router.post('/register', auth, async (req, res) => {
  try {
    // A. Check if the requester is an Admin
    // We fetch the user performing the request to verify their role
    const adminUser = await User.findById(req.user._id || req.user.userId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Only Admins can create users.' });
    }

    // B. Get new user details
    const { name, email, password, role } = req.body;

    // C. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // D. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // E. Create new user
    const newUser = new User({
      name,
      email,
      password, // Your User model should handle hashing in a 'pre-save' hook
      role: role || 'user' // Default to 'user' if admin doesn't specify
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'User created successfully', 
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 3. GET CURRENT USER (Unchanged) ---
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.userId).select('-password');
    const company = await Company.findOne(); // Fetch the shared company details

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 3. GET ALL USERS (ADMIN ONLY) ---
router.get('/users', auth, async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    // Fetch all users, excluding passwords
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 4. UPDATE USER (ADMIN ONLY) ---
router.put('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });

    const { name, email, role, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      user.password = password; // Should trigger pre-save hash hook in model
    }

    await user.save();
    res.json({ message: 'User updated', user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 5. DELETE USER (ADMIN ONLY) ---
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });

    // Prevent deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;