/**
 * TABLE MANAGEMENT ROUTES
 * Endpoints for managing restaurant tables
 */

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const auth = require('../middleware/auth');

// All table routes require authentication
router.use(auth);

// Table CRUD
router.post('/', tableController.createTable);
router.get('/', tableController.getAllTables);
router.get('/stats/summary', tableController.getTableStats);
router.get('/:id', tableController.getTableById);
router.put('/:id', tableController.updateTable);
router.patch('/:id/status', tableController.updateTableStatus);
router.delete('/:id', tableController.deleteTable);

// Bulk create tables
router.post('/bulk/create', tableController.bulkCreateTables);

module.exports = router;
