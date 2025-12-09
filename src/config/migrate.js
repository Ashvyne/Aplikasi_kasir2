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
};

module.exports = { runMigrations };
