const express = require('express');
const authenticateToken = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const router = express.Router();

let nextInvoiceNumber = 1001;

// GET all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/transactions');
    const transactions = await Transaction.findAll({ 
      order: [['createdAt', 'DESC']] 
    });
    res.json({ 
      success: true,
      transactions: transactions,
      count: transactions.length 
    });
  } catch (error) {
    console.error('❌ Error getting transactions:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
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

    console.log('📝 POST /api/transactions');
    console.log('   Items:', items?.length);
    console.log('   Total:', total);
    console.log('   Method:', paymentMethod);
    console.log('   Discount:', discount);

    // Validasi input
    if (!items || items.length === 0) {
      console.warn('⚠️ Items not provided or empty');
      return res.status(400).json({ 
        success: false, 
        message: 'Items harus diisi' 
      });
    }

    if (!total) {
      console.warn('⚠️ Total not provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Total harus diisi' 
      });
    }

    // Generate invoice number
    const invoiceNumber = 'INV-' + nextInvoiceNumber++;
    
    console.log('   Generated invoice:', invoiceNumber);

    // Create transaction
    const transaction = await Transaction.create({
      invoiceNumber: invoiceNumber,
      items: items, // Akan otomatis di-stringify oleh Sequelize
      total: parseInt(total) || 0,
      discount: parseInt(discount) || 0,
      paymentMethod: paymentMethod || 'Tunai',
      userId: req.user?.id || 1 // Default ke user 1 jika tidak ada
    });

    console.log('✓ Transaction created:', {
      id: transaction.id,
      invoice: transaction.invoiceNumber,
      total: transaction.total,
      itemCount: items.length
    });

    res.status(201).json({ 
      success: true,
      message: 'Transaksi berhasil disimpan',
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      transaction: transaction
    });
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    console.error('   Stack:', error.stack);
    console.error('   Message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan transaksi: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
