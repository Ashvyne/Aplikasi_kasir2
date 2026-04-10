const { initDatabase } = require('./src/config/database');
const path = require('path');

async function test() {
  console.log('Testing database connection...');
  console.log('Current __dirname:', __dirname);
  console.log('DB_DIALECT:', process.env.DB_DIALECT);
  
  const connected = await initDatabase();
  if (connected) {
    console.log('SUCCESS: Connected to database');
  } else {
    console.log('FAILURE: Could not connect to database');
  }
  process.exit(connected ? 0 : 1);
}

test();
