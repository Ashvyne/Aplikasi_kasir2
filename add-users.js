const bcrypt = require('bcrypt');
const { sequelize } = require('./src/config/database');

async function addUsers() {
  try {
    console.log('Adding users to database...');
    
    // Hash passwords
    const pass1 = await bcrypt.hash('staff123', 10);
    const pass2 = await bcrypt.hash('budi123', 10);
    const pass3 = await bcrypt.hash('siti123', 10);

    // Insert users
    await sequelize.query(
      `INSERT IGNORE INTO users (name, username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: ['Staff Peminjaman', 'staff01', 'staff01@example.com', pass1, 'staff', 1] }
    );
    console.log('✓ Added: staff01');

    await sequelize.query(
      `INSERT IGNORE INTO users (name, username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: ['Budi Santoso', 'budi', 'budi@example.com', pass2, 'borrower', 1] }
    );
    console.log('✓ Added: budi');

    await sequelize.query(
      `INSERT IGNORE INTO users (name, username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: ['Siti Rahayu', 'siti', 'siti@example.com', pass3, 'borrower', 1] }
    );
    console.log('✓ Added: siti');

    console.log('\n✓ All users added successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error('Details:', err.errors);
    await sequelize.close();
    process.exit(1);
  }
}

addUsers();
