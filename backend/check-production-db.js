const { Sequelize } = require('sequelize');

async function run() {
  const sequelize = new Sequelize('kasir_db', 'dev_kasir', 'NotKasir2412@', {
    host: '43.250.77.92',
    port: 3306,
    dialect: 'mysql',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL server on 43.250.77.92 (database: kasir_db)');

    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('=== TABLES IN kasir_db ===');
    console.table(tables);

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
      console.log(`\nColumns of table "${tableName}":`);
      console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
