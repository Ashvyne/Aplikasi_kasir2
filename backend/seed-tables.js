const { sequelize, initDatabase } = require('./src/config/database');
const { RestaurantTable } = require('./src/models');

const seedTables = async () => {
  try {
    console.log('🔄 Initializing database...');
    await initDatabase();

    console.log('🔄 Creating restaurant tables...');
    
    // Create 10 sample tables
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

    // Bulk create
    await RestaurantTable.bulkCreate(tables);
    
    console.log('✅ Tables created successfully!');
    console.log('\n📊 Created Tables:');
    tables.forEach(t => {
      console.log(`   • ${t.tableName} (Capacity: ${t.capacity}, Location: ${t.location})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
};

seedTables();
