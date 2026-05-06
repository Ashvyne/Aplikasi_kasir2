require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/src/config/database');
const User = require('./backend/src/models/User');

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'password']
    });
    
    console.log('\n--- DAFTAR USER DI DATABASE ---');
    if (users.length === 0) {
      console.log('Database KOSONG! Belum ada user yang didaftarkan.');
    } else {
      users.forEach(u => {
        console.log(`- Username: ${u.username} | Role: ${u.role} | Password Hash: ${u.password.substring(0, 10)}...`);
      });
    }
    console.log('-------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

checkUsers();
