/**
 * ORDER CONTROLLER
 * Manages orders, cart operations, and order lifecycle
 */

const { Order, OrderItem, Product, RestaurantTable, User, KitchenOrder } = require('../models');
const { Op } = require('sequelize');

// Generate unique order number
const generateOrderNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const latestOrder = await Order.findOne({
    where: { orderNumber: { [Op.like]: `ORD-${dateStr}-%` } },
    order: [['createdAt', 'DESC']]
  });

  let sequence = 1;
  if (latestOrder) {
    const lastSeqStr = latestOrder.orderNumber.split('-')[2];
    const lastSeq = parseInt(lastSeqStr);
    sequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  return `ORD-${dateStr}-${String(sequence).padStart(3, '0')}`;
};

// ============ CREATE NEW ORDER ============
exports.createOrder = async (req, res) => {
  try {
    const { tableId, orderType, customerName, customerPhone, notes, userId } = req.body;

    // Validate
    if (!orderType) {
      return res.status(400).json({ success: false, message: 'Order type is required' });
    }

    if (orderType === 'dine_in' && !tableId) {
      return res.status(400).json({ success: false, message: 'Table ID required for dine-in' });
    }

    // Validate table exists and is available
    if (tableId) {
      const table = await RestaurantTable.findByPk(tableId);
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }
    }

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      tableId: tableId || null,
      orderType,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      notes: notes || null,
      status: 'pending',
      kitchenStatus: 'pending',
      userId: userId || 1,
      subtotal: 0,
      taxAmount: 0,
      serviceCharge: 0,
      totalAmount: 0
    });

    // Update table status if dine-in
    if (tableId) {
      await RestaurantTable.update(
        { status: 'occupied', currentOrderId: order.id },
        { where: { id: tableId } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.stack
    });
  }
};

// ============ ADD ITEM TO ORDER ============
exports.addItemToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, notes } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity required' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if item already exists, update quantity if so
    let orderItem = await OrderItem.findOne({
      where: { orderId, productId }
    });

    if (orderItem) {
      orderItem.quantity += quantity;
    } else {
      orderItem = await OrderItem.create({
        orderId,
        productId,
        productName: product.name,
        quantity,
        unitPrice: product.sell_price,
        notes: notes || null,
        totalPrice: product.sell_price * quantity
      });
    }

    orderItem.totalPrice = orderItem.quantity * orderItem.unitPrice;
    await orderItem.save();

    // Deduct stock from product
    product.stock -= quantity;
    await product.save();

    // Recalculate order totals
    await recalculateOrderTotals(orderId);

    const updatedOrder = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    res.status(201).json({
      success: true,
      message: 'Item added to order',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to order',
      error: error.message
    });
  }
};

// ============ UPDATE ORDER ITEM ============
exports.updateOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity, notes } = req.body;

    const orderItem = await OrderItem.findOne({
      where: { id: itemId, orderId }
    });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    if (quantity !== undefined && quantity > 0) {
      const qtyDiff = quantity - orderItem.quantity;
      const product = await Product.findByPk(orderItem.productId);
      if (product) {
        product.stock -= qtyDiff;
        await product.save();
      }
      orderItem.quantity = quantity;
    }
    if (notes !== undefined) {
      orderItem.notes = notes;
    }

    orderItem.totalPrice = orderItem.quantity * orderItem.unitPrice;
    await orderItem.save();

    // Recalculate totals
    await recalculateOrderTotals(orderId);

    res.json({
      success: true,
      message: 'Order item updated',
      data: orderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order item',
      error: error.message
    });
  }
};

// ============ REMOVE ITEM FROM ORDER ============
exports.removeItemFromOrder = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const orderItem = await OrderItem.findOne({
      where: { id: itemId, orderId }
    });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    // Restore stock
    const product = await Product.findByPk(orderItem.productId);
    if (product) {
      product.stock += orderItem.quantity;
      await product.save();
    }

    await orderItem.destroy();

    // Recalculate totals
    await recalculateOrderTotals(orderId);

    res.json({
      success: true,
      message: 'Item removed from order'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing item',
      error: error.message
    });
  }
};

// Helper function to recalculate order totals
const recalculateOrderTotals = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) return;

  const subtotal = order.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
  const taxAmount = subtotal * 0.1; // 10% tax
  const serviceCharge = subtotal * 0.05; // 5% service charge (can be configurable)
  const totalAmount = subtotal + taxAmount + serviceCharge - (order.discountAmount || 0);

  await order.update({
    subtotal,
    taxAmount,
    serviceCharge,
    totalAmount
  });

  return order;
};

// ============ GET ORDER DETAILS ============
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: RestaurantTable, as: 'table' },
        { model: User, as: 'user', attributes: ['id', 'name', 'username'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// ============ UPDATE ORDER STATUS ============
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cooking', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ status });

    // Update related timestamps
    if (status === 'served') {
      await order.update({ servedAt: new Date() });
    } else if (status === 'completed') {
      await order.update({ completedAt: new Date() });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// ============ PROCESS PAYMENT ============
exports.processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paidAmount, paymentMethod } = req.body;

    if (!paidAmount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Paid amount and payment method required' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const changeAmount = paidAmount - order.totalAmount;

    await order.update({
      paidAmount,
      changeAmount: Math.max(0, changeAmount),
      paymentMethod,
      paidAt: new Date(),
      status: 'completed'
    });

    // Update table status to cleaning so staff knows to wipe it down
    if (order.tableId) {
      await RestaurantTable.update(
        { status: 'cleaning', currentOrderId: null },
        { where: { id: order.tableId } }
      );
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// ============ GET ALL ORDERS ============
exports.getAllOrders = async (req, res) => {
  try {
    const { status, orderType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: RestaurantTable, as: 'table' },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// ============ GET TODAY'S ORDERS ============
exports.getTodayOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: { [Op.ne]: 'cancelled' }
      },
      include: [{ model: RestaurantTable, as: 'table' }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today orders',
      error: error.message
    });
  }
};

// ============ DELETE ORDER (Cancel) ============
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ status: 'cancelled' });

    // Restore stock for all items
    const orderItems = await OrderItem.findAll({ where: { orderId } });
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Release table
    if (order.tableId) {
      await RestaurantTable.update(
        { status: 'available', currentOrderId: null },
        { where: { id: order.tableId } }
      );
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};
