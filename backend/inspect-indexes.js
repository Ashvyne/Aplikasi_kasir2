const { Sequelize } = require('sequelize');
require('dotenv').config();

async function run() {
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('Connected.');

    const [indexes] = await sequelize.query('SHOW INDEXES FROM products');
    console.log('=== INDEXES ON PRODUCTS TABLE ===');
    console.table(indexes.map(i => ({ Key_name: i.Key_name, Column_name: i.Column_name, Unique: i.Non_unique === 0 })));

    const [describe] = await sequelize.query('DESCRIBE products');
    console.log('\n=== COLUMNS OF PRODUCTS TABLE ===');
    console.table(describe);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
