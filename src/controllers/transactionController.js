const { db } = require('../config/database');

// Create transaction
exports.createTransaction = (req, res) => {
  const { payment_method, total_amount, cash_received, change_amount, items, notes } = req.body;
  
  console.log('Creating transaction:', { payment_method, total_amount, items: items?.length });
  
  // Validasi input
  if (!payment_method || !total_amount || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Data transaksi tidak lengkap',
      received: { payment_method, total_amount, itemsCount: items?.length }
    });
  }

  // Validasi stok sebelum transaksi
  let stockValid = true;
  let stockErrors = [];

  items.forEach((item, idx) => {
    db.get(
      `SELECT stock FROM products WHERE id = ?`,
      [parseInt(item.product_id)],
      (err, row) => {
        if (err || !row) {
          stockValid = false;
          stockErrors.push(`Produk ${item.product_id} tidak ditemukan`);
        } else if (row.stock < parseInt(item.quantity)) {
          stockValid = false;
          stockErrors.push(`Stok produk ${item.product_id} tidak cukup (tersedia: ${row.stock})`);
        }
      }
    );
  });

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;

  db.run(
    `INSERT INTO transactions 
     (invoice_number, payment_method, total_amount, cash_received, change_amount, notes) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, payment_method, parseInt(total_amount), parseInt(cash_received || 0), parseInt(change_amount || 0), notes || ''],
    function(err) {
      if (err) {
        console.error('❌ createTransaction DB error:', err.message);
        return res.status(500).json({ 
          error: 'Gagal membuat transaksi: ' + err.message 
        });
      }

      const transactionId = this.lastID;
      let itemsInserted = 0;
      let itemsFailed = 0;
      let insertError = null;
      let stockUpdateCount = 0;

      // Insert transaction items FIRST
      items.forEach((item, idx) => {
        console.log(`Inserting item ${idx + 1}:`, item);
        
        db.run(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, quantity, subtotal) 
           VALUES (?, ?, ?, ?)`,
          [transactionId, parseInt(item.product_id), parseInt(item.quantity), parseInt(item.subtotal)],
          (err) => {
            if (err) {
              console.error(`❌ insertItem ${idx + 1} error:`, err.message);
              insertError = err;
              itemsFailed++;
            } else {
              console.log(`✓ Item ${idx + 1} inserted`);
              itemsInserted++;
            }

            // Setelah semua items inserted, baru update stock
            if (itemsInserted + itemsFailed === items.length) {
              if (insertError) {
                return res.status(500).json({ 
                  error: 'Gagal menyimpan item transaksi: ' + insertError.message 
                });
              }

              console.log(`✓ All items inserted. Now updating stock...`);

              // Update product stock SEQUENTIALLY
              items.forEach((item, idx) => {
                const productId = parseInt(item.product_id);
                const quantity = parseInt(item.quantity);

                db.run(
                  `UPDATE products SET stock = stock - ? WHERE id = ?`,
                  [quantity, productId],
                  function(err) {
                    if (err) {
                      console.error(`❌ updateStock product ${productId} error:`, err.message);
                    } else {
                      console.log(`✓ Stock updated for product ${productId} (-${quantity})`);
                      stockUpdateCount++;

                      // Check jika semua stock sudah terupdate
                      if (stockUpdateCount === items.length) {
                        console.log(`✓ Transaction ${invoiceNumber} completed successfully`);
                        res.status(201).json({
                          message: 'Transaksi berhasil dibuat',
                          id: transactionId,
                          invoice_number: invoiceNumber,
                          total_amount: parseInt(total_amount),
                          cash_received: parseInt(cash_received || 0),
                          change_amount: parseInt(change_amount || 0)
                        });
                      }
                    }
                  }
                );
              });
            }
          }
        );
      });
    }
  );
};

// Get all transactions
exports.getAllTransactions = (req, res) => {
  db.all(
    `SELECT * FROM transactions ORDER BY transaction_date DESC`,
    (err, rows) => {
      if (err) {
        console.error('getAllTransactions error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Get transaction by ID
exports.getTransactionById = (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT * FROM transactions WHERE id = ?`,
    [id],
    (err, transaction) => {
      if (err) {
        console.error('getTransactionById error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      }

      // Get transaction items
      db.all(
        `SELECT ti.*, p.name, p.sku, p.price FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = ?`,
        [id],
        (err, items) => {
          if (err) {
            console.error('getTransactionItems error:', err);
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            ...transaction,
            items: items || []
          });
        }
      );
    }
  );
};

// Get daily sales report
exports.getDailySalesReport = (req, res) => {
  const date = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT * FROM transactions 
     WHERE DATE(transaction_date) = ? 
     ORDER BY transaction_date DESC`,
    [date],
    (err, rows) => {
      if (err) {
        console.error('getDailySalesReport error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Get top products (sorted by revenue)
exports.getTopProducts = (req, res) => {
  db.all(
    `SELECT p.id, p.name, p.price, SUM(ti.quantity) as total_qty, SUM(ti.subtotal) as total_revenue
     FROM transaction_items ti
     JOIN products p ON ti.product_id = p.id
     GROUP BY p.id
     ORDER BY total_revenue DESC
     LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error('getTopProducts error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Get stock report
exports.getStockReport = (req, res) => {
  db.all(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.stock ASC`,
    (err, rows) => {
      if (err) {
        console.error('getStockReport error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Get revenue by date
exports.getRevenueByDate = (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `SELECT DATE(transaction_date) as date, COUNT(*) as transactions, SUM(total_amount) as revenue
               FROM transactions`;
  const params = [];
  
  if (startDate && endDate) {
    query += ` WHERE DATE(transaction_date) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }
  
  query += ` GROUP BY DATE(transaction_date) ORDER BY date DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('getRevenueByDate error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
};
