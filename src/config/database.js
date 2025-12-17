const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

/**
 * DATABASE CONFIGURATION
 *
 * FINAL & SAFE VERSION:
 * ✅ No invalid mysql2 options
 * ✅ No sqlMode in dialectOptions (prevents warning)
 * ✅ Strict SQL mode enforced correctly
 * ✅ MySQL & SQLite supported
 * ✅ Production ready
 */

// ======================
// ENV VALIDATION
// ======================
if (!process.env.DB_DIALECT) {
  console.error('❌ Missing environment variable: DB_DIALECT');
  process.exit(1);
}

// ======================
// ENV VARIABLES
// ======================
const dbDialect  = process.env.DB_DIALECT;
const dbHost     = process.env.DB_HOST;
const dbPort     = parseInt(process.env.DB_PORT || '3306', 10);
const dbName     = process.env.DB_NAME;
const dbUser     = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const isProduction = process.env.NODE_ENV === 'production';
const dbLogging =
  isProduction ? false : (process.env.DB_LOGGING === 'true' ? console.log : false);

// ======================
// VALIDATION
// ======================
const validateConfig = () => {
  if (dbDialect === 'mysql') {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
    const missing = required.filter(v => !process.env[v]);

    if (missing.length > 0) {
      throw new Error(`❌ MySQL config incomplete. Missing: ${missing.join(', ')}`);
    }

    if (dbPassword && dbPassword.length < 8) {
      console.warn('⚠️  Database password should be at least 8 characters');
    }
  }
};

validateConfig();

// ======================
// SEQUELIZE INSTANCE
// ======================
let sequelize;

if (dbDialect === 'mysql') {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: dbLogging,

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    dialectOptions: {
      connectTimeout: 10000,
      enableKeepAlive: true,
      supportBigNumbers: true,
      bigNumberStrings: true

      // ❌ NO sqlMode here (mysql2 will warn)
      // ✅ SQL mode handled after connect
    },

    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },

    benchmark: false
  });

} else if (dbDialect === 'sqlite') {
  const dbPath = path.join(__dirname, '../../kasir.db');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: dbLogging,

    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },

    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    dialectOptions: {
      busyTimeout: 5000
    }
  });

} else {
  throw new Error('❌ Invalid DB_DIALECT. Use "mysql" or "sqlite"');
}

// ======================
// INIT DATABASE
// ======================
const initDatabase = async () => {
  try {
    await sequelize.authenticate();

    // ✅ CORRECT way to enforce strict mode (mysql2 safe)
    if (dbDialect === 'mysql') {
      await sequelize.query(`
        SET SESSION sql_mode =
        'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
      `);
    }

    const info =
      dbDialect === 'mysql'
        ? `(${dbUser}@${dbHost}:${dbPort}/${dbName})`
        : '(SQLite: kasir.db)';

    console.log(`✅ Database connected successfully ${info}`);

    if (isProduction) {
      console.log('🔒 Production mode: Query logging disabled');
    }

    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
};

module.exports = { sequelize, initDatabase };
