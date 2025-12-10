const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');
const authenticateToken = require('../middleware/auth');

router.get('/daily', verifyToken, transactionController.getDailySalesReport);
router.get('/top-products', verifyToken, transactionController.getTopProducts);
router.get('/stock', verifyToken, transactionController.getStockReport);
router.get('/revenue', verifyToken, transactionController.getRevenueByDate);
router.get('/dashboard', verifyToken, reportController.getDashboardAnalytics);
router.get('/payment-method', verifyToken, reportController.getSalesByPaymentMethod);
router.get('/monthly', verifyToken, reportController.getMonthlyRevenue);

// GET reports
router.get('/', authenticateToken, (req, res) => {
  try {
    console.log('✓ GET /api/reports');
    const reports = {
      success: true,
      todayTransactions: 5,
      todayRevenue: 250000,
      weekTransactions: 35,
      lowStockCount: 3,
      topProducts: [
        { name: 'Nasi Goreng', sold: 25, revenue: 625000 },
        { name: 'Mie Ayam', sold: 15, revenue: 300000 },
        { name: 'Es Teh Manis', sold: 50, revenue: 250000 }
      ]
    };

    res.json(reports);
  } catch (error) {
    console.error('❌ Error getting reports:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

module.exports = router;
