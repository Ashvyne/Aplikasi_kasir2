const express = require('express');
const authenticateToken = require('../middleware/auth');
const { verifyToken, requireCashier, requireAdminKasir } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const router = express.Router();

let nextInvoiceNumber = 1001;

// ============ TRANSACTION OPERATIONS - CASHIER ONLY ============
// GET all transactions - Cashier only
router.get('/', verifyToken, requireCashier, async (req, res) => {
  try {
    console.log(`✓ GET /api/transactions (user: ${req.user.username})`);
    const transactions = await Transaction.findAll({ 
      order: [['created_at', 'DESC']] 
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

// GET single transaction - Cashier only
router.get('/:id', verifyToken, requireCashier, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('❌ Error getting transaction:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// DELETE transaction - Cashier only
router.delete('/:id', verifyToken, requireCashier, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  DELETE /api/transactions/${id} (user: ${req.user.username})`);

    // Get transaction items first to reverse stock
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    // Parse items dan reverse stock untuk setiap item
    let items = transaction.items || [];
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }

    // Reverse stock untuk setiap produk
    for (const item of items) {
      const Product = require('../models/Product');
      // Support both 'id' dan 'product_id' field names
      const productId = item.id || item.product_id;
      const product = await Product.findByPk(productId);
      if (product) {
        product.stock = (product.stock || 0) + (item.quantity || 0);
        await product.save();
        console.log(`✓ Reversed stock for product ${productId}: +${item.quantity}`);
      }
    }

    // Delete transaction
    await transaction.destroy();
    console.log(`✓ Transaction ${id} deleted successfully by ${req.user.username}`);

    res.json({ 
      success: true, 
      message: 'Transaksi berhasil dihapus',
      id: id
    });
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus transaksi: ' + error.message 
    });
  }
});

// POST create transaction - Cashier only
router.post('/', verifyToken, requireCashier, async (req, res) => {
  try {
    const { items, total, paymentMethod, discount } = req.body;

    console.log('📝 POST /api/transactions (user: ${req.user.username})');
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

    // Normalize items: standardize ke product_id (dari id jika perlu)
    validItems = validItems.map(item => ({
      product_id: item.product_id || item.id, // Support both id dan product_id
      id: item.product_id || item.id,         // Keep id field too for compatibility
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Create transaction dengan data yang valid
    const transaction = await Transaction.create({
      invoiceNumber: invoiceNumber,
      items: validItems, // Sequelize akan auto JSON.stringify untuk JSON field
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
