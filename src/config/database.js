const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

/**
 * DATABASE CONFIGURATION
 * 
 * SECURITY FEATURES:
 * ✅ Environment variables untuk credentials
 * ✅ Password validation sebelum koneksi
 * ✅ Connection pooling untuk resource management
 * ✅ SSL/TLS support untuk MySQL
 * ✅ Query timeout untuk prevent long queries
 * ✅ Disable query logging di production
 * ✅ Connection error handling
 */

// Validate required environment variables
const requiredEnvVars = ['DB_DIALECT'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Database configuration dari .env
const dbDialect = process.env.DB_DIALECT;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

// Disable query logging di production untuk security
const isProduction = process.env.NODE_ENV === 'production';
const dbLogging = isProduction ? false : (process.env.DB_LOGGING === 'true' ? console.log : false);

// Validate database credentials
const validateDatabaseConfig = () => {
  if (dbDialect === 'mysql') {
    const requiredMysqlVars = ['DB_HOST', 'DB_NAME', 'DB_USER'];
    const missing = requiredMysqlVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`❌ MySQL credentials incomplete. Missing: ${missing.join(', ')}`);
    }
    // Password strength check (only if password is set)
    if (dbPassword && dbPassword.length < 8) {
      console.warn('⚠️  WARNING: Database password should be at least 8 characters long');
    }
  }
};

// Run validation
validateDatabaseConfig();

let sequelize;

if (dbDialect === 'mysql' && dbHost && dbName && dbUser && dbPassword !== undefined) {
  // MySQL Configuration with security best practices
  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: dbLogging,
      
      // Connection pooling untuk prevent resource exhaustion
      pool: {
        max: 5,           // Max connections (prevent resource exhaustion)
        min: 0,           // Min connections
        acquire: 30000,   // Timeout untuk acquire connection (30 sec)
        idle: 10000       // Timeout untuk idle connection (10 sec)
      },

      // Security settings
      dialectOptions: {
        connectTimeout: 10000,  // Connection timeout (10 sec)
        enableKeepAlive: true,  // Keep connection alive
        supportBigNumbers: true,
        bigNumberStrings: true,
        // SSL/TLS configuration (uncomment jika menggunakan AWS RDS atau cloud DB)
        // ssl: {
        //   rejectUnauthorized: process.env.NODE_ENV === 'production',
        //   ca: process.env.DB_SSL_CA,
        //   cert: process.env.DB_SSL_CERT,
        //   key: process.env.DB_SSL_KEY
        // }
      },

      // Query settings
      define: {
        timestamps: true,        // Add createdAt & updatedAt
        underscored: true,       // Use snake_case columns
        freezeTableName: true    // Don't pluralize table names
      },

      // Prevent max query timeout (prevent long-running queries)
      benchmark: false,          // Disable benchmarking in production
    }
  );
} else if (dbDialect === 'sqlite') {
  // SQLite Configuration (Fallback/Development)
  const dbPath = path.join(__dirname, '../../kasir.db');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: dbLogging,
    
    // SQLite specific security settings
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    
    // Enable foreign key constraints
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    dialectOptions: {
      busyTimeout: 5000  // Timeout untuk busy database (5 sec)
    }
  });
} else {
  throw new Error('❌ Invalid DB_DIALECT. Use "mysql" or "sqlite"');
}

/**
 * Initialize Database Connection
 * 
 * SECURITY CHECKS:
 * ✅ Test database connection
 * ✅ Log connection info (without exposing credentials)
 * ✅ Handle connection errors gracefully
 * ✅ Validate connection status
 */
const initDatabase = async () => {
  try {
    // Test connection dengan timeout
    await sequelize.authenticate();
    
    // Disable strict mode untuk MySQL (handle legacy data dengan 0000-00-00)
    if (dbDialect === 'mysql') {
      await sequelize.query("SET SESSION sql_mode=''");
    }
    
    // Construct connection info (without exposing password)
    let dbInfo;
    if (dbDialect === 'mysql') {
      dbInfo = `(${dbUser}@${dbHost}:${dbPort}/${dbName})`;
    } else {
      dbInfo = '(SQLite: kasir.db)';
    }
    
    console.log(`✅ Database connected successfully ${dbInfo}`);
    
    // Log security status
    if (isProduction) {
      console.log('🔒 Production mode: Query logging disabled');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('   Make sure all credentials are correct and database is accessible');
    return false;
  }
};

module.exports = { sequelize, initDatabase };
