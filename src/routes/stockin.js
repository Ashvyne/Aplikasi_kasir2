const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Stock In (Barang Masuk) Routes
 * 
 * Order is important:
 * - Specific routes first (/report/summary, /by-code/:sku)
 * - Generic routes last (/, /:id)
 */

// Get stock in report (specific route - must be before /:id)
router.get('/report/summary', verifyToken, stockInController.getStockInReport);

// Get stock in by product code (specific route - must be before /:id)
router.get('/by-code/:sku', verifyToken, stockInController.getStockInByProductCode);

// Get all stock in records
router.get('/', verifyToken, stockInController.getAllStockIn);

// Create stock in record
router.post('/', verifyToken, stockInController.createStockIn);

// Get single stock in record (generic route - must be last)
router.get('/:id', verifyToken, stockInController.getStockInById);

// Delete stock in record
router.delete('/:id', verifyToken, stockInController.deleteStockIn);

module.exports = router;
