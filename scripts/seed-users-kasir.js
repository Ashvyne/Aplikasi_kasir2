/**
 * SEED DEFAULT USERS - Sistem Peminjaman Alat
 * 
 * Script ini membuat user default untuk sistem peminjaman alat
 * Run: node scripts/seed-users-kasir.js
 */

const bcrypt = require('bcrypt');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function seedUsers() {
  try {
    console.log('🌱 Starting seed default users for Equipment Rental System...');

    // Drop users table if exists and recreate with correct ENUM
    console.log('🔄 Updating users table schema...');
    try {
      // First, truncate/delete existing users to avoid constraint issues
      await sequelize.query('DELETE FROM users');
      console.log('✓ Cleared existing users');
      
      await sequelize.query('ALTER TABLE users MODIFY COLUMN role ENUM("admin", "staff", "borrower") DEFAULT "borrower"');
      console.log('✓ Users table schema updated');
    } catch (err) {
      console.log('ℹ️  Table schema update:', err.message.substring(0, 50));
    }

    // Sync database
    await sequelize.sync();
    console.log('✓ Database synced');

    // Default users - Simplified to 3 roles only
    const defaultUsers = [
      {
        name: 'Administrator',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        is_active: true
      },
      {
        name: 'Staff Peminjaman',
        username: 'staff01',
        email: 'staff01@example.com',
        password: 'staff123',
        role: 'staff',
        is_active: true
      },
      {
        name: 'Budi Santoso',
        username: 'budi',
        email: 'budi@example.com',
        password: 'budi123',
        role: 'borrower',
        is_active: true
      },
      {
        name: 'Siti Rahayu',
        username: 'siti',
        email: 'siti@example.com',
        password: 'siti123',
        role: 'borrower',
        is_active: true
      }
    ];

    // Hash passwords dan create users
    for (const userData of defaultUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Check if user exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user
      await User.create({
        ...userData,
        password: hashedPassword
      });

      console.log(`✓ Created user: ${userData.username} (${userData.email}) - Role: ${userData.role}`);
    }

    console.log('✓ Seed completed successfully!');
    console.log('');
    console.log('📝 Default Credentials:');
    console.log('');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('Staff:');
    console.log('  Username: staff01');
    console.log('  Password: staff123');
    console.log('');
    console.log('Borrower/Peminjam:');
    console.log('  Username: budi');
    console.log('  Password: budi123');
    console.log('');
    console.log('Supervisor:');
    console.log('  Username: supervisor');
console.log('');
    console.log('Staff:');
    console.log('  Username: staff01');
    console.log('  Password: staff123');
    console.log('');
    console.log('Borrower 1:');
    console.log('  Username: budi');
    console.log('  Password: budi123');
    console.log('');
    console.log('Borrower 2:');
    console.log('  Username: siti');
    console.log('  Password: siti123');
    console.log('');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', error.errors);
    }
    await sequelize.close();
    process.exit(1);
  }
}

seedUsers();
