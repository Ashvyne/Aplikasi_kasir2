/**
 * Script untuk check produk yang ada di database
 */

const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n');

    const { initDatabase } = require('../src/config/database');
    await initDatabase();
    await sequelize.sync();

    const products = await Product.findAll({
      attributes: ['id', 'name', 'sku', 'price', 'stock', 'image_url']
    });

    if (products.length === 0) {
      console.log('❌ No products found in database');
      console.log('\n📝 Please add products first via the UI or API');
    } else {
      console.log(`✓ Found ${products.length} product(s):\n`);
      console.table(products.map(p => ({
        ID: p.id,
        Name: p.name,
        SKU: p.sku,
        Price: `Rp ${p.price}`,
        Stock: p.stock,
        Image: p.image_url || '(none)'
      })));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
