/**
 * SETUP DATABASE SCRIPT
 * 
 * Membuat database baru dan initialize schema
 * 
 * Usage:
 * node scripts/setup-database.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  
  console.log('🚀 Setting up MySQL Database for Aplikasi Kasir\n');
  console.log('📍 Connection Details:');
  console.log(`  Host: ${dbHost}:${dbPort}`);
  console.log(`  User: ${dbUser}`);
  console.log(`  Database: ${dbName}\n`);
  
  try {
    // Connect ke MySQL (tanpa database dulu)
    console.log('🔌 Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      waitForConnections: true,
      connectionLimit: 1
    });
    
    console.log('✅ Connected to MySQL server\n');
    
    // Drop existing database jika ada (optional)
    console.log(`⚠️  Checking if database "${dbName}" already exists...`);
    const [databases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbName]
    );
    
    if (databases.length > 0) {
      console.log(`  Database "${dbName}" already exists`);
      console.log('  💡 Tip: To reset, manually run: DROP DATABASE ' + dbName + ';');
      console.log('  Then run this script again\n');
    }
    
    // Create database
    console.log(`📁 Creating database "${dbName}"...`);
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database "${dbName}" ready\n`);
    } catch (err) {
      if (err.message.includes('database exists')) {
        console.log(`  Database already exists, continuing...\n`);
      } else {
        throw err;
      }
    }
    
    // Switch to the database
    await connection.query(`USE \`${dbName}\``);
    
    // ============ CREATE TABLES ============
    console.log('📋 Creating database tables...\n');
    
    // Table: users
    console.log('  Creating "users" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin_kasir',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✅ users');
    
    // Table: products
    console.log('  Creating "products" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) DEFAULT 'Lainnya',
        buy_price INT DEFAULT 0,
        sell_price INT DEFAULT 0,
        stock INT DEFAULT 0,
        discount INT DEFAULT 0,
        image_url TEXT,
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_sku (sku),
        KEY idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✅ products');
    
    // Table: transactions
    console.log('  Creating "transactions" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
        items JSON NOT NULL,
        total INT NOT NULL,
        discount INT DEFAULT 0,
        paymentMethod VARCHAR(50) DEFAULT 'Tunai',
        userId INT DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_invoiceNumber (invoiceNumber),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✅ transactions');
    
    // Table: stock_in
    console.log('  Creating "stock_in" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_in (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        notes TEXT,
        created_by INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        KEY idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✅ stock_in');
    
    // Table: sessions (optional, untuk multi-device login)
    console.log('  Creating "sessions" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        device_name VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        token VARCHAR(500) NOT NULL UNIQUE,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_user_id (user_id),
        KEY idx_token (token(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✅ sessions');
    
    console.log('\n✅ All tables created successfully!\n');
    
    // ============ INSERT DEFAULT DATA ============
    console.log('👤 Inserting default users...\n');
    
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash('admin123', 10);
    
    // Insert default users
    await connection.query(`
      INSERT IGNORE INTO users (id, name, email, password, role) VALUES
      (1, 'Admin Barang', 'admin_barang@kasir.local', ?, 'admin_barang'),
      (2, 'Admin Kasir', 'admin_kasir@kasir.local', ?, 'admin_kasir')
    `, [defaultPassword, defaultPassword]);
    
    console.log('  ✅ Default users created');
    console.log('    - Email: admin_barang@kasir.local (Password: admin123)');
    console.log('    - Email: admin_kasir@kasir.local (Password: admin123)\n');
    
    // Insert sample products
    console.log('📦 Inserting sample products...\n');
    
    const sampleProducts = [
      ['Nasi Goreng', 'NG001', '1', 15000, 25000, 50],
      ['Mie Goreng', 'MG001', '1', 12000, 20000, 40],
      ['Es Teh Manis', 'ET001', '2', 2000, 5000, 100],
      ['Kopi Hitam', 'KH001', '2', 3000, 8000, 80],
      ['Lumpia Goreng', 'LG001', '3', 5000, 10000, 60]
    ];
    
    for (const [name, sku, category, buyPrice, sellPrice, stock] of sampleProducts) {
      await connection.query(`
        INSERT IGNORE INTO products (name, sku, category, buy_price, sell_price, stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, sku, category, buyPrice, sellPrice, stock]);
      
      console.log(`  ✅ ${name}`);
    }
    
    console.log('\n✅ Database setup completed!\n');
    
    console.log('📊 Summary:');
    console.log(`  Database: ${dbName}`);
    console.log(`  Tables: users, products, transactions, stock_in, sessions`);
    console.log(`  Default users created with password: admin123`);
    console.log(`  Sample products: 5 products\n`);
    
    console.log('🎯 Next steps:');
    console.log('  1. Run: npm install (if not done)');
    console.log('  2. Run: npm run dev (to start server)');
    console.log('  3. Open: http://localhost:3000 in browser');
    console.log('  4. Login with admin_barang@kasir.local or admin_kasir@kasir.local\n');
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check MySQL is running');
    console.error('  2. Verify .env credentials are correct');
    console.error('  3. Check MySQL user has CREATE DATABASE privilege');
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();
