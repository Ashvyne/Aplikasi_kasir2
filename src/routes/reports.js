const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// GET reports dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/reports');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get week start date
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());
    
    let todayTransactions = 0;
    let todayRevenue = 0;
    let weekTransactions = 0;
    let lowStockCount = 0;
    let topProducts = [];

    // 1. Today's Transactions Count
    try {
      todayTransactions = await Transaction.count({
        where: {
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });
      console.log('📊 Today transactions:', todayTransactions);
    } catch (e) {
      console.warn('⚠️ Error counting today transactions:', e.message);
    }
    
    // 2. Today's Revenue
    try {
      const todayRevenueResult = await Transaction.sum('total', {
        where: {
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      });
      todayRevenue = todayRevenueResult || 0;
      console.log('💰 Today revenue:', todayRevenue);
    } catch (e) {
      console.warn('⚠️ Error summing today revenue:', e.message);
    }
    
    // 3. Week's Transactions Count
    try {
      weekTransactions = await Transaction.count({
        where: {
          createdAt: {
            [Op.gte]: weekStart,
            [Op.lt]: tomorrow
          }
        }
      });
      console.log('📊 Week transactions:', weekTransactions);
    } catch (e) {
      console.warn('⚠️ Error counting week transactions:', e.message);
    }
    
    // 4. Low Stock Count (< 10)
    try {
      lowStockCount = await Product.count({
        where: {
          stock: {
            [Op.lt]: 10,
            [Op.gt]: 0
          }
        }
      });
      console.log('⚠️ Low stock count:', lowStockCount);
    } catch (e) {
      console.warn('⚠️ Error counting low stock:', e.message);
    }
    
    // 5. Top Products (Most Sold) - Parse JSON items dari transactions
    try {
      console.log('🏆 Fetching top products...');
      
      const allTransactions = await Transaction.findAll({
        attributes: ['items'],
        raw: true
      });
      
      console.log('📦 Total transactions found:', allTransactions.length);
      
      // Object untuk track penjualan per produk
      const productSales = {};
      
      // Loop setiap transaksi
      allTransactions.forEach(trans => {
        if (!trans.items) {
          console.warn('⚠️ Transaction has no items');
          return;
        }

        let items = trans.items;
        
        // Parse JSON jika string
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.warn('⚠️ Failed to parse items from transaction:', e.message);
            return;
          }
        }
        
        // Validasi items adalah array
        if (!Array.isArray(items)) {
          console.warn('⚠️ Items is not an array:', typeof items);
          return;
        }
        
        // Loop setiap item dalam transaksi
        items.forEach(item => {
          try {
            const productId = item.id;
            const quantity = parseInt(item.quantity) || 0;
            const price = parseInt(item.price) || 0;
            const itemTotal = quantity * price;
            
            if (!productId || !item.name) {
              console.warn('⚠️ Invalid item structure:', item);
              return;
            }
            
            if (!productSales[productId]) {
              productSales[productId] = {
                id: productId,
                name: item.name,
                sold: 0,
                revenue: 0,
                transactions: 0
              };
            }
            
            productSales[productId].sold += quantity;
            productSales[productId].revenue += itemTotal;
            productSales[productId].transactions += 1;
          } catch (itemError) {
            console.warn('⚠️ Error processing item:', itemError.message);
          }
        });
      });
      
      console.log('📊 Product sales tracked:', Object.keys(productSales).length);
      
      // Convert object to array dan sort by sold (descending)
      topProducts = Object.values(productSales)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);
      
      console.log('🏆 Top 5 products:', topProducts.map(p => `${p.name}(${p.sold})`).join(', '));
    } catch (e) {
      console.warn('⚠️ Error fetching top products:', e.message);
      topProducts = [];
    }
    
    // Return report data
    const reports = {
      success: true,
      todayTransactions: todayTransactions || 0,
      todayRevenue: parseInt(todayRevenue) || 0,
      weekTransactions: weekTransactions || 0,
      lowStockCount: lowStockCount || 0,
      topProducts: topProducts
    };

    console.log('📊 Final report:', {
      todayTransactions: reports.todayTransactions,
      todayRevenue: reports.todayRevenue,
      weekTransactions: reports.weekTransactions,
      lowStockCount: reports.lowStockCount,
      topProducts: reports.topProducts.length
    });

    res.json(reports);
  } catch (error) {
    console.error('❌ Error getting reports:', error);
    
    // Return default empty report jika error
    res.json({
      success: false,
      message: 'Error loading report data',
      todayTransactions: 0,
      todayRevenue: 0,
      weekTransactions: 0,
      lowStockCount: 0,
      topProducts: []
    });
  }
});

module.exports = router;
