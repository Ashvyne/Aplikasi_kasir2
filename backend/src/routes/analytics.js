/**
 * ANALYTICS & REPORTS ROUTES
 * Endpoints for POS analytics, reports, and business intelligence
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// All analytics routes require authentication
router.use(auth);

// Dashboard summary
router.get('/summary', dashboardController.getDashboardSummary);

// Revenue & Sales Analytics
router.get('/revenue/analytics', dashboardController.getRevenueAnalytics);
router.get('/revenue/hourly', dashboardController.getHourlyRevenue);

// Product Analytics
router.get('/products/top-selling', dashboardController.getTopSellingItems);

// Payment Analytics
router.get('/payments/distribution', dashboardController.getPaymentMethodDistribution);

// Order Analytics
router.get('/orders/type-distribution', dashboardController.getOrderTypeDistribution);

// Customer Analytics
router.get('/customers/stats', dashboardController.getCustomerStats);

// Recent orders
router.get('/orders/recent', dashboardController.getRecentOrders);

// Detailed Report
router.get('/reports/detailed', dashboardController.getDetailedReport);

module.exports = router;
