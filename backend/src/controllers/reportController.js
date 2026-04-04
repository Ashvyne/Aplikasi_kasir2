const { db } = require('../config/database');

// Daily sales report
exports.getDailySalesReport = (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.get(
    `SELECT 
      COUNT(*) as total_transactions,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_transaction
    FROM transactions 
    WHERE DATE(transaction_date) = ?`,
    [today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || { total_transactions: 0, total_revenue: 0, average_transaction: 0 });
    }
  );
};

// Top selling products (sorted by revenue)
exports.getTopProducts = (req, res) => {
  db.all(
    `SELECT p.id, p.name, p.sku, p.price, SUM(ti.quantity) as total_sold, SUM(ti.subtotal) as revenue
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    GROUP BY p.id
    ORDER BY revenue DESC
    LIMIT 10`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Stock report
exports.getStockReport = (req, res) => {
  db.all(
    `SELECT p.id, p.name, p.sku, c.name as category, p.price, p.stock,
      (p.price * p.stock) as stock_value
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.stock < 20
    ORDER BY p.stock ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Revenue by date
exports.getRevenueByDate = (req, res) => {
  db.all(
    `SELECT DATE(transaction_date) as date, COUNT(*) as transactions, SUM(total_amount) as revenue
    FROM transactions
    GROUP BY DATE(transaction_date)
    ORDER BY date DESC
    LIMIT 30`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Dashboard analytics
exports.getDashboardAnalytics = (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT 
      (SELECT COUNT(*) FROM transactions WHERE DATE(transaction_date) = ?) as today_transactions,
      (SELECT SUM(total_amount) FROM transactions WHERE DATE(transaction_date) = ?) as today_revenue,
      (SELECT COUNT(*) FROM transactions WHERE DATE(transaction_date) >= DATE('now', '-7 days')) as week_transactions,
      (SELECT SUM(total_amount) FROM transactions WHERE DATE(transaction_date) >= DATE('now', '-7 days')) as week_revenue,
      (SELECT COUNT(*) FROM products WHERE stock < 20) as low_stock_count,
      (SELECT COUNT(*) FROM products) as total_products
    `,
    [today, today],
    (err, row) => {
      if (err) {
        console.error('getDashboardAnalytics error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(row[0] || {});
    }
  );
};

// Sales by payment method
exports.getSalesByPaymentMethod = (req, res) => {
  db.all(
    `SELECT payment_method, COUNT(*) as count, SUM(total_amount) as revenue
    FROM transactions
    WHERE DATE(transaction_date) = DATE('now')
    GROUP BY payment_method`,
    (err, rows) => {
      if (err) {
        console.error('getSalesByPaymentMethod error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Monthly revenue
exports.getMonthlyRevenue = (req, res) => {
  db.all(
    `SELECT 
      strftime('%Y-%m', transaction_date) as month,
      COUNT(*) as transactions,
      SUM(total_amount) as revenue
    FROM transactions
    GROUP BY strftime('%Y-%m', transaction_date)
    ORDER BY month DESC
    LIMIT 12`,
    (err, rows) => {
      if (err) {
        console.error('getMonthlyRevenue error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};
