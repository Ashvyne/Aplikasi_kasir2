const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Demo users dengan role
const DEMO_USERS = {
  'admin': { id: 1, username: 'admin', password: '123456', role: 'admin_barang' },
  'kasir': { id: 2, username: 'kasir', password: '123456', role: 'admin_kasir' }
};

// Simple in-memory session store untuk demo (akan diganti dengan database di production)
const demoSessions = new Map();

router.post('/register', authController.register);

router.post('/login', (req, res) => {
  try {
    const { username, password, deviceRole, deviceName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    const user = DEMO_USERS[username];

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Generate unique session ID
    const sessionId = uuidv4();
    
    // Tentukan role untuk session ini
    // Jika deviceRole disediakan dan valid, gunakan itu
    // Jika tidak, gunakan role default user
    const validRoles = ['admin_kasir', 'admin_barang'];
    const sessionRole = (deviceRole && validRoles.includes(deviceRole)) ? deviceRole : user.role;

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: sessionRole,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Simpan session ke memory untuk demo
    demoSessions.set(sessionId, {
      userId: user.id,
      username: user.username,
      role: sessionRole,
      deviceName: deviceName || `Device-${sessionId.substring(0, 8)}`,
      createdAt: new Date(),
      isActive: true
    });

    console.log('✓ Login success:', username, 'with role:', sessionRole, 'sessionId:', sessionId);
    res.json({
      message: 'Login berhasil',
      token,
      sessionId,
      user: { id: user.id, username: user.username, role: sessionRole }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// Logout - hanya logout session tertentu
router.post('/logout', (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    const token = req.headers.authorization?.split(' ')[1];

    if (!sessionId && !token) {
      return res.status(400).json({ message: 'Session ID atau token diperlukan' });
    }

    // Untuk demo, cukup hapus dari memory
    if (sessionId && demoSessions.has(sessionId)) {
      demoSessions.delete(sessionId);
      console.log('✓ Session logged out:', sessionId);
    }

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Logout gagal' });
  }
});

// Get all active sessions untuk user tertentu
router.get('/sessions', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Untuk demo, return semua session user
    const userSessions = Array.from(demoSessions.entries())
      .filter(([_, session]) => session.userId === userId && session.isActive)
      .map(([sessionId, session]) => ({
        id: sessionId,
        deviceName: session.deviceName,
        role: session.role,
        createdAt: session.createdAt,
        isActive: session.isActive
      }));

    res.json({ sessions: userSessions });
  } catch (error) {
    console.error('❌ Get sessions error:', error);
    res.status(500).json({ message: 'Gagal mengambil data session' });
  }
});

// Logout device tertentu
router.post('/logout-device/:sessionId', verifyToken, (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Validasi bahwa session milik user saat ini
    if (demoSessions.has(sessionId)) {
      const session = demoSessions.get(sessionId);
      if (session.userId === userId) {
        demoSessions.delete(sessionId);
        console.log('✓ Device logged out:', sessionId);
        return res.json({ message: 'Device berhasil logout' });
      }
    }

    res.status(403).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('❌ Logout device error:', error);
    res.status(500).json({ message: 'Gagal logout device' });
  }
});

router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
