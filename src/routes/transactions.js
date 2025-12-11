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
    console.log('   Request body:', JSON.stringify(req.body, null, 2));

    // Validasi input
    if (!items || items.length === 0) {
      console.warn('⚠️ Items not provided or empty');
      return res.status(400).json({ 
        success: false, 
        message: 'Items harus diisi' 
      });
    }

    if (!total || total <= 0) {
      console.warn('⚠️ Total not valid');
      return res.status(400).json({ 
        success: false, 
        message: 'Total harus lebih dari 0' 
      });
    }

    // Generate invoice number dengan timestamp untuk unique
    const timestamp = Date.now();
    const invoiceNumber = 'INV-' + Math.floor(timestamp / 1000) + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    console.log('   Generated invoice:', invoiceNumber);

    // Pastikan items adalah array dari object yang valid
    let validItems = items;
    if (typeof items === 'string') {
      validItems = JSON.parse(items);
    }

    // Create transaction dengan data yang valid
    const transaction = await Transaction.create({
      invoiceNumber: invoiceNumber,
      items: JSON.stringify(validItems), // Convert to string untuk JSON field
      total: parseInt(total) || 0,
      discount: parseInt(discount) || 0,
      paymentMethod: paymentMethod || 'Tunai',
      userId: req.user?.id || 1
    });

    console.log('✓ Transaction created:', {
      id: transaction.id,
      invoice: transaction.invoiceNumber,
      total: transaction.total,
      itemCount: validItems.length
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
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Errors:', error.errors);
    
    // Parse validation errors
    let errorMessage = 'Gagal menyimpan transaksi';
    if (error.errors && error.errors.length > 0) {
      errorMessage = error.errors.map(e => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
