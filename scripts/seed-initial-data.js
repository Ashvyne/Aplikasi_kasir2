/**
 * Seed Initial Data untuk Database
 * 
 * Script ini menambahkan data produk awal ke database
 * Hanya berjalan sekali jika tabel masih kosong
 */

const { sequelize } = require('../src/config/database');
const Product = require('../src/models/Product');

const seedData = async () => {
  try {
    // Check if products already exist
    const count = await Product.count();
    
    if (count > 0) {
      console.log(`✅ Database sudah ada ${count} produk. Skip seeding.`);
      return;
    }

    console.log('🌱 Seeding initial products...');

    // Sample products
    const products = [
      {
        name: 'Kopi Arabika',
        sku: 'KOF-ARB-001',
        category: 'Minuman',
        price: 25000,
        stock: 50
      },
      {
        name: 'Teh Premium',
        sku: 'TEH-PRM-001',
        category: 'Minuman',
        price: 15000,
        stock: 75
      },
      {
        name: 'Roti Tawar',
        sku: 'RTI-TAW-001',
        category: 'Makanan',
        price: 20000,
        stock: 30
      },
      {
        name: 'Croissant',
        sku: 'CRS-001',
        category: 'Makanan',
        price: 18000,
        stock: 40
      },
      {
        name: 'Donut Coklat',
        sku: 'DNT-CHC-001',
        category: 'Makanan',
        price: 10000,
        stock: 60
      },
      {
        name: 'Juice Jeruk',
        sku: 'JUS-JRK-001',
        category: 'Minuman',
        price: 12000,
        stock: 45
      },
      {
        name: 'Susu Sapi Murni',
        sku: 'SSM-001',
        category: 'Minuman',
        price: 18000,
        stock: 35
      },
      {
        name: 'Sandwich Ayam',
        sku: 'SND-AYM-001',
        category: 'Makanan',
        price: 22000,
        stock: 25
      },
      {
        name: 'Muffin Blueberry',
        sku: 'MFN-BLU-001',
        category: 'Makanan',
        price: 16000,
        stock: 50
      },
      {
        name: 'Brownies',
        sku: 'BRW-001',
        category: 'Makanan',
        price: 14000,
        stock: 55
      }
    ];

    // Bulk create products
    await Product.bulkCreate(products);
    console.log(`✅ Berhasil menambahkan ${products.length} produk awal ke database!`);

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
};

// Run seed
seedData().then(() => {
  console.log('✓ Seeding complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
