const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authenticateToken = require('../middleware/auth');

// Export sales to Excel
router.get('/sales-excel', authenticateToken, exportController.exportSalesExcel);

// Export products to Excel
router.get('/products-excel', authenticateToken, exportController.exportProductsExcel);

// Export reports to Excel
router.get('/reports-excel', authenticateToken, exportController.exportReportsExcel);

module.exports = router;
