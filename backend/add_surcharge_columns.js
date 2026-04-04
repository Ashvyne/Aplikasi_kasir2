const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.query(
      "ALTER TABLE restaurant_tables ADD COLUMN surcharge_amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Extra fee for premium/VIP tables';"
    );
    console.log('✅ Added surcharge_amount to restaurant_tables');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️  surcharge_amount already exists in restaurant_tables');
    } else throw e;
  }

  try {
    await sequelize.query(
      "ALTER TABLE orders ADD COLUMN table_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Applied table surcharge fee';"
    );
    console.log('✅ Added table_surcharge to orders');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️  table_surcharge already exists in orders');
    } else throw e;
  }

  console.log('Migration complete.');
  process.exit(0);
})();
