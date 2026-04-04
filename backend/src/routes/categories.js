/**
 * CATEGORY ROUTES
 * Endpoints for managing menu categories
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// All category routes require authentication
router.use(auth);

// Category CRUD
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Reorder categories
router.post('/reorder/all', categoryController.reorderCategories);

module.exports = router;
