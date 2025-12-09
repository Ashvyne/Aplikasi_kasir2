const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/daily', verifyToken, transactionController.getDailySalesReport);
router.get('/top-products', verifyToken, transactionController.getTopProducts);
router.get('/stock', verifyToken, transactionController.getStockReport);
router.get('/revenue', verifyToken, transactionController.getRevenueByDate);
router.get('/dashboard', verifyToken, reportController.getDashboardAnalytics);
router.get('/payment-method', verifyToken, reportController.getSalesByPaymentMethod);
router.get('/monthly', verifyToken, reportController.getMonthlyRevenue);

module.exports = router;
