const { db } = require('./database');

const runMigrations = () => {
  // Migration 1: Add notes column to transactions
  db.run(
    `ALTER TABLE transactions ADD COLUMN notes TEXT`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column')) {
          console.log('✓ Column "notes" already exists');
        } else {
          console.error('Migration error:', err);
        }
      } else {
        console.log('✓ Added "notes" column to transactions table');
      }
    }
  );
  
  // Migration 2: Update role values to support admin_kasir and admin_barang
  db.run(
    `UPDATE users SET role = 'admin_barang' WHERE role = 'admin'`,
    (err) => {
      if (err) {
        console.log('ℹ️  Role update already applied or no admin users');
      } else {
        console.log('✓ Updated admin roles to admin_barang');
      }
    }
  );
};

module.exports = { runMigrations };
