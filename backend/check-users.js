const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [results, metadata] = await sequelize.query('SELECT id, username, name, email, role FROM users');
    console.log('=== USERS LIST ===');
    console.table(results);
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await sequelize.close();
  }
})();
