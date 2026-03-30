const { sequelize, initDatabase } = require('./src/config/database');
const { RestaurantTable, Order, OrderItem, Category, Product, User, KitchenOrder, Transaction, StockIn } = require('./src/models');

const syncDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await initDatabase();

    console.log('🔄 Syncing all models with database...');
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ Database synchronized successfully!');

    console.log('\n📊 Creating sample restaurant tables...');
    
    // Create 10 sample tables if they don't exist
    const existingTables = await RestaurantTable.count();
    if (existingTables === 0) {
      const tables = [];
      for (let i = 1; i <= 10; i++) {
        tables.push({
          tableNumber: i,
          tableName: `Meja ${i}`,
          capacity: i <= 2 ? 2 : i <= 5 ? 4 : 6,
          location: i <= 5 ? 'In-door' : 'Out-door',
          status: 'available',
          isActive: true
        });
      }

      await RestaurantTable.bulkCreate(tables);
      console.log('✅ Sample tables created!');
      tables.forEach(t => {
        console.log(`   • ${t.tableName} (Capacity: ${t.capacity}, Location: ${t.location})`);
      });
    } else {
      console.log(`✅ Tables already exist (${existingTables} tables found)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
