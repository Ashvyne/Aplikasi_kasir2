const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Snapshot of product name at time of order'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at time of order'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions per item (e.g., less sugar, no spicy)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'cooking', 'ready', 'served'),
    defaultValue: 'pending'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'quantity * unitPrice'
  }
}, {
  tableName: 'order_items',
  timestamps: true
});

module.exports = OrderItem;
