const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController-new');
const { verifyToken } = require('../middleware/authMiddleware');

// PUBLIC: Login with username or email and password
router.post('/login', authController.login);

// PUBLIC: Register new user (admin only in practice)
router.post('/register', authController.register);

// PROTECTED: Get current user profile
router.get('/me', verifyToken, authController.getCurrentUser);

// PROTECTED: Change password
router.post('/change-password', verifyToken, authController.changePassword);

// PROTECTED: Logout
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
