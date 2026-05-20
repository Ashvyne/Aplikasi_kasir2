/**
 * PRODUCTION DATABASE SYNC & SCHEMA REPAIR SCRIPT
 * 
 * Safely synchronizes all database models/tables without dropping existing data.
 * - Disables foreign key checks to avoid alter table deadlock or constraint failure
 * - Automatically registers and associates all models
 * - Runs sync({ alter: true })
 * - Seeds default tables, categories, and users if they are empty
 */

const { sequelize, initDatabase } = require('../src/config/database');
// Import models in correct order & run association setup
const { 
  User, 
  Category, 
  Product, 
  RestaurantTable, 
  Order, 
  OrderItem, 
  KitchenOrder, 
  Transaction, 
  StockIn 
} = require('../src/models');

async function runSync() {
  console.log('🚀 Starting Safe Production Database Sync & Repair...');
  
  try {
    // 1. Initialize and authenticate connection
    const connected = await initDatabase();
    if (!connected) {
      throw new Error('Could not connect to the database. Please check your database connection.');
    }
    
    console.log(`📡 Connected to database dialec: ${sequelize.getDialect()}`);
    
    // 2. Disable Foreign Key Checks (Crucial for safely altering/creating related tables)
    console.log('🔐 Disabling foreign key checks temporarily...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // 3. Sync Database Tables
    console.log('🔄 Syncing all tables with sequelize.sync({ alter: true })...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synced and altered successfully!');
    
    // 4. Re-enable Foreign Key Checks
    console.log('🔐 Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    // 5. Seed default restaurant tables if empty
    const tableCount = await RestaurantTable.count();
    if (tableCount === 0) {
      console.log('🌱 Seeding default restaurant tables...');
      const tables = [];
      for (let i = 1; i <= 10; i++) {
        tables.push({
          tableNumber: i,
          tableName: `Meja ${i}`,
          capacity: i <= 2 ? 2 : i <= 5 ? 4 : 6,
          location: i <= 5 ? 'Indoor' : 'Outdoor',
          status: 'available',
          isActive: true,
          surchargeAmount: 0
        });
      }
      await RestaurantTable.bulkCreate(tables);
      console.log(`✅ Seeded ${tables.length} default restaurant tables.`);
    } else {
      console.log(`ℹ️ Table 'restaurant_tables' already has ${tableCount} records. Skipping seeding.`);
    }
    
    // 6. Seed default categories if empty
    const categoryCount = await Category.count();
    if (categoryCount === 0) {
      console.log('🌱 Seeding default categories...');
      const categories = [
        { name: 'Makanan', description: 'Kategori Makanan Utama', icon: 'utensils', color: '#FF5733', displayOrder: 1, isActive: true },
        { name: 'Minuman', description: 'Kategori Minuman Segar & Hangat', icon: 'coffee', color: '#33FF57', displayOrder: 2, isActive: true },
        { name: 'Cemilan', description: 'Kategori Cemilan Ringan', icon: 'cookie', color: '#3357FF', displayOrder: 3, isActive: true },
        { name: 'Lainnya', description: 'Kategori Lain-lain', icon: 'box', color: '#F3FF33', displayOrder: 4, isActive: true }
      ];
      await Category.bulkCreate(categories);
      console.log(`✅ Seeded ${categories.length} default categories.`);
    } else {
      console.log(`ℹ️ Table 'categories' already has ${categoryCount} records. Skipping seeding.`);
    }
    
    // 7. Seed default users if empty
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('🌱 Seeding default users...');
      const users = [
        { username: 'admin', name: 'Administrator', email: 'admin@cafepos.local', password: 'password123', role: 'admin' },
        { username: 'kasir', name: 'Staff Kasir', email: 'kasir@cafepos.local', password: 'password123', role: 'cashier' },
        { username: 'dapur', name: 'Staff Dapur', email: 'dapur@cafepos.local', password: 'password123', role: 'kitchen' },
        { username: 'pelanggan', name: 'Pelanggan Demo', email: 'pelanggan@cafepos.local', password: 'password123', role: 'customer' }
      ];
      for (const u of users) {
        await User.create(u);
      }
      console.log(`✅ Seeded default users. (Admin username: 'admin', password: 'password123')`);
    } else {
      console.log(`ℹ️ Table 'users' already has ${userCount} records. Skipping seeding.`);
    }
    
    // 8. Print Schema Verification Status
    console.log('\n🔍 Schema Verification:');
    const checkedTables = [
      'users', 'categories', 'products', 'restaurant_tables', 
      'orders', 'order_items', 'kitchen_orders', 'transactions', 'stock_in'
    ];
    
    for (const tName of checkedTables) {
      try {
        const [rows] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${tName}\``);
        console.log(`  📊 Table '${tName}': ${rows[0].count} records`);
      } catch (err) {
        console.log(`  ❌ Table '${tName}' is missing or has error: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Safe database sync & repair completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during database sync:', error.message);
    console.error(error.stack);
    
    // Attempt to restore FK checks just in case
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (_) {}
    
    process.exit(1);
  }
}

runSync();
