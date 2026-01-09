const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireAdminBarang } = require('../middleware/authMiddleware');

/**
 * Dashboard Routes
 * Only Admin Barang (admin_barang) can access these routes
 */

// Get dashboard summary
router.get('/summary', verifyToken, requireAdminBarang, dashboardController.getDashboardSummary);

// Get monthly sales report
router.get('/monthly-sales', verifyToken, requireAdminBarang, dashboardController.getMonthlySalesReport);

// Get profit/loss report
router.get('/profit-loss', verifyToken, requireAdminBarang, dashboardController.getProfitLossReport);

// Get stock report
router.get('/stock-report', verifyToken, requireAdminBarang, dashboardController.getStockReport);

module.exports = router;
