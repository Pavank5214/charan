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
      return res.status(401).json({ message: 'Token is valid, but User does not exist' });
    }

    // --- FIX START ---
    
    // Instead of looking for a company belonging to THIS user,
    // we fetch the FIRST (and only) company in the database.
    const company = await Company.findOne(); 

    req.user = user;
    
    if (company) {
      // Attach the global company ID to the request
      req.user.currentCompanyId = company._id;
    } else {
      // Edge case: If NO company exists at all (brand new install), 
      // only then might we handle creation, or just leave it null.
      // For now, we assume you (Admin) already have a company.
      req.user.currentCompanyId = null; 
    }
    
    // --- FIX END ---

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;