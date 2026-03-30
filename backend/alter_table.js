const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.query("ALTER TABLE restaurant_tables MODIFY COLUMN status ENUM('available', 'occupied', 'reserved', 'cleaning') DEFAULT 'available';");
    console.log('Successfully altered restaurant_tables status ENUM.');
  } catch (error) {
    console.error('Error altering table:', error.message);
  } finally {
    process.exit(0);
  }
})();
