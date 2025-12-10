const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kasir_modern',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false // Set true untuk debug query
  }
);

// Test connection
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
};

module.exports = { sequelize, initDatabase };
