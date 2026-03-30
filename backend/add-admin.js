const bcrypt = require('bcrypt');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await sequelize.query(
      'INSERT INTO users (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      {
        replacements: ['admin', 'Administrator', 'admin@company.local', hashedPassword, 'admin_kasir']
      }
    );
    console.log('✅ Admin user created: admin / 123456');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
