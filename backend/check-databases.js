const { Sequelize } = require('sequelize');

async function run() {
  const sequelize = new Sequelize('mysql', 'dev_kasir', 'NotKasir2412@', {
    host: '43.250.77.92',
    port: 3306,
    dialect: 'mysql',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL server on 43.250.77.92');

    const [dbs] = await sequelize.query('SHOW DATABASES');
    console.log('=== DATABASES ===');
    console.table(dbs);

    // Check dev_kasir_db tables
    console.log('\n=== TABLES IN dev_kasir_db ===');
    const [devTables] = await sequelize.query('SHOW TABLES FROM dev_kasir_db');
    console.table(devTables);

    // Check kasir_db tables if it exists
    const hasKasirDb = dbs.some(d => d.Database === 'kasir_db');
    if (hasKasirDb) {
      console.log('\n=== TABLES IN kasir_db ===');
      const [kasirTables] = await sequelize.query('SHOW TABLES FROM kasir_db');
      console.table(kasirTables);
    } else {
      console.log('\nkasir_db does not exist on this MySQL server.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
