const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: '1'
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;
