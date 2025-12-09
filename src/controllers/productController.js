const { db } = require('../config/database');

// Get all products
exports.getAllProducts = (req, res) => {
  db.all(`
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Get product by ID
exports.getProductById = (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json(row);
  });
};

// Add new product
exports.addProduct = (req, res) => {
  const { name, sku, category_id, price, stock, image_url } = req.body;
  
  if (!name || !sku || !category_id || !price) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  db.run(
    `INSERT INTO products (name, sku, category_id, price, stock, image_url) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, sku, category_id, price, stock || 0, image_url],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Produk berhasil ditambahkan' 
      });
    }
  );
};

// Update product
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, stock, image_url } = req.body;

  db.run(
    `UPDATE products SET name = ?, price = ?, stock = ?, image_url = ? WHERE id = ?`,
    [name, price, stock, image_url, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
      res.json({ message: 'Produk berhasil diperbarui' });
    }
  );
};

// Delete product
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk berhasil dihapus' });
  });
};

// Get all categories
exports.getCategories = (req, res) => {
  db.all(`SELECT * FROM categories ORDER BY name`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Add category
exports.addCategory = (req, res) => {
  const { name, description } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Nama kategori diperlukan' });

  db.run(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [name, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Kategori berhasil ditambahkan' });
    }
  );
};

// Seed dummy data
exports.seedData = (req, res) => {
  db.serialize(() => {
    // Clear existing data
    db.run(`DELETE FROM transaction_items`);
    db.run(`DELETE FROM transactions`);
    db.run(`DELETE FROM products`);
    db.run(`DELETE FROM categories`, () => {
      // Insert categories
      const categories = [
        { name: 'Makanan', description: 'Produk makanan' },
        { name: 'Minuman', description: 'Produk minuman' },
        { name: 'Snack', description: 'Produk snack' }
      ];

      categories.forEach(cat => {
        db.run(
          `INSERT INTO categories (name, description) VALUES (?, ?)`,
          [cat.name, cat.description]
        );
      });

      // Insert products
      setTimeout(() => {
        const products = [
          { name: 'Nasi Goreng', sku: 'NG001', category_id: 1, price: 25000, stock: 50 },
          { name: 'Mie Goreng', sku: 'MG001', category_id: 1, price: 20000, stock: 40 },
          { name: 'Teh Manis', sku: 'TM001', category_id: 2, price: 5000, stock: 100 },
          { name: 'Kopi', sku: 'KP001', category_id: 2, price: 8000, stock: 80 },
          { name: 'Keripik', sku: 'KR001', category_id: 3, price: 15000, stock: 60 }
        ];

        products.forEach(prod => {
          db.run(
            `INSERT INTO products (name, sku, category_id, price, stock) 
             VALUES (?, ?, ?, ?, ?)`,
            [prod.name, prod.sku, prod.category_id, prod.price, prod.stock]
          );
        });

        res.json({ message: 'Data dummy berhasil ditambahkan' });
      }, 500);
    });
  });
};

// Import products from array
exports.importProducts = (req, res) => {
  const { products } = req.body;
  
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Data produk tidak valid' });
  }

  let imported = 0;
  let failed = 0;
  const errors = [];

  products.forEach((product, idx) => {
    const { name, sku, category_id, price, stock } = product;

    if (!name || !sku || !category_id || !price) {
      failed++;
      errors.push(`Baris ${idx + 1}: Data tidak lengkap`);
      return;
    }

    db.run(
      `INSERT INTO products (name, sku, category_id, price, stock) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, sku, category_id, price, stock || 0],
      (err) => {
        if (err) {
          failed++;
          errors.push(`Baris ${idx + 1}: ${err.message}`);
        } else {
          imported++;
        }
      }
    );
  });

  setTimeout(() => {
    res.json({
      message: `Import selesai: ${imported} berhasil, ${failed} gagal`,
      imported,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });
  }, 500);
};
