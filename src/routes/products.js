const express = require('express');
const authenticateToken = require('../middleware/auth');
const Product = require('../models/Product');
const router = express.Router();

// Middleware untuk upload file - akan diset dari app.js
let uploadMiddleware = null;

// Fungsi untuk set upload middleware
router.setUploadMiddleware = (upload) => {
  uploadMiddleware = upload.single('image');
};

// GET all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('✓ GET /api/products');
    const products = await Product.findAll();
    res.json({ 
      success: true,
      products: products,
      count: products.length 
    });
  } catch (error) {
    console.error('❌ Error getting products:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// GET single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('❌ Error getting product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// POST create product with image upload
router.post('/', authenticateToken, (req, res) => {
  // Use upload middleware
  const upload = require('multer');
  const path = require('path');
  const fs = require('fs');
  
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  
  const storage = upload.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      cb(null, `${name}-${timestamp}-${randomStr}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, atau WebP)'));
    }
  };

  const uploadMiddleware = upload({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }).single('image');

  uploadMiddleware(req, res, async (err) => {
    try {
      if (err instanceof upload.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { name, sku, category, price, stock } = req.body;

      // Validasi input
      if (!name || !sku || !price) {
        if (req.file) {
          fs.unlink(req.file.path, (e) => {});
        }
        return res.status(400).json({ message: 'Nama, SKU, dan harga harus diisi' });
      }

      // Cek SKU duplikat
      const existingSku = await Product.findOne({ where: { sku: sku.toLowerCase() } });
      if (existingSku) {
        if (req.file) {
          fs.unlink(req.file.path, (e) => {});
        }
        return res.status(400).json({ message: 'SKU sudah digunakan' });
      }

      // Prepare image URL
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Create new product
      const product = await Product.create({
        name,
        sku,
        category: category || '1',
        price: parseInt(price),
        stock: parseInt(stock) || 0,
        image_url: imageUrl
      });

      console.log('✓ POST /api/products - Created:', product.name);
      res.status(201).json({ 
        success: true,
        message: 'Produk berhasil ditambahkan', 
        product 
      });
    } catch (error) {
      if (req.file) {
        fs.unlink(req.file.path, (e) => {});
      }
      console.error('❌ Error creating product:', error);
      res.status(500).json({ message: 'Terjadi kesalahan' });
    }
  });
});

// PUT update product (untuk edit nama, harga, kategori dan update stok)
router.put('/:id', authenticateToken, (req, res) => {
  const upload = require('multer');
  const path = require('path');
  const fs = require('fs');
  
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  
  const storage = upload.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      cb(null, `${name}-${timestamp}-${randomStr}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, atau WebP)'));
    }
  };

  const uploadMiddleware = upload({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }).single('image');

  uploadMiddleware(req, res, async (err) => {
    try {
      if (err instanceof upload.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }

      const product = await Product.findByPk(req.params.id);
      if (!product) {
        if (req.file) {
          fs.unlink(req.file.path, (e) => {});
        }
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      const { name, sku, category, price, stock } = req.body;
      
      // Jika SKU diubah, cek duplikat
      if (sku && sku !== product.sku) {
        const existingSku = await Product.findOne({ where: { sku } });
        if (existingSku) {
          if (req.file) {
            fs.unlink(req.file.path, (e) => {});
          }
          return res.status(400).json({ message: 'SKU sudah digunakan' });
        }
      }

      // Handle image upload - delete old if exists and new one provided
      if (req.file) {
        if (product.image_url) {
          const oldImagePath = path.join(__dirname, '..', 'public', product.image_url);
          fs.unlink(oldImagePath, (e) => {});
        }
        product.image_url = `/uploads/${req.file.filename}`;
      }

      await product.update({ 
        name, 
        sku, 
        category, 
        price, 
        stock,
        image_url: product.image_url
      });

      console.log('✓ PUT /api/products/:id - Updated:', product.name);
      res.json({ 
        success: true,
        message: 'Produk berhasil diperbarui', 
        product 
      });
    } catch (error) {
      if (req.file) {
        fs.unlink(req.file.path, (e) => {});
      }
      console.log('❌ Error updating product:', error);
      res.status(500).json({ message: 'Terjadi kesalahan' });
    }
  });
});

// PUT reduce stock
router.put('/:id/reduce-stock', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const { quantity } = req.body;
    const quantityToReduce = parseInt(quantity);

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity harus angka positif' });
    }

    if (product.stock < quantityToReduce) {
      return res.status(400).json({ 
        success: false,
        message: `Stok tidak cukup. Tersedia: ${product.stock}, Diminta: ${quantityToReduce}` 
      });
    }

    const oldStock = product.stock;
    await product.update({ stock: product.stock - quantityToReduce });

    console.log(`✓ Stock reduced: ${product.name} (${oldStock} → ${product.stock})`);

    res.json({ 
      success: true,
      message: 'Stok berhasil dikurangi',
      product: {
        id: product.id,
        name: product.name,
        oldStock: oldStock,
        reducedQuantity: quantityToReduce,
        newStock: product.stock,
        sku: product.sku
      }
    });
  } catch (error) {
    console.error('❌ Error reducing stock:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// DELETE product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Delete image file if exists
    if (product.image_url) {
      const imagePath = path.join(__dirname, '..', 'public', product.image_url);
      fs.unlink(imagePath, (e) => {});
    }

    const deletedProduct = product;
    await product.destroy();

    console.log('✓ DELETE /api/products/:id - Deleted:', deletedProduct.name);
    res.json({ 
      success: true,
      message: 'Produk berhasil dihapus', 
      product: deletedProduct
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

module.exports = router;
