const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/struk/:id', verifyToken, exportController.printStruk);
router.get('/sales-excel', verifyToken, exportController.exportSalesExcel);
router.get('/products-excel', verifyToken, exportController.exportProductsExcel);

module.exports = router;
