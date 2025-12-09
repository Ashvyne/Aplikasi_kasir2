const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all products
exports.getAllProducts = (req, res) => {
  db.all(
    `SELECT p.*, c.name as category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.name`,
    (err, rows) => {
      if (err) {
        console.error('getAllProducts error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
};

// Get single product
exports.getProductById = (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT p.*, c.name as category_name 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id],
    (err, row) => {
      if (err) {
        console.error('getProductById error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
      res.json(row);
    }
  );
};

// Create product
exports.createProduct = (req, res) => {
  const { name, sku, category_id, price, stock } = req.body;
  
  // Validasi input
  if (!name || !sku || !category_id || !price) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Diperlukan: name, sku, category_id, price' 
    });
  }

  // Validasi tipe data
  if (isNaN(price) || isNaN(stock || 0)) {
    return res.status(400).json({ 
      error: 'Harga dan stok harus berupa angka' 
    });
  }

  const finalStock = stock || 0;
  const finalPrice = Math.round(parseFloat(price));

  db.run(
    `INSERT INTO products (name, sku, category_id, price, stock) 
     VALUES (?, ?, ?, ?, ?)`,
    [name, sku, parseInt(category_id), finalPrice, parseInt(finalStock)],
    function(err) {
      if (err) {
        console.error('createProduct error:', err);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'SKU sudah digunakan' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        message: 'Produk berhasil ditambahkan',
        id: this.lastID
      });
    }
  );
};

// Update product
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, sku, category_id, price, stock } = req.body;
  
  if (!name || !sku || !category_id || !price) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap' 
    });
  }

  const finalPrice = Math.round(parseFloat(price));
  const finalStock = parseInt(stock) || 0;

  db.run(
    `UPDATE products 
     SET name = ?, sku = ?, category_id = ?, price = ?, stock = ?
     WHERE id = ?`,
    [name, sku, parseInt(category_id), finalPrice, finalStock, id],
    (err) => {
      if (err) {
        console.error('updateProduct error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Produk berhasil diperbarui' });
    }
  );
};

// Delete product
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  
  db.run(
    `DELETE FROM products WHERE id = ?`,
    [id],
    (err) => {
      if (err) {
        console.error('deleteProduct error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Produk berhasil dihapus' });
    }
  );
};

// Seed dummy data
exports.seedDummyData = (req, res) => {
  const categories = [
    { id: 1, name: 'Makanan' },
    { id: 2, name: 'Minuman' },
    { id: 3, name: 'Snack' }
  ];

  const products = [
    { name: 'Nasi Goreng', sku: 'NG001', category_id: 1, price: 25000, stock: 50 },
    { name: 'Mie Goreng', sku: 'MG001', category_id: 1, price: 20000, stock: 40 },
    { name: 'Teh Manis', sku: 'TM001', category_id: 2, price: 5000, stock: 100 },
    { name: 'Kopi Hitam', sku: 'KH001', category_id: 2, price: 8000, stock: 80 },
    { name: 'Keripik Singkong', sku: 'KS001', category_id: 3, price: 15000, stock: 60 }
  ];

  let addedCount = 0;

  products.forEach(product => {
    db.run(
      `INSERT OR IGNORE INTO products (name, sku, category_id, price, stock) 
       VALUES (?, ?, ?, ?, ?)`,
      [product.name, product.sku, product.category_id, product.price, product.stock],
      (err) => {
        if (!err) addedCount++;
      }
    );
  });

  setTimeout(() => {
    res.json({ 
      message: `${addedCount} produk berhasil ditambahkan`,
      count: addedCount
    });
  }, 500);
};
