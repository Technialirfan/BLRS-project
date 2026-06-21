const jwt = require("jsonwebtoken");
const Officer = require("../models/Officer");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const officer = await Officer.findById(decoded.id).select("+password");

    if (!officer) {
      return res.status(401).json({
        success: false,
        message: "Officer account no longer exists.",
      });
    }

    if (!officer.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact administrator.",
      });
    }

    if (officer.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password recently changed. Please login again.",
      });
    }

    req.officer = officer;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return next(error);
  }
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

module.exports = { protect, generateToken };