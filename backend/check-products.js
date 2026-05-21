const { Product, RestaurantTable, Order } = require('./src/models');
const { initDatabase } = require('./src/config/database');

async function test() {
  await initDatabase();
  try {
    const productCount = await Product.count();
    const tableCount = await RestaurantTable.count();
    const orderCount = await Order.count();

    console.log('=== DATABASE STATUS ===');
    console.log('Product count:', productCount);
    console.log('Table count:', tableCount);
    console.log('Order count:', orderCount);

    if (productCount > 0) {
      const sampleProducts = await Product.findAll({ limit: 5 });
      console.log('Sample Products:');
      console.table(sampleProducts.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })));
    }

    if (tableCount > 0) {
      const sampleTables = await RestaurantTable.findAll({ limit: 5 });
      console.log('Sample Tables:');
      console.table(sampleTables.map(t => ({ id: t.id, tableNumber: t.tableNumber, status: t.status })));
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

test();
