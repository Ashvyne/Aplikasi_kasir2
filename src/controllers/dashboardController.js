const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const StockIn = require('../models/StockIn');

/**
 * Get Dashboard Summary Data
 * - Total transactions today
 * - Profit/Revenue today
 * - Total products
 * - Total stock
 * - Low stock items
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total transactions today
    const transactionCount = await Transaction.count({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: today,
          [sequelize.Sequelize.Op.lt]: tomorrow
        }
      }
    });

    // 2. Revenue and Profit today
    const todayTransactions = await Transaction.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: today,
          [sequelize.Sequelize.Op.lt]: tomorrow
        }
      },
      raw: true
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const trans of todayTransactions) {
      totalRevenue += trans.total || 0;
      
      if (trans.items) {
        const items = typeof trans.items === 'string' ? JSON.parse(trans.items) : trans.items;
        for (const item of items) {
          const product = await Product.findByPk(item.product_id, { raw: true });
          if (product) {
            totalCost += (product.buy_price || 0) * (item.quantity || 0);
          }
        }
      }
    }

    const totalProfit = totalRevenue - totalCost;

    // 3. Total products and stock
    const products = await Product.findAll({ raw: true });
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    // 4. Low stock items (stock < 10)
    const lowStockItems = products.filter(p => p.stock < 10 && p.stock > 0).length;
    
    // 4b. Empty stock items (stock = 0)
    const emptyStockItems = products.filter(p => p.stock === 0).length;

    // 5. Expired or expiring soon products
    const today_date = new Date();
    const expiredItems = products.filter(p => {
      if (!p.expiry_date) return false;
      const expiryDate = new Date(p.expiry_date);
      return expiryDate < today_date;
    }).length;

    // 6. Expiring within 7 days
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const expiringItems = products.filter(p => {
      if (!p.expiry_date) return false;
      const expiryDate = new Date(p.expiry_date);
      return expiryDate >= today_date && expiryDate <= sevenDaysLater;
    }).length;

    res.json({
      transactions_today: transactionCount,
      revenue_today: totalRevenue,
      profit_today: totalProfit,
      total_products: totalProducts,
      total_stock: totalStock,
      empty_stock_items: emptyStockItems,
      low_stock_items: lowStockItems,
      expired_items: expiredItems,
      expiring_soon_items: expiringItems
    });

  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Monthly Sales Report
 * Returns sales data grouped by month
 */
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const transactions = await sequelize.query(`
      SELECT 
        MONTH(createdAt) as month,
        COUNT(*) as total_transactions,
        SUM(total) as total_revenue,
        AVG(total) as avg_transaction
      FROM transactions
      WHERE YEAR(createdAt) = ${targetYear}
      GROUP BY MONTH(createdAt)
      ORDER BY MONTH(createdAt)
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      year: targetYear,
      months: transactions
    });

  } catch (error) {
    console.error('getMonthlySalesReport error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Profit/Loss Report
 */
exports.getProfitLossReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = '';
    if (start_date && end_date) {
      whereClause = `WHERE createdAt BETWEEN '${start_date}' AND '${end_date}'`;
    }

    const report = await sequelize.query(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as transactions,
        SUM(total) as revenue
      FROM transactions
      ${whereClause}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Calculate profit
    const reportWithProfit = [];
    for (const row of report) {
      let cost = 0;
      const dayTransactions = await Transaction.findAll({
        where: {
          createdAt: sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), sequelize.Op.eq, row.date)
        },
        raw: true
      });

      for (const trans of dayTransactions) {
        if (trans.items) {
          const items = typeof trans.items === 'string' ? JSON.parse(trans.items) : trans.items;
          for (const item of items) {
            const product = await Product.findByPk(item.product_id, { raw: true });
            if (product) {
              cost += (product.buy_price || 0) * (item.quantity || 0);
            }
          }
        }
      }

      reportWithProfit.push({
        date: row.date,
        transactions: row.transactions,
        revenue: row.revenue,
        cost: cost,
        profit: row.revenue - cost
      });
    }

    res.json(reportWithProfit);

  } catch (error) {
    console.error('getProfitLossReport error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Product Stock Report
 */
exports.getStockReport = async (req, res) => {
  try {
    const products = await Product.findAll({
      raw: true,
      order: [['stock', 'ASC']]
    });

    const report = products.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      buy_price: p.buy_price,
      sell_price: p.sell_price,
      discount: p.discount,
      expiry_date: p.expiry_date,
      stock_value: (p.buy_price || 0) * (p.stock || 0),
      status: p.stock === 0 ? 'Habis' : p.stock < 10 ? 'Kurang' : 'Normal'
    }));

    res.json(report);

  } catch (error) {
    console.error('getStockReport error:', error);
    res.status(500).json({ error: error.message });
  }
};
