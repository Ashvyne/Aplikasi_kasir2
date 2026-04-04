/**
 * KITCHEN DISPLAY SYSTEM (KDS) ROUTES
 * Endpoints for kitchen operations
 */

const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const auth = require('../middleware/auth');

// All kitchen routes require authentication
router.use(auth);

// Get active kitchen orders
router.get('/active/list', kitchenController.getActiveKitchenOrders);
router.get('/urgent/list', kitchenController.getUrgentOrders);
router.get('/stats/summary', kitchenController.getKitchenStats);

// Update order and item status
router.patch('/:orderId/status', kitchenController.updateKitchenOrderStatus);
router.patch('/:orderId/items/:itemId/status', kitchenController.updateItemKitchenStatus);

// Additional operations
router.patch('/:orderId/start-cooking', kitchenController.markAsStartCooking);
router.patch('/:orderId/complete', kitchenController.completeKitchenOrder);

module.exports = router;
