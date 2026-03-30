/**
 * SCRIPT UNTUK IMPORT DATA KE MYSQL
 * 
 * File: scripts/import-localstorage-to-db.js
 * 
 * Usage:
 * 1. Taruh backup JSON di folder scripts/data/
 * 2. Run: node scripts/import-localstorage-to-db.js <filename.json>
 * 
 * Contoh: node scripts/import-localstorage-to-db.js kasir_backup_2026-01-22.json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');
const Transaction = require('../src/models/Transaction');
const StockIn = require('../src/models/StockIn');

// Get filename dari argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Usage: node import-localstorage-to-db.js <backup.json>');
  console.error('📂 Backup file harus ada di scripts/data/ folder');
  process.exit(1);
}

const backupPath = path.join(__dirname, 'data', backupFile);

if (!fs.existsSync(backupPath)) {
  console.error(`❌ File not found: ${backupPath}`);
  console.error('💡 Make sure backup JSON is in scripts/data/ folder');
  process.exit(1);
}

// Main import function
async function importDataToMySQL() {
  try {
    console.log('🔄 Initializing database connection...');
    const { initDatabase } = require('../src/config/database');
    const connected = await initDatabase();
    
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('✅ Database connected');
    
    // Read JSON file
    console.log(`\n📖 Reading backup file: ${backupFile}`);
    const jsonData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('📊 Backup info:', {
      timestamp: jsonData.timestamp,
      version: jsonData.version
    });
    
    // Start transaction untuk data integrity
    const transaction = await sequelize.transaction();
    
    try {
      // ============ IMPORT PRODUCTS ============
      console.log('\n📦 Importing products...');
      
      const productsData = jsonData.data.products;
      if (productsData && Array.isArray(productsData)) {
        console.log(`  Found ${productsData.length} products`);
        
        let imported = 0;
        for (const prod of productsData) {
          try {
            // Check if already exists by SKU
            const existing = await Product.findOne({
              where: { sku: prod.sku }
            });
            
            if (!existing) {
              await Product.create({
                name: prod.name,
                sku: prod.sku,
                category: prod.category || 'Lainnya',
                buy_price: prod.buyPrice || prod.buy_price || 0,
                sell_price: prod.sellPrice || prod.sell_price || prod.price || 0,
                stock: prod.stock || 0,
                image_url: prod.imageUrl || prod.image_url || null,
                expiry_date: prod.expiryDate || prod.expiry_date || null
              }, { transaction });
              
              imported++;
              console.log(`    ✅ Imported: ${prod.name} (SKU: ${prod.sku})`);
            } else {
              console.log(`    ⏭️  Skipped: ${prod.name} (already exists)`);
            }
          } catch (err) {
            console.error(`    ❌ Error importing ${prod.name}:`, err.message);
          }
        }
        
        console.log(`\n  ✅ Total products imported: ${imported}/${productsData.length}`);
      } else {
        console.log('  ℹ️  No products data found');
      }
      
      // ============ IMPORT TRANSACTIONS ============
      console.log('\n📋 Importing transactions...');
      
      const transactionsData = jsonData.data.transactions;
      if (transactionsData && Array.isArray(transactionsData)) {
        console.log(`  Found ${transactionsData.length} transactions`);
        
        let imported = 0;
        for (const trans of transactionsData) {
          try {
            // Check if already exists by invoice number
            const existing = await Transaction.findOne({
              where: { invoiceNumber: trans.invoiceNumber || trans.id }
            });
            
            if (!existing) {
              await Transaction.create({
                invoiceNumber: trans.invoiceNumber || `INV-${trans.id || Date.now()}`,
                items: trans.items || [],
                total: trans.total || trans.subtotal || 0,
                discount: trans.discount || 0,
                paymentMethod: trans.paymentMethod || 'Tunai',
                userId: trans.userId || 1,
                notes: trans.notes || null
              }, { transaction });
              
              imported++;
              console.log(`    ✅ Imported: ${trans.invoiceNumber}`);
            } else {
              console.log(`    ⏭️  Skipped: ${trans.invoiceNumber} (already exists)`);
            }
          } catch (err) {
            console.error(`    ❌ Error importing transaction:`, err.message);
          }
        }
        
        console.log(`\n  ✅ Total transactions imported: ${imported}/${transactionsData.length}`);
      } else {
        console.log('  ℹ️  No transactions data found');
      }
      
      // ============ COMMIT TRANSACTION ============
      await transaction.commit();
      
      console.log('\n✅ All data successfully imported to MySQL!');
      console.log('\n📊 Summary:');
      console.log(`  Database: ${process.env.DB_NAME}`);
      console.log(`  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log('  User: ' + process.env.DB_USER);
      
      process.exit(0);
      
    } catch (err) {
      // Rollback jika ada error
      await transaction.rollback();
      throw err;
    }
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check MySQL connection (.env)');
    console.error('  2. Ensure database exists');
    console.error('  3. Verify JSON file format is correct');
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the import
importDataToMySQL();
