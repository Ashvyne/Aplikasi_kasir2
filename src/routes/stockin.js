const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Stock In (Barang Masuk) Routes
 */

// Get all stock in records
router.get('/', verifyToken, stockInController.getAllStockIn);

// Get single stock in record
router.get('/:id', verifyToken, stockInController.getStockInById);

// Create stock in record
router.post('/', verifyToken, stockInController.createStockIn);

// Get stock in by product code (SKU)
router.get('/by-code/:sku', verifyToken, stockInController.getStockInByProductCode);

// Get stock in report
router.get('/report/summary', verifyToken, stockInController.getStockInReport);

// Delete stock in record
router.delete('/:id', verifyToken, stockInController.deleteStockIn);

module.exports = router;
