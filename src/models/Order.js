const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Invoice/Order number like ORD-20260320-001'
  },
  tableId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Table ID for dine-in, NULL for takeaway'
  },
  orderType: {
    type: DataTypes.ENUM('dine_in', 'take_away', 'delivery'),
    allowNull: false,
    defaultValue: 'dine_in',
    comment: 'Type of order'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cooking', 'ready', 'served', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: 'Order status flow'
  },
  kitchenStatus: {
    type: DataTypes.ENUM('pending', 'cooking', 'ready', 'delivered'),
    defaultValue: 'pending',
    comment: 'Kitchen display status'
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special instructions for kitchen'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Tax (PPN 10%)'
  },
  serviceCharge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Service charge (5% or custom)'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  changeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'digital', 'split'),
    allowNull: true,
    defaultValue: null
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  servedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who created/processed order'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
