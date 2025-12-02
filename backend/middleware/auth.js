const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get user's company
    const company = await Company.findOne({ user: user._id });

    if (!company) {
      return res.status(400).json({ message: 'No company found for user' });
    }

    req.user = user;
    req.user.currentCompanyId = company._id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
