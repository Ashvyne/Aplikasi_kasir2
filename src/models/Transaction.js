const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    defaultValue: 'Tunai'
  },
  userId: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'transactions',
  timestamps: true
});

module.exports = Transaction;
