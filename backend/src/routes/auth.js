const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// ============ REGISTRATION ============
router.post('/register', authController.register);

// ============ LOGIN ============
router.post('/login', authController.login);

// ============ LOGOUT ============
router.post('/logout', authController.logout);

// ============ SESSIONS (mock support for dashboard) ============
router.get('/sessions', verifyToken, (req, res) => {
  // We removed session tracking for simplicity, just return current mock session
  res.json({
    success: true,
    sessions: [{
        id: req.user.sessionId || 'mock-id',
        deviceName: 'Current Device',
        role: req.user.role,
        createdAt: new Date(),
        isActive: true
    }]
  });
});

router.post('/logout-device/:sessionId', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Device logged out locally' });
});

// ============ GET CURRENT USER ============
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
