const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

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

  // Migration 3: Create sessions table untuk multi-device login support
  db.run(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      device_name TEXT,
      ip_address TEXT,
      user_agent TEXT,
      token TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        if (err.message.includes('already exists')) {
          console.log('✓ Table "sessions" already exists');
        } else {
          console.error('Migration error:', err);
        }
      } else {
        console.log('✓ Created "sessions" table for multi-device support');
      }
    }
  );
};

module.exports = { runMigrations };
