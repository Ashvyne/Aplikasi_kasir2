const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Dashboard Routes
 */

// Get dashboard summary
router.get('/summary', verifyToken, dashboardController.getDashboardSummary);

// Get monthly sales report
router.get('/monthly-sales', verifyToken, dashboardController.getMonthlySalesReport);

// Get profit/loss report
router.get('/profit-loss', verifyToken, dashboardController.getProfitLossReport);

// Get stock report
router.get('/stock-report', verifyToken, dashboardController.getStockReport);

module.exports = router;
