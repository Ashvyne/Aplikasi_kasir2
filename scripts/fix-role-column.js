/**
 * FIX ROLE COLUMN - Remove truncated data
 * Run: node scripts/fix-role-column.js
 */

const { sequelize } = require('../src/config/database');

async function fixRoleColumn() {
  try {
    console.log('🔧 Starting to fix role column...');

    // Connect
    await sequelize.authenticate();
    console.log('✓ Connected to database');

    // Check current data
    console.log('\n📋 Checking current users...');
    const users = await sequelize.query('SELECT id, username, email, role, CHAR_LENGTH(role) as role_len FROM users');
    console.log('Users found:', users[0].length);
    users[0].forEach(u => {
      console.log(`  - ID:${u.id} | ${u.username} | role="${u.role}" (len:${u.role_len})`);
    });

    // Delete all users with invalid role
    console.log('\n🗑️  Deleting users with invalid role...');
    await sequelize.query('DELETE FROM users WHERE role NOT IN ("admin", "staff", "borrower")');
    console.log('✓ Deleted invalid users');

    // Update the column definition - ensure NOT NULL
    console.log('\n🔄 Updating column definition...');
    await sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role 
      ENUM("admin", "staff", "borrower") 
      DEFAULT "borrower" 
      NOT NULL
    `);
    console.log('✓ Column definition updated');

    // Verify
    console.log('\n✅ Verification:');
    const updated = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log(`Users remaining: ${updated[0][0].count}`);

    await sequelize.close();
    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixRoleColumn();
