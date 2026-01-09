const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Demo users dengan role
const DEMO_USERS = {
  'admin': { id: 1, username: 'admin', password: '123456', role: 'admin_barang' },
  'kasir': { id: 2, username: 'kasir', password: '123456', role: 'admin_kasir' }
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
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✓ Login success:', username, 'with role:', user.role);
    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
