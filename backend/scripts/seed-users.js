/**
 * Seed Default Users with Role-Based Access Control
 * 
 * Creates users with two main roles:
 * - item_user: Can access inventory/product management
 * - cashier: Can access POS/transaction management
 * 
 * Legacy roles (admin_barang, admin_kasir) are also supported for backwards compatibility
 */

const { sequelize, initDatabase } = require('../src/config/database');
const bcrypt = require('bcrypt');

const seedDefaultUsers = async () => {
  try {
    // Initialize database connection
    await initDatabase();

    // Drop and recreate users table with correct schema
    console.log('🔄 Setting up users table...');
    
    // Disable foreign key constraints temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    
    await sequelize.query('DROP TABLE IF EXISTS `users`;');
    console.log('✓ Dropped existing users table');

    await sequelize.query(`
      CREATE TABLE \`users\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(255) NOT NULL DEFAULT 'item_user',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_username\` (\`username\`),
        KEY \`idx_email\` (\`email\`),
        KEY \`idx_role\` (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ Created users table');

    // Re-enable foreign key constraints
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');

    // Hash passwords
    console.log('\n🔐 Hashing passwords...');
    const defaultPassword = await bcrypt.hash('password123', 10);

    // Define users with proper roles and descriptions
    const users = [
      {
        username: 'staff_barang',
        name: 'Staff Barang',
        email: 'staff_barang@company.local',
        role: 'item_user',
        description: 'Item User - Inventory Management'
      },
      {
        username: 'staff_kasir',
        name: 'Staff Kasir',
        email: 'staff_kasir@company.local',
        role: 'cashier',
        description: 'Cashier - POS Management'
      },
      // Legacy users for backwards compatibility
      {
        username: 'admin_barang',
        name: 'Admin Barang (Legacy)',
        email: 'admin_barang@company.local',
        role: 'admin_barang',
        description: 'Legacy - Item User'
      },
      {
        username: 'admin_kasir',
        name: 'Admin Kasir (Legacy)',
        email: 'admin_kasir@company.local',
        role: 'admin_kasir',
        description: 'Legacy - Cashier'
      }
    ];

    // Insert users
    console.log('\n📝 Creating users...');
    const placeholders = users.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const replacements = users.flatMap(u => [u.username, u.name, u.email, defaultPassword, u.role]);
    
    await sequelize.query(
      `INSERT INTO \`users\` (\`username\`, \`name\`, \`email\`, \`password\`, \`role\`) 
       VALUES ${placeholders}`,
      {
        replacements
      }
    );
    console.log('✓ Inserted users');

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ DEFAULT USERS CREATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    
    console.log('\n📋 NEW ROLE-BASED USERS (Recommended):');
    console.log('\n   1️⃣  ITEM USER (Inventory Management)');
    console.log('   ├─ Username: staff_barang');
    console.log('   ├─ Password: password123');
    console.log('   ├─ Email:    staff_barang@company.local');
    console.log('   ├─ Role:     item_user');
    console.log('   └─ Access:   Products, Stock In, Inventory, Reports');
    
    console.log('\n   2️⃣  CASHIER (POS Management)');
    console.log('   ├─ Username: staff_kasir');
    console.log('   ├─ Password: password123');
    console.log('   ├─ Email:    staff_kasir@company.local');
    console.log('   ├─ Role:     cashier');
    console.log('   └─ Access:   POS, Transactions');
    
    console.log('\n' + '-'.repeat(70));
    console.log('📋 LEGACY USERS (For Backwards Compatibility):');
    console.log('-'.repeat(70));
    
    console.log('\n   Admin Barang (Legacy - maps to Item User)');
    console.log('   ├─ Username: admin_barang');
    console.log('   ├─ Password: password123');
    console.log('   └─ Role:     admin_barang → item_user');
    
    console.log('\n   Admin Kasir (Legacy - maps to Cashier)');
    console.log('   ├─ Username: admin_kasir');
    console.log('   ├─ Password: password123');
    console.log('   └─ Role:     admin_kasir → cashier');
    
    console.log('\n' + '='.repeat(70));
    console.log('🔐 ROLE-BASED ACCESS CONTROL:');
    console.log('='.repeat(70));
    
    console.log('\n   ✅ Item User CAN Access:');
    console.log('      • Dashboard (Inventory)');
    console.log('      • Products (CRUD)');
    console.log('      • Stock In (Manage)');
    console.log('      • Reports (View)');
    
    console.log('\n   ❌ Item User CANNOT Access:');
    console.log('      • POS/Cashier');
    console.log('      • Transactions');
    
    console.log('\n   ✅ Cashier CAN Access:');
    console.log('      • POS (Point of Sale)');
    console.log('      • Transactions (View)');
    console.log('      • Products (Read-Only for selling)');
    
    console.log('\n   ❌ Cashier CANNOT Access:');
    console.log('      • Dashboard (Inventory)');
    console.log('      • Product Management (CRUD)');
    console.log('      • Stock In Management');
    console.log('      • Reports');
    
    console.log('\n' + '='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDefaultUsers();
