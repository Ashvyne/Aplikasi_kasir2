const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../kasir.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✓ Connected to SQLite Database');
  }
});

db.run('PRAGMA foreign_keys = ON');

const initDatabase = () => {
  db.serialize(() => {
    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating categories table:', err);
      else console.log('✓ Categories table ready');
    });

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        price INTEGER NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, (err) => {
      if (err) console.error('Error creating products table:', err);
      else console.log('✓ Products table ready');
    });

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        cash_received INTEGER,
        change_amount INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating transactions table:', err);
      else console.log('✓ Transactions table ready');
    });

    // Transaction items table
    db.run(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `, (err) => {
      if (err) console.error('Error creating transaction_items table:', err);
      else console.log('✓ Transaction_items table ready');
    });

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT DEFAULT 'cashier',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err);
      else console.log('✓ Users table ready');
    });

    // Insert default categories
    db.run(
      `INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'Makanan'), (2, 'Minuman'), (3, 'Snack')`,
      (err) => {
        if (err) console.error('Error inserting categories:', err);
        else console.log('✓ Default categories loaded');
      }
    );

    // Insert default admin user
    const bcrypt = require('bcrypt');
    bcrypt.hash('admin123', 10, (err, hashedPassword) => {
      if (!err) {
        db.run(
          `INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
          ['admin', 'admin@kasir.local', hashedPassword, 'admin'],
          (err) => {
            if (err) console.error('Error inserting admin user:', err);
            else console.log('✓ Default admin user loaded');
          }
        );
      }
    });
  });
};

module.exports = { db, initDatabase };
