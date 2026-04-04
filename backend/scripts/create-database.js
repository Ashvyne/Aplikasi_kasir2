/**
 * Create Database for XAMPP
 * 
 * Script ini membuat database kasir_db di XAMPP MySQL
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabase = async () => {
  let connection;
  try {
    // Koneksi ke MySQL tanpa database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✓ Connected to MySQL');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`✓ Database "${process.env.DB_NAME}" created or already exists`);

    await connection.end();
    
    console.log('\n✅ Database setup completed!');
    console.log(`\nDatabase: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    console.log('\n📝 Next step: Run "npm run seed:users" to create tables and seed data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    console.error('\n⚠️ Make sure XAMPP MySQL is running!');
    console.error('   1. Open XAMPP Control Panel');
    console.error('   2. Click "Start" next to MySQL');
    console.error('   3. Run this script again');
    process.exit(1);
  }
};

createDatabase();
