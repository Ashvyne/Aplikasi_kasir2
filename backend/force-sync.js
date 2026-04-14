const { sequelize } = require('./src/config/database');
require('./src/models'); // Load all models and associations

async function syncAll() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    console.log('🔄 Disabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🔄 Rebuilding all tables (FORCE SYNC)...');
    // Using instance-wide sync is much safer for handling dependencies
    await sequelize.sync({ force: true });

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables synced successfully.');

    const [tablesResult] = await sequelize.query('SHOW TABLES');
    console.log('\n📅 Current tables in database:');
    console.log(tablesResult.map(t => Object.values(t)[0]).join(', '));

    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    console.error(err.stack);
    // Ensure FK checks are re-enabled even on failure
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    process.exit(1);
  }
}

syncAll();
