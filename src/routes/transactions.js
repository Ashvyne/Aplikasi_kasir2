const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Public routes (no auth required)
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
