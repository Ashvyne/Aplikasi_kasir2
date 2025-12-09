const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionDetail);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
