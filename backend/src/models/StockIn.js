const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');

const StockIn = sequelize.define('StockIn', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Jumlah barang masuk'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Catatan barang masuk'
  },
  created_by: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'stock_in',
  timestamps: true
});

// Association
StockIn.belongsTo(Product, {
  foreignKey: 'product_id',
  targetKey: 'id',
  as: 'product'
});

module.exports = StockIn;
