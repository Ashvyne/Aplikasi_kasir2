const mysql = require('mysql2/promise');

const createTables = async () => {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '43.250.77.92',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'dev_kasir',
      password: process.env.DB_PASSWORD || 'NotKasir2412@',
      database: process.env.DB_NAME || 'dev_kasir_db'
    });

    console.log('✅ Connected to database');

    // Create restaurant_tables if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`restaurant_tables\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`tableNumber\` INT NOT NULL UNIQUE,
        \`tableName\` VARCHAR(50) NOT NULL,
        \`capacity\` INT DEFAULT 4,
        \`status\` ENUM('available','occupied','reserved') DEFAULT 'available',
        \`currentOrderId\` INT,
        \`location\` VARCHAR(100),
        \`isActive\` TINYINT(1) DEFAULT 1,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_tableNumber\` (\`tableNumber\`),
        KEY \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ restaurant_tables table ready');

    // Check if tables already exist
    const [existingTables] = await connection.execute('SELECT COUNT(*) as count FROM restaurant_tables');
    if (existingTables[0].count > 0) {
      console.log(`✅ Tables already exist (${existingTables[0].count} tables found)`);
      return;
    }

    // Insert sample tables
    const tables = [];
    for (let i = 1; i <= 10; i++) {
      tables.push([
        i,
        `Meja ${i}`,
        i <= 2 ? 2 : i <= 5 ? 4 : 6,
        'available',
        null,
        i <= 5 ? 'In-door' : 'Out-door',
        1
      ]);
    }

    await connection.query(
      'INSERT INTO restaurant_tables (tableNumber, tableName, capacity, status, currentOrderId, location, isActive) VALUES ?',
      [tables]
    );

    console.log('✅ Sample tables created!');
    tables.forEach((t, idx) => {
      console.log(`   • ${t[1]} (Capacity: ${t[2]}, Location: ${t[5]})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
};

require('dotenv').config();
createTables();
