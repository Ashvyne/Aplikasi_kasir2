const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

async function setupTestData() {
  try {
    console.log('🌱 Setting up test data...');

    // 1. Create test user
    console.log('\n📝 Creating test user...');
    const existingUser = await User.findOne({ where: { email: 'borrower@test.com' } });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('test123456', 10);
      const user = await User.create({
        name: 'Test Borrower',
        email: 'borrower@test.com',
        password: hashedPassword,
        role: 'borrower',
        is_active: true
      });
      console.log('✓ User created:', user.email);
    } else {
      console.log('✓ User already exists:', existingUser.email);
    }

    console.log('\n✅ Test user ready!');
    console.log('\n📌 Credentials:');
    console.log('   Email: borrower@test.com');
    console.log('   Password: test123456');
    console.log('   Role: borrower');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestData();
