const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes here require admin privileges
router.use(verifyToken, requireAdmin);

// GET /api/users - List all users
router.get('/', userController.getAllUsers);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', userController.deleteUser);

// PUT /api/users/:id - Update user role or name
router.put('/:id', userController.updateUser);

module.exports = router;
