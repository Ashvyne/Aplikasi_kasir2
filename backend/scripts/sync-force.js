const { sequelize } = require('../src/config/database');
const models = require('../src/models');

async function syncDB() {
  try {
    console.log('🚀 Authenticating...');
    await sequelize.authenticate();
    console.log('✓ Database connected.');

    console.log('🔄 Syncing models...');
    // force: false, alter: true is usually safer but let's see what happens
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully!');
    
    // List tables
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('📊 Tables in database:', results.map(r => Object.values(r)[0]).join(', '));

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await sequelize.close();
  }
}

syncDB();
