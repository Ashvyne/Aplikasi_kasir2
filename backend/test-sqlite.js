const { Sequelize, Op } = require('sequelize');
const path = require('path');

async function test() {
  console.log('Testing SQLite initialization and queries...');

  const dbPath = path.join(__dirname, 'kasir.db');
  console.log('Using SQLite database at:', dbPath);

  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });

  // Import models and bind to this sequelize instance
  const User = require('./src/models/User');
  const Product = require('./src/models/Product');
  const Category = require('./src/models/Category');
  const RestaurantTable = require('./src/models/RestaurantTable');
  const Order = require('./src/models/Order');
  const OrderItem = require('./src/models/OrderItem');
  const KitchenOrder = require('./src/models/KitchenOrder');
  const Transaction = require('./src/models/Transaction');
  const StockIn = require('./src/models/StockIn');

  // Set up associations
  Product.belongsTo(Category, { foreignKey: 'category', as: 'categoryData' });
  Category.hasMany(Product, { foreignKey: 'category', as: 'products' });
  Order.belongsTo(RestaurantTable, { foreignKey: 'tableId', as: 'table' });
  RestaurantTable.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });
  Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
  Product.hasMany(OrderItem, { foreignKey: 'productId' });
  OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Order, { foreignKey: 'userId' });
  Order.hasOne(KitchenOrder, { foreignKey: 'orderId' });
  KitchenOrder.belongsTo(Order, { foreignKey: 'orderId' });
  Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Transaction, { foreignKey: 'userId' });

  try {
    await sequelize.authenticate();
    console.log('SQLite connected successfully.');

    console.log('Syncing database...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // Let's try to query tableStats
    console.log('Querying tableStats...');
    const tableStats = await RestaurantTable.findAll({
      attributes: ['status'],
      where: { isActive: true }
    });
    console.log('tableStats fetched successfully, count:', tableStats.length);

    // Let's try to query lowStockItems
    console.log('Querying lowStockItems...');
    const lowStockItems = await Product.findAll({
      where: {
        stock: { [Op.lte]: 10 }
      },
      limit: 5
    });
    console.log('lowStockItems fetched successfully.');

    // Let's try to run the getHourlyRevenue query in SQLite to see if it fails
    console.log('Querying hourly revenue (which is expected to fail)...');
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
      console.log('hourly fetched successfully (WOW):', hourly);
    } catch (err) {
      console.log('❌ Hourly revenue query failed as expected! Error:', err.message);
    }

  } catch (error) {
    console.error('❌ SQLite execution failed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

test();
