const express = require('express');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
const productsRouter = require('./products');

let transactions = [];
let nextInvoiceNumber = 1001;

// GET all transactions
router.get('/', authenticateToken, (req, res) => {
  try {
    console.log('✓ GET /api/transactions');
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
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const transaction = transactions.find(t => t.id === parseInt(req.params.id));
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('❌ Error getting transaction:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// POST create transaction dengan pengurangan stok
router.post('/', authenticateToken, (req, res) => {
  try {
    const { items, total, paymentMethod, discount } = req.body;

    // Validasi input
    if (!items || items.length === 0 || !total) {
      return res.status(400).json({ 
        success: false,
        message: 'Items dan total harus diisi' 
      });
    }

    // Buat invoice number
    const invoiceNumber = 'INV-' + nextInvoiceNumber++;
    
    // Buat object transaksi
    const newTransaction = {
      id: transactions.length + 1,
      invoiceNumber: invoiceNumber,
      items: items,
      total: parseInt(total),
      discount: parseInt(discount) || 0,
      paymentMethod: paymentMethod || 'Tunai',
      userId: req.user.id,
      createdAt: new Date()
    };

    // Simpan transaksi
    transactions.push(newTransaction);
    
    console.log('✓ POST /api/transactions - Created:', invoiceNumber);
    console.log('📊 Transaction details:', {
      invoice: invoiceNumber,
      items: items.length,
      total: total,
      discount: discount || 0
    });

    res.status(201).json({ 
      success: true,
      message: 'Transaksi berhasil disimpan',
      invoiceNumber: invoiceNumber,
      id: newTransaction.id,
      transaction: newTransaction
    });
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan' 
    });
  }
});

module.exports = router;
