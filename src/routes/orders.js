/**
 * ORDER MANAGEMENT ROUTES
 * Endpoints for managing orders and POS operations
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// All order routes require authentication
router.use(auth);

// Order CRUD
router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/today/list', orderController.getTodayOrders);
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId/status', orderController.updateOrderStatus);
router.delete('/:orderId', orderController.deleteOrder);

// Order items
router.post('/:orderId/items', orderController.addItemToOrder);
router.put('/:orderId/items/:itemId', orderController.updateOrderItem);
router.delete('/:orderId/items/:itemId', orderController.removeItemFromOrder);

// Payment
router.post('/:orderId/payment', orderController.processPayment);

module.exports = router;
