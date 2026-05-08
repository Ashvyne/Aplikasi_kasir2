const { sequelize } = require('./src/config/database');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const [users] = await sequelize.query('SELECT id, username, name, email, role, password FROM users');
    
    console.log('=== USERS LOGIN CREDENTIALS ===');
    for (const user of users) {
      const isDefault = await bcrypt.compare('123456', user.password);
      console.log(`- Username : ${user.username}`);
      console.log(`  Role     : ${user.role}`);
      console.log(`  Password : ${isDefault ? '123456 (Verified)' : 'UNKNOWN (Not 123456)'}`);
      console.log('-------------------------------');
    }
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await sequelize.close();
  }
})();
