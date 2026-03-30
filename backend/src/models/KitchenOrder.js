const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KitchenOrder = sequelize.define('KitchenOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Reference to main order number'
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Meja number for display'
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of items to cook with notes'
  },
  status: {
    type: DataTypes.ENUM('pending', 'cooking', 'ready', 'completed'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  totalItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readyAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated cooking time in seconds'
  }
}, {
  tableName: 'kitchen_orders',
  timestamps: true
});

module.exports = KitchenOrder;
