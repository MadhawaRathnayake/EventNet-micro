const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token from the Authorization header.
 * The JWT secret must match the one used by the User Service.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authorization header provided.',
      });
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid authorization format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify the token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request object
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error.',
    });
  }
};

/**
 * Admin-only middleware (must be used after authenticate)
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
