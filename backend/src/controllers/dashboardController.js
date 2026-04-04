/**
 * ENHANCED DASHBOARD CONTROLLER
 * Analytics, reports, and dashboard metrics for restaurant/cafe POS
 */

const { Order, OrderItem, Product, RestaurantTable, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

// ============ GET DASHBOARD SUMMARY ============
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's metrics
    const todayOrders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [{ model: OrderItem, as: 'items' }]
    });

    const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const totalItemsSold = todayOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Table stats
    const tableStats = await RestaurantTable.findAll({
      attributes: ['status'],
      where: { isActive: true }
    });

    const activeTables = tableStats.filter(t => t.status === 'occupied').length;
    const availableTables = tableStats.filter(t => t.status === 'available').length;
    const totalTables = tableStats.length;

    // Low stock items
    const lowStockItems = await Product.findAll({
      where: {
        stock: { [Op.lte]: 10 }
      },
      limit: 5
    });

    // Active orders
    const activeOrders = await Order.findAll({
      where: {
        status: { [Op.in]: ['pending', 'confirmed', 'cooking', 'ready'] }
      },
      include: [{ model: RestaurantTable, as: 'table' }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        today: {
          orders: todayOrders.length,
          revenue: todayRevenue,
          itemsSold: totalItemsSold,
          averageOrderValue: todayOrders.length > 0 ? (todayRevenue / todayOrders.length).toFixed(2) : 0
        },
        tables: {
          total: totalTables,
          active: activeTables,
          available: availableTables,
          occupancyRate: totalTables > 0 ? ((activeTables / totalTables) * 100).toFixed(1) + '%' : '0%'
        },
        lowStockItems: lowStockItems,
        activeOrders: activeOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};


// ============ GET REVENUE ANALYTICS ============
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '7days' } = req.query; // 7days, 30days, 90days, yearly

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    startDate.setHours(0, 0, 0, 0);

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      raw: true
    });

    res.json({
      success: true,
      period,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error.message
    });
  }
};

// ============ GET TOP SELLING ITEMS ============
exports.getTopSellingItems = async (req, res) => {
  try {
    const { period = '7days', limit = 10 } = req.query;

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    startDate.setHours(0, 0, 0, 0);

    const topItems = await OrderItem.findAll({
      attributes: [
        'productName',
        'productId',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'totalRevenue']
      ],
      include: [
        {
          model: Order,
          where: {
            createdAt: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          },
          required: true,
          attributes: []
        }
      ],
      group: ['productId', 'productName'],
      order: [[Sequelize.literal('totalQuantity'), 'DESC']],
      limit: parseInt(limit) || 10,
      subQuery: false,
      raw: true
    });

    res.json({
      success: true,
      period,
      data: topItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top selling items',
      error: error.message
    });
  }
};

// ============ GET PAYMENT METHOD DISTRIBUTION ============
exports.getPaymentMethodDistribution = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    startDate.setHours(0, 0, 0, 0);

    const distribution = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.ne]: 'cancelled' },
        paymentMethod: { [Op.ne]: null }
      },
      attributes: [
        'paymentMethod',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      success: true,
      period,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment distribution',
      error: error.message
    });
  }
};

// ============ GET ORDER TYPE DISTRIBUTION ============
exports.getOrderTypeDistribution = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    startDate.setHours(0, 0, 0, 0);

    const distribution = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        'orderType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total']
      ],
      group: ['orderType'],
      raw: true
    });

    res.json({
      success: true,
      period,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order type distribution',
      error: error.message
    });
  }
};

// ============ GET HOURLY REVENUE ============
exports.getHourlyRevenue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const hourly = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('created_at')), 'hour'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orders']
      ],
      group: [Sequelize.fn('HOUR', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('HOUR', Sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: hourly
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hourly revenue',
      error: error.message
    });
  }
};

// ============ GET RECENT ORDERS ============
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const orders = await Order.findAll({
      include: [
        { model: RestaurantTable, as: 'table' },
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: OrderItem,
          as: 'items',
          limit: 3,
          attributes: ['productName', 'quantity']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
};

// ============ GET DETAILED REPORT ============
exports.getDetailedReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end date required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: start, [Op.lt]: end },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [
        { model: RestaurantTable, as: 'table' },
        { model: User, as: 'user', attributes: ['id', 'name', 'username'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.taxAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + parseFloat(order.discountAmount || 0), 0);

    res.json({
      success: true,
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        totalTax,
        totalDiscount,
        averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0
      },
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

// ============ GET CUSTOMER STATS ============
exports.getCustomerStats = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    }

    startDate.setHours(0, 0, 0, 0);

    const totalCustomers = await Order.count({
      distinct: true,
      col: 'customerName',
      where: {
        createdAt: { [Op.gte]: startDate },
        customerName: { [Op.ne]: null }
      }
    });

    const repeatCustomers = await Order.findAll({
      attributes: [
        'customerName',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'visitCount']
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        customerName: { [Op.ne]: null }
      },
      group: ['customerName'],
      having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col('id')), Op.gt, 1),
      raw: true,
      subQuery: false
    });

    res.json({
      success: true,
      period,
      data: {
        totalCustomers,
        repeatCustomers: repeatCustomers.length,
        repeatCustomerData: repeatCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer stats',
      error: error.message
    });
  }
};

// ============ GET MONTHLY SALES REPORT (Legacy) ============
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const months = [];
    for (let i = 1; i <= 12; i++) {
      const startDate = new Date(targetYear, i - 1, 1);
      const endDate = new Date(targetYear, i, 1);

      const monthOrders = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
          status: { [Op.ne]: 'cancelled' }
        },
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_transactions'],
          [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'total_revenue'],
          [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'avg_transaction']
        ],
        raw: true
      });

      if (monthOrders.length > 0) {
        months.push({
          month: i,
          total_transactions: monthOrders[0].total_transactions || 0,
          total_revenue: monthOrders[0].total_revenue || 0,
          avg_transaction: monthOrders[0].avg_transaction || 0
        });
      }
    }

    res.json({
      year: targetYear,
      months
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly sales report',
      error: error.message
    });
  }
};

// ============ GET PROFIT/LOSS REPORT (Legacy) ============
exports.getProfitLossReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let where = {};
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
    }

    const orders = await Order.findAll({
      where: { ...where, status: { [Op.ne]: 'cancelled' } },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });

    const reportByDate = {};

    for (const order of orders) {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      
      if (!reportByDate[dateStr]) {
        reportByDate[dateStr] = {
          date: dateStr,
          transactions: 0,
          revenue: 0,
          cost: 0
        };
      }

      reportByDate[dateStr].transactions++;
      reportByDate[dateStr].revenue += parseFloat(order.totalAmount || 0);

      // Calculate cost from items
      for (const item of order.items || []) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          reportByDate[dateStr].cost += (product.buy_price || 0) * item.quantity;
        }
      }
    }

    const report = Object.values(reportByDate).map(row => ({
      ...row,
      profit: row.revenue - row.cost
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profit/loss report',
      error: error.message
    });
  }
};

// ============ GET STOCK REPORT (Legacy) ============
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
    res.status(500).json({
      success: false,
      message: 'Error fetching stock report',
      error: error.message
    });
  }
};

