const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Demo users (ganti dengan database queries)
const DEMO_USERS = {
  'admin': { id: 1, username: 'admin', password: '123456' },
  'kasir': { id: 2, username: 'kasir', password: '123456' }
};

router.post('/register', authController.register);
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    const user = DEMO_USERS[username];

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✓ Login success:', username);
    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
