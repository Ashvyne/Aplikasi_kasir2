const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// ============ VALIDATION RULES ============
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('name').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong jika diisi')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi')
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Password saat ini wajib diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
];

// ============ REGISTRATION ============
router.post('/register', registerValidation, authController.register);

// ============ LOGIN ============
router.post('/login', loginValidation, authController.login);

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

// ============ CHANGE PASSWORD ============
router.put('/change-password', verifyToken, passwordValidation, authController.changePassword);

// ============ GET CURRENT USER ============
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
