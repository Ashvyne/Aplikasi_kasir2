const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyToken, requireItemUser } = require('../middleware/authMiddleware');

// ============ EXPORT OPERATIONS - ITEM USER ONLY ============
// Export sales to Excel - Item User only
router.get('/sales-excel', verifyToken, requireItemUser, exportController.exportSalesExcel);

// Export products to Excel - Item User only
router.get('/products-excel', verifyToken, requireItemUser, exportController.exportProductsExcel);

// Export reports to Excel - Item User only
router.get('/reports-excel', verifyToken, requireItemUser, exportController.exportReportsExcel);

module.exports = router;
