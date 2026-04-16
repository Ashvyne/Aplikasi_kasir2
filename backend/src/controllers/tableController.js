/**
 * TABLE CONTROLLER
 * Manages restaurant tables (Meja 1, Meja 2, etc.)
 */

const { RestaurantTable, Order } = require('../models');
const { Op } = require('sequelize');

// ============ CREATE TABLE ============
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, tableName, capacity, location, surchargeAmount } = req.body;

    if (!tableNumber || !tableName) {
      return res.status(400).json({ success: false, message: 'Table number and name required' });
    }

    const table = await RestaurantTable.create({
      tableNumber,
      tableName: tableName || `Table ${tableNumber}`,
      capacity: capacity || 4,
      location: location || null,
      surchargeAmount: parseFloat(surchargeAmount) || 0,
      status: 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Nomor meja sudah digunakan. Silakan gunakan nomor lain.' });
    }
    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating table',
      error: error.message
    });
  }
};

// ============ GET ALL TABLES ============
exports.getAllTables = async (req, res) => {
  try {
    const tables = await RestaurantTable.findAll({
      where: { isActive: true },
      include: [
        {
          model: Order,
          as: 'orders',
          where: { status: { [Op.notIn]: ['completed', 'cancelled'] } },
          required: false,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['tableNumber', 'ASC']]
    });

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
};

// ============ GET TABLE STATS ============
exports.getTableStats = async (req, res) => {
  try {
    const stats = await RestaurantTable.findAll({
      attributes: ['status'],
      where: { isActive: true },
      raw: true
    });

    const availableTables = stats.filter(t => t.status === 'available').length;
    const occupiedTables = stats.filter(t => t.status === 'occupied').length;
    const reservedTables = stats.filter(t => t.status === 'reserved').length;
    const totalTables = stats.length;

    res.json({
      success: true,
      data: {
        totalTables,
        availableTables,
        occupiedTables,
        reservedTables,
        occupancyRate: ((occupiedTables + reservedTables) / totalTables * 100).toFixed(1) + '%'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table stats',
      error: error.message
    });
  }
};

// ============ GET TABLE BY ID ============
exports.getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await RestaurantTable.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'orders',
          where: { status: { [Op.notIn]: ['completed', 'cancelled'] } },
          required: false
        }
      ]
    });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table',
      error: error.message
    });
  }
};

// ============ UPDATE TABLE ============
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableName, capacity, location, status, isActive, surchargeAmount } = req.body;

    const table = await RestaurantTable.findByPk(id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    await table.update({
      tableName: tableName || table.tableName,
      capacity: capacity || table.capacity,
      location: location !== undefined ? location : table.location,
      status: status || table.status,
      isActive: isActive !== undefined ? isActive : table.isActive,
      surchargeAmount: surchargeAmount !== undefined ? parseFloat(surchargeAmount) : table.surchargeAmount
    });

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating table',
      error: error.message
    });
  }
};

// ============ UPDATE TABLE STATUS ============
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'occupied', 'reserved', 'cleaning'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const table = await RestaurantTable.findByPk(id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    await table.update({ status });

    res.json({
      success: true,
      message: `Table status updated to ${status}`,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating table status',
      error: error.message
    });
  }
};

// ============ DELETE TABLE ============
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await RestaurantTable.findByPk(id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    await table.update({ isActive: false });

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting table',
      error: error.message
    });
  }
};

// ============ BULK CREATE TABLES ============
exports.bulkCreateTables = async (req, res) => {
  try {
    const { count, capacityPerTable, location } = req.body;

    if (!count || count < 1) {
      return res.status(400).json({ success: false, message: 'Invalid count' });
    }

    const tables = [];
    for (let i = 1; i <= count; i++) {
      tables.push({
        tableNumber: i,
        tableName: `Meja ${i}`,
        capacity: capacityPerTable || 4,
        location: location || null,
        status: 'available'
      });
    }

    await RestaurantTable.bulkCreate(tables);

    res.status(201).json({
      success: true,
      message: `${count} tables created successfully`,
      data: tables
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Beberapa nomor meja dalam urutan tersebut sudah terpakai. Coba buat secara manual.' });
    }
    console.error('Error in bulk create tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tables',
      error: error.message
    });
  }
};
