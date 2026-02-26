const { sequelize } = require('./src/config/database');

async function checkUsers() {
  try {
    const users = await sequelize.query("SELECT id, name, email, username, role FROM users ORDER BY id");
    console.log('📋 Users in database:');
    if (users[0].length === 0) {
      console.log('   (no users found)');
    } else {
      users[0].forEach(u => {
        console.log(`   ${u.id}. ${u.name} (${u.username}) - ${u.email} - Role: ${u.role}`);
      });
    }
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkUsers();
