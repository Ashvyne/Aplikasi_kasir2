/**
 * ACTIVITY LOG CONTROLLER
 * Mengelola pencatatan dan pelaporan aktivitas pengguna
 */

const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// GET all activity logs (Admin only)
exports.getAllActivityLogs = async (req, res) => {
  try {
    console.log('✓ GET /api/activity-logs');
    const { page = 1, limit = 50, action, entity_type, user_id } = req.query;
    
    const where = {};
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.user_id = user_id;

    const offset = (page - 1) * limit;
    
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting activity logs:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET activity logs by user
exports.getLogsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { user_id },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs: rows,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting user logs:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// GET activity logs by entity
exports.getLogsByEntity = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { entity_type, entity_id: parseInt(entity_id) },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs: rows,
      entity: { entity_type, entity_id },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting entity logs:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

// CREATE activity log (called internally)
exports.logActivity = async (userId, action, entityType, entityId, description, ipAddress = null, status = 'SUCCESS') => {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      ip_address: ipAddress,
      status
    });
  } catch (error) {
    console.error('⚠️ Error logging activity:', error);
    // Jangan throw error, hanya log
  }
};

// GET activity summary (Admin only)
exports.getActivitySummary = async (req, res) => {
  try {
    // Total logs today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logsToday = await ActivityLog.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      }
    });

    // Count by action
    const { sequelize } = require('../config/database');
    const actionStats = await ActivityLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('*')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // Count by user role
    const roleStats = await ActivityLog.findAll({
      attributes: [
        [sequelize.col('user.role'), 'role'],
        [sequelize.fn('COUNT', sequelize.col('ActivityLog.id')), 'count']
      ],
      include: [{
        model: User,
        as: 'user',
        attributes: [],
        required: true
      }],
      group: ['user.role'],
      raw: true,
      subQuery: false
    });

    res.json({
      success: true,
      summary: {
        logsToday,
        actionStats,
        roleStats,
        totalLogs: await ActivityLog.count()
      }
    });
  } catch (error) {
    console.error('❌ Error getting activity summary:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};
