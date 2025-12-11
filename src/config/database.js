const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration dari .env
const dbDialect = process.env.DB_DIALECT || 'mysql';
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbLogging = process.env.DB_LOGGING === 'true' ? console.log : false;

let sequelize;

if (dbDialect === 'mysql' && dbHost && dbName && dbUser !== undefined) {
  // MySQL Configuration
  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword || '',
    {
      host: dbHost,
      port: dbPort || 3306,
      dialect: 'mysql',
      logging: dbLogging,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // SQLite Configuration (Fallback)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../kasir.db'),
    logging: dbLogging
  });
}

// Test connection
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    const dbInfo = dbDialect === 'mysql' 
      ? `(${dbHost}:${dbPort || 3306}/${dbName})`
      : '(SQLite: kasir.db)';
    console.log(`✓ Database connected successfully ${dbInfo}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

module.exports = { sequelize, initDatabase };
