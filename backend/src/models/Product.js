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
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  buy_price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Harga beli produk'
  },
  sell_price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Harga jual produk'
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Diskon dalam persen'
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal kadaluarsa produk'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;
