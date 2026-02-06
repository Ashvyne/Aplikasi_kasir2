const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const router = express.Router();

// GET current user profile (All authenticated users)
router.get('/profile', verifyToken, userController.getProfile);

// UPDATE own profile (All authenticated users)
router.put('/profile', verifyToken, userController.updateProfile);

// GET all users (Admin only)
router.get('/', verifyToken, requireAdmin, userController.getAllUsers);

// GET users by role (Admin only)
router.get('/role/:role', verifyToken, requireAdmin, userController.getUsersByRole);

// GET user by ID (Admin only)
router.get('/:id', verifyToken, requireAdmin, userController.getUserById);

// CREATE new user (Admin only)
router.post('/', verifyToken, requireAdmin, userController.createUser);

// UPDATE user (Admin only)
router.put('/:id', verifyToken, requireAdmin, userController.updateUser);

// DELETE user (Admin only)
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);

// RESTORE deleted user (Admin only)
router.patch('/:id/restore', verifyToken, requireAdmin, userController.restoreUser);

module.exports = router;
