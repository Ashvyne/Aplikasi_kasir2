const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { verifyToken, requireAdminBarang } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// GET reports dashboard - Admin Barang only
router.get('/', verifyToken, requireAdminBarang, async (req, res) => {
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
            // Support both 'id' dan 'product_id' field names
            const productId = item.id || item.product_id;
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
    
    // 6. Daily Revenue Data (Last 7 days for chart)
    let dailyData = [];
    try {
      console.log('🔍 Fetching daily revenue for last 7 days');
      
      // Get all transactions without specific attributes to avoid column errors
      const allTransactions = await Transaction.findAll({
        order: [['id', 'ASC']],
        raw: true
      });
      
      console.log('📦 All transactions found:', allTransactions.length);
      if (allTransactions.length > 0) {
        console.log('📋 Sample transaction:', JSON.stringify(allTransactions[0]));
      }
      
      // Create object to track daily revenue
      const dailyRevenue = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Process each transaction - use createdAt or any timestamp field
      allTransactions.forEach(trans => {
        // Try different timestamp fields
        const timestamp = trans.createdAt || trans.created_at || trans.createdAt;
        if (!timestamp) {
          console.warn('⚠️ No timestamp found in transaction', trans.id);
          return;
        }
        
        const transDate = new Date(timestamp);
        transDate.setHours(0, 0, 0, 0);
        
        const dateKey = transDate.toISOString().split('T')[0];
        
        if (!dailyRevenue[dateKey]) {
          dailyRevenue[dateKey] = 0;
        }
        
        dailyRevenue[dateKey] += trans.total || 0;
      });
      
      // Generate last 7 days
      const last7Days = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('id-ID', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        last7Days[dateKey] = {
          date: formattedDate,
          revenue: dailyRevenue[dateKey] || 0
        };
      }
      
      // Convert to array
      dailyData = Object.values(last7Days);
      
      console.log('📈 Daily revenue data formatted:', dailyData);
    } catch (e) {
      console.warn('⚠️ Error fetching daily revenue:', e.message);
      dailyData = [];
    }

    // Return report data
    const reports = {
      success: true,
      todayTransactions: todayTransactions || 0,
      todayRevenue: parseInt(todayRevenue) || 0,
      weekTransactions: weekTransactions || 0,
      lowStockCount: lowStockCount || 0,
      topProducts: topProducts,
      dailyData: dailyData
    };

    console.log('📊 Final report:', {
      todayTransactions: reports.todayTransactions,
      todayRevenue: reports.todayRevenue,
      weekTransactions: reports.weekTransactions,
      lowStockCount: reports.lowStockCount,
      topProducts: reports.topProducts.length,
      dailyDataPoints: reports.dailyData.length
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

// GET empty stock report (stok kosong)
router.get('/empty-stock', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/reports/empty-stock');
    
    // Get products dengan stock = 0
    const emptyStockProducts = await Product.findAll({
      where: {
        stock: 0
      },
      order: [['name', 'ASC']]
    });
    
    console.log('📊 Empty stock products:', emptyStockProducts.length);
    
    res.json({
      success: true,
      count: emptyStockProducts.length,
      products: emptyStockProducts
    });
  } catch (error) {
    console.error('❌ Error getting empty stock report:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading empty stock report',
      products: []
    });
  }
});

// GET profit/loss report (laporan laba/rugi)
router.get('/profit-loss', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/reports/profit-loss');
    
    const allTransactions = await Transaction.findAll({
      attributes: ['items', 'total', 'discount', 'createdAt'],
      raw: true
    });
    
    let profitLossData = [];
    let totalProfit = 0;
    let totalLoss = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    
    allTransactions.forEach(trans => {
      if (!trans.items) return;
      
      let items = trans.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          return;
        }
      }
      
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        try {
          const productId = item.id || item.product_id;
          const quantity = parseInt(item.quantity) || 0;
          const sellPrice = parseInt(item.price) || 0;
          const buyPrice = parseInt(item.buy_price) || 0;
          const itemRevenue = quantity * sellPrice;
          const itemCost = quantity * buyPrice;
          const itemProfit = itemRevenue - itemCost;
          
          // Cari atau buat entry untuk produk ini
          let existingEntry = profitLossData.find(p => p.productId === productId);
          
          if (!existingEntry) {
            existingEntry = {
              productId,
              name: item.name,
              quantity: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0
            };
            profitLossData.push(existingEntry);
          }
          
          existingEntry.quantity += quantity;
          existingEntry.totalRevenue += itemRevenue;
          existingEntry.totalCost += itemCost;
          existingEntry.totalProfit += itemProfit;
          
          totalRevenue += itemRevenue;
          totalCost += itemCost;
          if (itemProfit >= 0) {
            totalProfit += itemProfit;
          } else {
            totalLoss += Math.abs(itemProfit);
          }
        } catch (e) {
          console.warn('⚠️ Error processing profit/loss item:', e.message);
        }
      });
    });
    
    profitLossData.sort((a, b) => b.totalProfit - a.totalProfit);
    
    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalLoss,
        netProfit: totalProfit - totalLoss
      },
      details: profitLossData
    });
  } catch (error) {
    console.error('❌ Error getting profit/loss report:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading profit/loss report',
      summary: {},
      details: []
    });
  }
});

module.exports = router;
