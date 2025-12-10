const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.warn('⚠️ No token provided');
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        console.warn('⚠️ Token verification failed:', err.message);
        return res.status(403).json({ message: 'Token tidak valid' });
      }

      req.user = user;
      console.log('✓ Token verified for user:', user.username);
      next();
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = authenticateToken;
