const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.addProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

router.get('/cat/all', productController.getCategories);
router.post('/cat/add', productController.addCategory);

router.post('/seed/dummy', productController.seedData);
router.post('/import', productController.importProducts);

module.exports = router;
