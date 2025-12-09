const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public - Get products (untuk POS)
router.get('/', productController.getAllProducts);
router.get('/seed/dummy', productController.seedDummyData);

// Protected - CRUD operations
router.post('/', verifyToken, productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
