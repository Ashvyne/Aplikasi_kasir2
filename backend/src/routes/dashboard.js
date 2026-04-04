const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireItemUser, requireAdminBarang } = require('../middleware/authMiddleware');

/**
 * Dashboard Routes - Item User Only
 * Item User (admin_barang) can access inventory dashboard
 * Cashier does NOT have access to this dashboard
 */

// Get dashboard summary - Item User only
router.get('/summary', verifyToken, requireItemUser, dashboardController.getDashboardSummary);

// Get monthly sales report - Item User only
router.get('/monthly-sales', verifyToken, requireItemUser, dashboardController.getMonthlySalesReport);

// Get profit/loss report - Item User only
router.get('/profit-loss', verifyToken, requireItemUser, dashboardController.getProfitLossReport);

// Get stock report - Item User only
router.get('/stock-report', verifyToken, requireItemUser, dashboardController.getStockReport);

module.exports = router;
