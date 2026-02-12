/**
 * STOCK MOVEMENT MODEL
 * Mencatat pergerakan stok alat
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  equipment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID alat'
  },
  movement_type: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false,
    comment: 'Jenis pergerakan: IN (masuk), OUT (keluar)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Jumlah unit yang bergerak'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alasan pergerakan stok'
  },
  previous_total: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total stok sebelum pergerakan'
  },
  new_total: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total stok setelah pergerakan'
  },
  previous_available: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Stok tersedia sebelum pergerakan'
  },
  new_available: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Stok tersedia setelah pergerakan'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID user yang melakukan pergerakan'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stock_movements',
  timestamps: true,
  comment: 'Tabel pergerakan stok alat'
});

module.exports = StockMovement;
