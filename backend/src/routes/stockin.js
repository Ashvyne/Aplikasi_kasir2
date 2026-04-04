const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');
const { verifyToken, requireItemUser, requireAdminBarang } = require('../middleware/authMiddleware');

/**
 * Stock In (Barang Masuk) Routes - Item User Only
 * Item User can manage incoming stock/inventory
 * Cashier does NOT have access to stock in management
 * 
 * Order is important:
 * - Specific routes first (/report/summary, /by-code/:sku)
 * - Generic routes last (/, /:id)
 */

// Get stock in report (specific route - must be before /:id) - Item User only
router.get('/report/summary', verifyToken, requireItemUser, stockInController.getStockInReport);

// Get stock in by product code (specific route - must be before /:id) - Item User only
router.get('/by-code/:sku', verifyToken, requireItemUser, stockInController.getStockInByProductCode);

// Get all stock in records - Item User only
router.get('/', verifyToken, requireItemUser, stockInController.getAllStockIn);

// Create stock in record - Item User only
router.post('/', verifyToken, requireItemUser, stockInController.createStockIn);

// Get single stock in record (generic route - must be last) - Item User only
router.get('/:id', verifyToken, requireItemUser, stockInController.getStockInById);

// Delete stock in record - Item User only
router.delete('/:id', verifyToken, requireItemUser, stockInController.deleteStockIn);

module.exports = router;
