const { Order, OrderItem, Product, RestaurantTable, User } = require('./src/models');
const { Op, Sequelize } = require('sequelize');
const { initDatabase } = require('./src/config/database');

async function test() {
  await initDatabase();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Querying todayOrders...');
    const todayOrders = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [{ model: OrderItem, as: 'items' }]
    });
    console.log('todayOrders fetched:', todayOrders.length);

    console.log('Querying tableStats...');
    const tableStats = await RestaurantTable.findAll({
      attributes: ['status'],
      where: { isActive: true }
    });
    console.log('tableStats fetched:', tableStats.length);

    console.log('Querying lowStockItems...');
    const lowStockItems = await Product.findAll({
      where: {
        stock: { [Op.lte]: 10 }
      },
      limit: 5
    });
    console.log('lowStockItems fetched:', lowStockItems.length);

    console.log('Querying activeOrders...');
    const activeOrders = await Order.findAll({
      where: {
        status: { [Op.in]: ['pending', 'confirmed', 'cooking', 'ready'] }
      },
      include: [{ model: RestaurantTable, as: 'table' }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    console.log('activeOrders fetched:', activeOrders.length);

    console.log('=== ALL SUCCESSFUL ===');
  } catch (error) {
    console.error('❌ ERROR RUNNING QUERIES:', error);
  } finally {
    process.exit(0);
  }
}

test();
