const express = require('express');
const authenticateToken = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

let nextInvoiceNumber = 1001;

// GET all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/transactions');
    const transactions = await Transaction.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ 
      success: true,
      transactions: transactions,
      count: transactions.length 
    });
  } catch (error) {
    console.error('❌ Error getting transactions:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// GET single transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('❌ Error getting transaction:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// POST create transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, total, paymentMethod, discount } = req.body;

    if (!items || items.length === 0 || !total) {
      return res.status(400).json({ success: false, message: 'Items dan total harus diisi' });
    }

    const invoiceNumber = 'INV-' + nextInvoiceNumber++;
    
    const transaction = await Transaction.create({
      invoiceNumber,
      items,
      total: parseInt(total),
      discount: parseInt(discount) || 0,
      paymentMethod: paymentMethod || 'Tunai',
      userId: req.user.id
    });

    console.log('✓ POST /api/transactions - Created:', invoiceNumber);
    res.status(201).json({ 
      success: true,
      message: 'Transaksi berhasil disimpan',
      invoiceNumber: invoiceNumber,
      transaction
    });
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

module.exports = router;
