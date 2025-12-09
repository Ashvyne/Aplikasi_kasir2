const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create new transaction
exports.createTransaction = (req, res) => {
  const { items, payment_method, cash_received, notes } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Tidak ada item transaksi' });
  }

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let totalAmount = 0;

  // Calculate total
  items.forEach(item => {
    totalAmount += item.subtotal;
  });

  const changeAmount = cash_received ? cash_received - totalAmount : 0;

  db.run(
    `INSERT INTO transactions 
     (invoice_number, total_amount, payment_method, cash_received, change_amount, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invoiceNumber, totalAmount, payment_method, cash_received || 0, changeAmount, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const transactionId = this.lastID;
      
      // Insert transaction items
      let completed = 0;
      items.forEach(item => {
        db.run(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [transactionId, item.product_id, item.quantity, item.unit_price, item.subtotal],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Update product stock
            db.run(
              `UPDATE products SET stock = stock - ? WHERE id = ?`,
              [item.quantity, item.product_id]
            );
            
            completed++;
            if (completed === items.length) {
              res.status(201).json({ 
                transaction_id: transactionId,
                invoice_number: invoiceNumber,
                total_amount: totalAmount,
                change_amount: changeAmount,
                message: 'Transaksi berhasil disimpan'
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
    `SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT 100`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Get transaction detail
exports.getTransactionDetail = (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM transactions WHERE id = ?`, [id], (err, transaction) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    db.all(
      `SELECT ti.*, p.name, p.sku FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = ?`,
      [id],
      (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ transaction, items });
      }
    );
  });
};

// Delete transaction
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM transaction_items WHERE transaction_id = ?`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Restore stock
    db.all(
      `SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?`,
      [id],
      (err, items) => {
        if (items) {
          items.forEach(item => {
            db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, 
              [item.quantity, item.product_id]);
          });
        }
        
        db.run(`DELETE FROM transaction_items WHERE transaction_id = ?`, [id]);
        db.run(`DELETE FROM transactions WHERE id = ?`, [id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Transaksi berhasil dihapus' });
        });
      }
    );
  });
};
