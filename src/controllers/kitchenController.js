/**
 * KITCHEN CONTROLLER
 * Manages kitchen display system (KDS)
 */

const { Order, OrderItem, KitchenOrder, RestaurantTable } = require('../models');
const { Op } = require('sequelize');

// ============ GET ACTIVE KITCHEN ORDERS ============
exports.getActiveKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        kitchenStatus: { [Op.in]: ['pending', 'cooking'] },
        status: { [Op.notIn]: ['cancelled', 'completed'] }
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          where: { status: { [Op.in]: ['pending', 'cooking'] } },
          required: false
        },
        { model: RestaurantTable, as: 'table' }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching kitchen orders',
      error: error.message
    });
  }
};

// ============ UPDATE ITEM STATUS IN KITCHEN ============
exports.updateItemKitchenStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'cooking', 'ready', 'served'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const orderItem = await OrderItem.findOne({
      where: { id: itemId, orderId }
    });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    await orderItem.update({ status });

    // Check if all items are ready
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    const allReady = order.items.every(item => item.status === 'ready' || item.status === 'served');
    if (allReady && order.items.length > 0) {
      await order.update({ kitchenStatus: 'ready', status: 'ready' });
    }

    res.json({
      success: true,
      message: 'Item status updated',
      data: orderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating item status',
      error: error.message
    });
  }
};

// ============ UPDATE KITCHEN ORDER STATUS ============
exports.updateKitchenOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'cooking', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updates = { kitchenStatus: status };

    if (status === 'cooking') {
      updates.startedAt = new Date();
    } else if (status === 'ready') {
      updates.readyAt = new Date();
      updates.status = 'ready'; // Sync overarching order status
    } else if (status === 'delivered') {
      updates.status = 'served'; // Waiter picked it up
    }

    await order.update(updates);

    res.json({
      success: true,
      message: `Kitchen status updated to ${status}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating kitchen order status',
      error: error.message
    });
  }
};

// ============ MARK ORDER AS COOKING ============
exports.markAsStartCooking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({
      kitchenStatus: 'cooking',
      status: 'cooking'
    });

    res.json({
      success: true,
      message: 'Order moved to cooking',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting order cooking',
      error: error.message
    });
  }
};

// ============ GET KITCHEN STATS ============
exports.getKitchenStats = async (req, res) => {
  try {
    const pending = await Order.count({
      where: { kitchenStatus: 'pending' }
    });

    const cooking = await Order.count({
      where: { kitchenStatus: 'cooking' }
    });

    const ready = await Order.count({
      where: { kitchenStatus: 'ready' }
    });

    res.json({
      success: true,
      data: {
        pending,
        cooking,
        ready,
        totalActive: pending + cooking + ready
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching kitchen stats',
      error: error.message
    });
  }
};

// ============ COMPLETE KITCHEN ORDER ============
exports.completeKitchenOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Mark all items as ready explicitly 
    await OrderItem.update(
      { status: 'ready' },
      { where: { orderId } }
    );

    await order.update({
      kitchenStatus: 'ready',
      status: 'ready',
      readyAt: new Date()
    });

    res.json({
      success: true,
      message: 'Order completed in kitchen',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing kitchen order',
      error: error.message
    });
  }
};

// ============ GET URGENT ORDERS ============
exports.getUrgentOrders = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const urgentOrders = await Order.findAll({
      where: {
        kitchenStatus: { [Op.in]: ['pending', 'cooking'] },
        createdAt: { [Op.lte]: fiveMinutesAgo }
      },
      include: [
        { model: OrderItem, as: 'items' },
        { model: RestaurantTable, as: 'table' }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: urgentOrders,
      message: `${urgentOrders.length} orders waiting for more than 5 minutes`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching urgent orders',
      error: error.message
    });
  }
};
