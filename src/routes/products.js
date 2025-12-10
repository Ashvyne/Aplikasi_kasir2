const express = require('express');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// In-memory database (ganti dengan database sesungguhnya)
let products = [
  { id: 1, name: 'Nasi Goreng', sku: 'NG001', category: '1', price: 25000, stock: 15, createdAt: new Date() },
  { id: 2, name: 'Mie Ayam', sku: 'MA001', category: '1', price: 20000, stock: 10, createdAt: new Date() },
  { id: 3, name: 'Es Teh Manis', sku: 'ETM001', category: '2', price: 5000, stock: 50, createdAt: new Date() }
];

let nextId = 4;

// GET all products
router.get('/', authenticateToken, (req, res) => {
  try {
    console.log('✓ GET /api/products');
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
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const product = products.find(p => p.id === parseInt(req.params.id));
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
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, sku, category, price, stock } = req.body;

    // Validasi input
    if (!name || !sku || !price) {
      return res.status(400).json({ message: 'Nama, SKU, dan harga harus diisi' });
    }

    // Cek SKU duplikat
    if (products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
      return res.status(400).json({ message: 'SKU sudah digunakan' });
    }

    // Create new product
    const newProduct = {
      id: nextId++,
      name,
      sku,
      category: category || '1',
      price: parseInt(price),
      stock: parseInt(stock) || 0,
      createdAt: new Date()
    };

    products.push(newProduct);
    console.log('✓ POST /api/products - Created:', newProduct.name);
    res.status(201).json({ 
      success: true,
      message: 'Produk berhasil ditambahkan', 
      id: newProduct.id,
      product: newProduct 
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// PUT update product (untuk edit nama, harga, kategori dan update stok)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const { name, sku, category, price, stock } = req.body;
    
    // Jika SKU diubah, cek duplikat
    if (sku && sku !== product.sku && products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
      return res.status(400).json({ message: 'SKU sudah digunakan' });
    }

    // Update data produk
    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (category) product.category = category;
    if (price) product.price = parseInt(price);
    if (stock !== undefined) product.stock = parseInt(stock); // Update stok

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

// ⭐ ROUTE REDUCE-STOCK HARUS SEBELUM DELETE/:ID
// Route untuk mengurangi stok saat checkout
router.put('/:id/reduce-stock', authenticateToken, (req, res) => {
  try {
    console.log('🔍 PUT /:id/reduce-stock endpoint hit');
    console.log('   Product ID:', req.params.id);
    console.log('   Body:', req.body);
    
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      console.warn(`⚠️ Product not found - ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Produk tidak ditemukan' 
      });
    }

    const { quantity } = req.body;
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      console.warn(`⚠️ Invalid quantity: ${quantity}`);
      return res.status(400).json({ 
        success: false,
        message: 'Quantity harus angka positif' 
      });
    }

    const quantityToReduce = parseInt(quantity);

    if (product.stock < quantityToReduce) {
      console.warn(`⚠️ Insufficient stock - Product: ${product.name}, Need: ${quantityToReduce}, Available: ${product.stock}`);
      return res.status(400).json({ 
        success: false,
        message: `Stok tidak cukup. Tersedia: ${product.stock}, Diminta: ${quantityToReduce}` 
      });
    }

    const oldStock = product.stock;
    product.stock -= quantityToReduce;

    console.log(`✓ Stock reduced for "${product.name}"`);
    console.log(`  Old Stock: ${oldStock} → New Stock: ${product.stock}`);
    console.log(`  Reduced by: ${quantityToReduce} units`);

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
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan saat mengurangi stok',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE product (HARUS SETELAH reduce-stock)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    const deleted = products.splice(index, 1);
    console.log('✓ DELETE /api/products/:id - Deleted:', deleted[0].name);
    res.json({ 
      success: true,
      message: 'Produk berhasil dihapus', 
      product: deleted[0] 
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: 'Terjadi kesalahan' });
  }
});

// Export products untuk digunakan oleh routes lain
module.exports = router;
module.exports.getProducts = () => products;
module.exports.setProducts = (newProducts) => {
  products = newProducts;
};
