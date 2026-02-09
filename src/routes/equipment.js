const express = require('express');
const { verifyToken, requireAdmin, requireAdminOrStaff } = require('../middleware/authMiddleware');
const equipmentController = require('../controllers/equipmentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Setup multer untuk upload equipment image
const equipmentUploadDir = 'src/public/uploads/equipment';
if (!fs.existsSync(equipmentUploadDir)) {
  fs.mkdirSync(equipmentUploadDir, { recursive: true });
}

const storageEquipment = multer.diskStorage({
  destination: (req, file, cb) => {
    const equipmentDir = path.join(equipmentUploadDir, req.params.id);
    if (!fs.existsSync(equipmentDir)) {
      fs.mkdirSync(equipmentDir, { recursive: true });
    }
    cb(null, equipmentDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `equipment-${timestamp}${path.extname(file.originalname)}`);
  }
});

const uploadEquipment = multer({
  storage: storageEquipment,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF'));
    }
  }
});

// GET all equipment (Admin, Staff)
router.get('/', verifyToken, equipmentController.getAllEquipment);

// GET equipment by ID (Admin, Staff)
router.get('/:id', verifyToken, equipmentController.getEquipmentById);

// GET equipment availability (Admin, Staff)
router.get('/availability/status', verifyToken, equipmentController.getEquipmentAvailability);

// CREATE equipment (Admin only)
router.post('/', verifyToken, requireAdmin, equipmentController.createEquipment);

// UPLOAD equipment image (Admin only)
router.post('/:id/upload-image', verifyToken, requireAdmin, uploadEquipment.single('image'), equipmentController.uploadEquipmentImage);

// UPDATE equipment quantity (Admin only)
router.patch('/:id/quantity', verifyToken, requireAdmin, equipmentController.updateEquipmentQuantity);

// UPDATE equipment condition (Admin, Staff) - untuk mencatat kondisi saat pengembalian
router.patch('/:id/condition', verifyToken, requireAdminOrStaff, equipmentController.updateEquipmentCondition);

// DELETE equipment (Admin only)
router.delete('/:id', verifyToken, requireAdmin, equipmentController.deleteEquipment);

module.exports = router;
