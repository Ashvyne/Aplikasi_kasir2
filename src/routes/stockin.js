const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');
const { verifyToken, requireAdminBarang } = require('../middleware/authMiddleware');

/**
 * Stock In (Barang Masuk) Routes
 * Only Admin Barang (admin_barang) can access
 * 
 * Order is important:
 * - Specific routes first (/report/summary, /by-code/:sku)
 * - Generic routes last (/, /:id)
 */

// Get stock in report (specific route - must be before /:id) - Admin Barang only
router.get('/report/summary', verifyToken, requireAdminBarang, stockInController.getStockInReport);

// Get stock in by product code (specific route - must be before /:id) - Admin Barang only
router.get('/by-code/:sku', verifyToken, requireAdminBarang, stockInController.getStockInByProductCode);

// Get all stock in records - Admin Barang only
router.get('/', verifyToken, requireAdminBarang, stockInController.getAllStockIn);

// Create stock in record - Admin Barang only
router.post('/', verifyToken, requireAdminBarang, stockInController.createStockIn);

// Get single stock in record (generic route - must be last) - Admin Barang only
router.get('/:id', verifyToken, requireAdminBarang, stockInController.getStockInById);

// Delete stock in record - Admin Barang only
router.delete('/:id', verifyToken, requireAdminBarang, stockInController.deleteStockIn);

module.exports = router;
