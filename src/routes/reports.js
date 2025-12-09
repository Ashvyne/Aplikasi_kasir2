const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/daily', verifyToken, reportController.getDailySalesReport);
router.get('/top-products', verifyToken, reportController.getTopProducts);
router.get('/stock', verifyToken, reportController.getStockReport);
router.get('/revenue', verifyToken, reportController.getRevenueByDate);
router.get('/dashboard', verifyToken, reportController.getDashboardAnalytics);
router.get('/payment-method', verifyToken, reportController.getSalesByPaymentMethod);
router.get('/monthly', verifyToken, reportController.getMonthlyRevenue);

module.exports = router;
