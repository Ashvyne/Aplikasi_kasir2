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
        console.warn('⚠️ Invalid token:', err.message);
        return res.status(403).json({ message: 'Token tidak valid' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
};

module.exports = authenticateToken;
