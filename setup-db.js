/**
 * QUICK DATABASE SETUP
 * Creates necessary tables and adds default users
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Disable foreign key checks
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
    }
    
    // Create users table if it doesn't exist
    console.log('📋 Creating users table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'petugas', 'peminjam', 'staff', 'borrower', 'customer') DEFAULT 'peminjam' NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Users table ready');
    
    // Create notifications table
    console.log('📋 Creating notifications table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type VARCHAR(50),
        title VARCHAR(200),
        message TEXT,
        entity_type VARCHAR(50),
        entity_id INT,
        is_read BOOLEAN DEFAULT false,
        read_at DATETIME,
        action_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Notifications table ready');
    
    // Re-enable foreign key checks
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    }
    
    // Insert default users (always insert, don't check if they exist)
    console.log('👥 Adding default users...');
    const pass_admin = await bcrypt.hash('admin123', 10);
    const pass_staff = await bcrypt.hash('staff123', 10);
    const pass_budi = await bcrypt.hash('budi123', 10);
    const pass_siti = await bcrypt.hash('siti123', 10);
    
    try {
      // Insert admin
      await sequelize.query(`
        INSERT INTO users (name, username, email, password, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: ['Administrator', 'admin', 'admin@example.com', pass_admin, 'admin', 1]
      });
      console.log('   ✓ Added admin');
      
      // Insert staff
      await sequelize.query(`
        INSERT INTO users (name, username, email, password, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: ['Staff Peminjaman', 'staff01', 'staff01@example.com', pass_staff, 'staff', 1]
      });
      console.log('   ✓ Added staff01');
      
      // Insert budi
      await sequelize.query(`
        INSERT INTO users (name, username, email, password, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: ['Budi Santoso', 'budi', 'budi@example.com', pass_budi, 'borrower', 1]
      });
      console.log('   ✓ Added budi');
      
      // Insert siti
      await sequelize.query(`
        INSERT INTO users (name, username, email, password, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: ['Siti Rahayu', 'siti', 'siti@example.com', pass_siti, 'borrower', 1]
      });
      console.log('   ✓ Added siti');
      
      console.log('✓ All users added successfully');
    } catch (err) {
      if (err.message.includes('Duplicate entry')) {
        console.log('✓ Users already exist');
      } else {
        throw err;
      }
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Default Credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Staff: staff01 / staff123');
    console.log('   Borrower 1: budi / budi123');
    console.log('   Borrower 2: siti / siti123');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    try {
      if (process.env.DB_DIALECT === 'mysql') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
      }
    } catch (e) {}
    await sequelize.close();
    process.exit(1);
  }
}

setupDatabase();
