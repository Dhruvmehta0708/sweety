const jwt = require('jsonwebtoken');

// Middleware to verify JWT authentication token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if Bearer token was provided in header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'sweety_secret_key_default';
    const decoded = jwt.verify(token, secret);

    // Attach decoded user payload { id, name, email } to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = requireAuth;
