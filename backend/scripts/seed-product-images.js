/**
 * Seeder script untuk update produk existing dengan contoh image URL
 * 
 * Usage: node scripts/seed-product-images.js
 */

const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');

async function seedProductImages() {
  try {
    console.log('🌱 Seeding product images...\n');

    // Produk dengan contoh image URL (dummy/placeholder)
    const productImageUpdates = [
      { sku: '01', image_url: '/uploads/nasi-goreng.jpg', name: 'Nasi goreng' },
      { sku: '02', image_url: '/uploads/es-teh.jpg', name: 'Es/panas Teh' },
      { sku: '03', image_url: '/uploads/lele-goreng.jpg', name: 'Lele Goreng' },
      { sku: '05', image_url: '/uploads/anime.jpg', name: 'Anime' }
    ];

    for (const update of productImageUpdates) {
      const product = await Product.findOne({ where: { sku: update.sku } });
      
      if (product) {
        if (product.image_url) {
          console.log(`⏭️  Skipped (sudah punya gambar): ${update.name}`);
        } else {
          await product.update({ image_url: update.image_url });
          console.log(`✓ Updated: ${update.name} -> ${update.image_url}`);
        }
      } else {
        console.log(`⚠️  Product not found: ${update.sku}`);
      }
    }

    console.log('\n✓ Product image seeding completed!');
    console.log('\n📝 Note:');
    console.log('   Image URLs are set to dummy paths.');
    console.log('   Upload actual images via the UI (Produk -> Edit -> Upload Gambar)');
    console.log('   or use POST /api/products with FormData to upload images.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Initialize database and run seeder
(async () => {
  try {
    const { initDatabase } = require('../src/config/database');
    await initDatabase();
    await sequelize.sync();
    await seedProductImages();
  } catch (error) {
    console.error('Error initializing:', error);
    process.exit(1);
  }
})();
