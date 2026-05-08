const { sequelize } = require('../src/config/database');

async function fixUsersTable() {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected.');

    // Get all indexes for users table
    const [indexes] = await sequelize.query('SHOW INDEX FROM users');
    console.log(`📊 Found ${indexes.length} index entries on users table.`);

    // Group by index name to see duplicates
    const indexNames = [...new Set(indexes.map(i => i.Key_name))];
    console.log(`🏷️ Unique index names: ${indexNames.length}`);

    if (indexNames.length > 50) {
      console.log('⚠️ Too many indexes detected on USERS. Cleaning up...');
      for (const name of indexNames) {
        if (name !== 'PRIMARY' && (name.includes('username') || name.includes('email') || name.length > 20)) {
           try {
             await sequelize.query(`ALTER TABLE users DROP INDEX \`${name}\``);
           } catch (e) {}
        }
      }
    }

    // Also clean Products
    try {
      const [pIndexes] = await sequelize.query('SHOW INDEX FROM products');
      if (pIndexes.length > 50) {
        console.log('⚠️ Too many indexes detected on PRODUCTS. Cleaning up...');
        const pNames = [...new Set(pIndexes.map(i => i.Key_name))];
        for (const name of pNames) {
          if (name !== 'PRIMARY' && (name.includes('sku') || name.length > 20)) {
            try { await sequelize.query(`ALTER TABLE products DROP INDEX \`${name}\``); } catch (e) {}
          }
        }
      }
    } catch (e) {}

    console.log('✅ Cleanup finished.');

    // Try to sync individual models to avoid the block
    const models = require('../src/models');
    const modelNames = Object.keys(models);
    
    for (const name of modelNames) {
      console.log(`🔄 Syncing ${name}...`);
      try {
        await models[name].sync({ alter: true });
        console.log(`✅ ${name} synced.`);
      } catch (err) {
        console.error(`❌ ${name} sync failed:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixUsersTable();
