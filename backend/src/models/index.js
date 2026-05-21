/**
 * DATABASE MODELS INDEX
 * Central export point for all models
 */

const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const RestaurantTable = require('./RestaurantTable');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const KitchenOrder = require('./KitchenOrder');
const Transaction = require('./Transaction');
const StockIn = require('./StockIn');

// ============ MODEL RELATIONSHIPS ============

// Category -> Product (1:N)
Product.belongsTo(Category, { foreignKey: 'category', as: 'categoryData', constraints: false });
Category.hasMany(Product, { foreignKey: 'category', as: 'products', constraints: false });

// RestaurantTable -> Order (1:N)
Order.belongsTo(RestaurantTable, { foreignKey: 'tableId', as: 'table' });
RestaurantTable.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });

// Order -> OrderItem (1:N)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product -> OrderItem (1:N)
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User -> Order (1:N)
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId' });

// Order -> KitchenOrder (1:1)
Order.hasOne(KitchenOrder, { foreignKey: 'orderId' });
KitchenOrder.belongsTo(Order, { foreignKey: 'orderId' });

// User -> Transaction (1:N)
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'userId' });

// StockIn does not have a User relationship (uses created_by integer field)

module.exports = {
  User,
  Product,
  Category,
  RestaurantTable,
  Order,
  OrderItem,
  KitchenOrder,
  Transaction,
  StockIn
};
