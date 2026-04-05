const { sequelize } = require('./src/config/database');
const models = require('./src/models');

const totalModels = Object.keys(sequelize.models).length;
console.log(`🔍 Total models to sync: ${totalModels}`);
console.log(`📋 Models: ${Object.keys(sequelize.models).join(', ')}`);

async function syncAll() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    const modelNames = Object.keys(sequelize.models);
    console.log(`🔄 Syncing ${modelNames.length} models one-by-one...`);

    for (const modelName of modelNames) {
      try {
        console.log(`⏳ Syncing model: ${modelName}...`);
        await sequelize.models[modelName].sync({ alter: true });
        console.log(`✅ ${modelName} synced.`);
      } catch (mErr) {
        console.error(`❌ FAILED syncing ${modelName}:`, mErr.message);
      }
    }
    
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\n📅 Current tables in database:');
    console.log(tables.map(t => Object.values(t)[0]).join(', '));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    process.exit(1);
  }
}

syncAll();
