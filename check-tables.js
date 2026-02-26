const { sequelize } = require('./src/config/database');

async function checkTables() {
  try {
    const tables = await sequelize.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    console.log('📋 Existing tables:');
    if (tables[0].length === 0) {
      console.log('   (no tables found)');
    } else {
      tables[0].forEach(t => console.log('   -', t.TABLE_NAME));
    }
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkTables();
