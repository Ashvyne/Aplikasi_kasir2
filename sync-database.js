/**
 * SYNC DATABASE SCRIPT
 * Force creates all tables from models
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');

// Import all models to register them with sequelize
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const Equipment = require('./src/models/Equipment');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const StockIn = require('./src/models/StockIn');
const StockMovement = require('./src/models/StockMovement');
const Borrower = require('./src/models/Borrower');
const Loan = require('./src/models/Loan');
const Transaction = require('./src/models/Transaction');
const DamageReview = require('./src/models/DamageReview');
const DamageChatMessage = require('./src/models/DamageChatMessage');
const AuditLog = require('./src/models/AuditLog');
const ActivityLog = require('./src/models/ActivityLog');
const LoanThread = require('./src/models/LoanThread');
const LoanThreadMessage = require('./src/models/LoanThreadMessage');

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database with all models...');
    
    // Disable foreign key checks during sync
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
      console.log('📋 Disabled foreign key checks');
    }
    
    // Drop all tables and recreate (force: true)
    console.log('🔥 Dropping all existing tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');
    
    // Re-enable foreign key checks
    if (process.env.DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
      console.log('📋 Re-enabled foreign key checks');
    }
    
    console.log('✅ Database synced successfully!');
    console.log('\n⚠️  WARNING: All tables have been recreated (data was cleared)');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    if (error.errors) {
      console.error('Details:', error.errors);
    }
    try {
      if (process.env.DB_DIALECT === 'mysql') {
        await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
      }
    } catch (e) {}
    await sequelize.close();
    process.exit(1);
  }
}

syncDatabase();
