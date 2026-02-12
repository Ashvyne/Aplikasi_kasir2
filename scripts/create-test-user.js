const bcrypt = require('bcrypt');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function createTestUser() {
  try {
    console.log('🌱 Creating test borrower user...');

    // Try to insert directly without sync to avoid index issues
    const existing = await User.findOne({ where: { email: 'borrower@test.com' } });
    if (existing) {
      console.log('✓ Test user already exists');
      console.log('  Email: borrower@test.com');
      console.log('  Password: test123456');
      console.log('  Role: peminjam');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('test123456', 10);

    try {
      const user = await User.create({
        name: 'Test Borrower',
        email: 'borrower@test.com',
        password: hashedPassword,
        role: 'peminjam',
        is_active: true
      });

      console.log('✓ Test user created successfully!');
      console.log('  ID:', user.id);
      console.log('  Email: borrower@test.com');
      console.log('  Password: test123456');
      console.log('  Role: peminjam');
    } catch (createErr) {
      // If role value fails, try with raw SQL
      console.log('ℹ️  Trying direct SQL insert...');
      await sequelize.query(
        `INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) 
         VALUES ('Test Borrower', 'borrower@test.com', ?, 'peminjam', 1, NOW(), NOW())`,
        { replacements: [hashedPassword] }
      );
      console.log('✓ Test user created with SQL!');
      console.log('  Email: borrower@test.com');
      console.log('  Password: test123456');
      console.log('  Role: peminjam');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
