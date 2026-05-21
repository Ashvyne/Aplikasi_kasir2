const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Resetting passwords to "123456"...');
    
    const users = await User.findAll();
    for (const user of users) {
      user.password = '123456';
      await user.save();
      console.log(`- Username: ${user.username} | Role: ${user.role} | Password: ${user.password}`);
    }
    
    console.log('✅ All passwords reset to 123456');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
