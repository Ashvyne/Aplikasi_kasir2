const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RestaurantTable = sequelize.define('RestaurantTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  tableName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Display name like Meja 1, Meja 2'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    comment: 'Max number of people at this table'
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'reserved', 'cleaning'),
    defaultValue: 'available',
    comment: 'available, occupied, reserved, cleaning'
  },
  currentOrderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reference to current order if occupied'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Location/zone like Indoor, Outdoor, Upstairs'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'restaurant_tables',
  timestamps: true,
  underscored: false
});

module.exports = RestaurantTable;
