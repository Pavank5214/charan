const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");

const auth = async (req, res, next) => {
  try {
    // ❌ Never allow silent fallback
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const authHeader = req.headers.authorization;

    // ✅ Hard validation of header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "Invalid token value" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: "Token payload invalid" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ⚠️ TEMP single-tenant logic (acceptable for now)
    const company = await Company.findOne();

    req.user = user;
    req.user.currentCompanyId = company ? company._id : null;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Token verification failed" });
  }
};

module.exports = auth;
