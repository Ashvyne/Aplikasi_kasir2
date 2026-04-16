/**
 * TABLE MANAGEMENT ROUTES
 * Endpoints for managing restaurant tables
 */

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authMiddleware');

// All table routes require authentication
router.use(auth);

// Table CRUD
router.post('/', requireAdmin, tableController.createTable);
router.get('/', tableController.getAllTables);
router.get('/stats/summary', tableController.getTableStats);
router.get('/:id', tableController.getTableById);
router.put('/:id', requireAdmin, tableController.updateTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.delete('/:id', requireAdmin, tableController.deleteTable);

// Bulk create tables
router.post('/bulk/create', requireAdmin, tableController.bulkCreateTables);

module.exports = router;
