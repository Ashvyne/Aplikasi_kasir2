const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const categoryController = require('../controllers/categoryController');
const router = express.Router();

// GET all categories (Public - everyone can see)
router.get('/', verifyToken, categoryController.getAllCategories);

// GET category by ID (Public)
router.get('/:id', verifyToken, categoryController.getCategoryById);

// CREATE category (Admin only)
router.post('/', verifyToken, requireAdmin, categoryController.createCategory);

// UPDATE category (Admin only)
router.put('/:id', verifyToken, requireAdmin, categoryController.updateCategory);

// DELETE category (Admin only)
router.delete('/:id', verifyToken, requireAdmin, categoryController.deleteCategory);

module.exports = router;
