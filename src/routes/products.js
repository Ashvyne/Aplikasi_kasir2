const express = require('express');
const authenticateToken = require('../middleware/auth');
const Product = require('../models/Product');
const router = express.Router();

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

// POST create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, sku, category, price, stock } = req.body;

    // Validasi input
    if (!name || !sku || !price) {
      return res.status(400).json({ message: 'Nama, SKU, dan harga harus diisi' });
    }

    // Cek SKU duplikat
    const existingSku = await Product.findOne({ where: { sku: sku.toLowerCase() } });
    if (existingSku) {
      return res.status(400).json({ message: 'SKU sudah digunakan' });
    }

    // Create new product
    const product = await Product.create({
      name,
      sku,
      category: category || '1',
      price: parseInt(price),
      stock: parseInt(stock) || 0
    });

    console.log('✓ POST /api/products - Created:', product.name);
    res.status(201).json({ 
      success: true,
      message: 'Produk berhasil ditambahkan', 
      product 
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// PUT update product (untuk edit nama, harga, kategori dan update stok)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const { name, sku, category, price, stock } = req.body;
    
    // Jika SKU diubah, cek duplikat
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({ where: { sku } });
      if (existingSku) {
        return res.status(400).json({ message: 'SKU sudah digunakan' });
      }
    }

    await product.update({ name, sku, category, price, stock });

    console.log('✓ PUT /api/products/:id - Updated:', product.name);
    res.json({ 
      success: true,
      message: 'Produk berhasil diperbarui', 
      product 
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
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
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
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
