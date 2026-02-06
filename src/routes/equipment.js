const express = require('express');
const { verifyToken, requireAdmin, requireAdminOrStaff } = require('../middleware/authMiddleware');
const equipmentController = require('../controllers/equipmentController');
const router = express.Router();

// GET all equipment (Admin, Staff)
router.get('/', verifyToken, equipmentController.getAllEquipment);

// GET equipment by ID (Admin, Staff)
router.get('/:id', verifyToken, equipmentController.getEquipmentById);

// GET equipment availability (Admin, Staff)
router.get('/availability/status', verifyToken, equipmentController.getEquipmentAvailability);

// CREATE equipment (Admin only)
router.post('/', verifyToken, requireAdmin, equipmentController.createEquipment);

// UPDATE equipment (Admin only)
router.put('/:id', verifyToken, requireAdmin, equipmentController.updateEquipment);

// UPDATE equipment quantity (Admin only)
router.patch('/:id/quantity', verifyToken, requireAdmin, equipmentController.updateEquipmentQuantity);

// UPDATE equipment condition (Admin, Staff) - untuk mencatat kondisi saat pengembalian
router.patch('/:id/condition', verifyToken, requireAdminOrStaff, equipmentController.updateEquipmentCondition);

// DELETE equipment (Admin only)
router.delete('/:id', verifyToken, requireAdmin, equipmentController.deleteEquipment);

module.exports = router;
