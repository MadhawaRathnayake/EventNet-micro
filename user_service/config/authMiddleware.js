const jwt = require('jsonwebtoken');

function verifyInternalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (error) {
    console.error("Token validation failed:", error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

module.exports = verifyInternalToken;