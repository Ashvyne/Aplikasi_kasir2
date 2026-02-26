/**
 * RESET COMPLETE DATABASE
 * Drops all existing tables and recreates from scratch
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function resetDatabase() {
  try {
    console.log('💣 Resetting database (dropping all tables)...');
    
    // Disable foreign key checks
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
    }
    
    // Get all tables
    const tables = await sequelize.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    const tableNames = tables[0].map(t => t.TABLE_NAME);
    
    // Drop each table
    for (const table of tableNames) {
      console.log(`   Dropping ${table}...`);
      await sequelize.query(`DROP TABLE IF EXISTS ${table}`);
    }
    
    // Re-enable foreign key checks
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    }
    
    console.log('✅ Database reset complete!');
    console.log('\nRun `node setup-db.js` to set up the database.');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      if (process.env.DB_DIALECT === 'mysql') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
      }
    } catch (e) {}
    await sequelize.close();
    process.exit(1);
  }
}

resetDatabase();
