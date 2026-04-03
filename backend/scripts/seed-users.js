/**
 * Seed Users for 4 distinct roles: Admin, Cashier, Kitchen, Customer
 */

const { sequelize, initDatabase } = require('../src/config/database');
const User = require('../src/models/User');

const seedUsers = async () => {
  try {
    await initDatabase();

    await sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    await User.destroy({ where: {}, truncate: true });

    const users = [
      {
        username: 'admin',
        name: 'Administrator',
        email: 'admin@cafepos.local',
        password: 'password123',
        role: 'admin'
      },
      {
        username: 'kasir',
        name: 'Staff Kasir',
        email: 'kasir@cafepos.local',
        password: 'password123',
        role: 'cashier'
      },
      {
        username: 'dapur',
        name: 'Staff Dapur',
        email: 'dapur@cafepos.local',
        password: 'password123',
        role: 'kitchen'
      },
      {
        username: 'pelanggan',
        name: 'Pelanggan Demo',
        email: 'pelanggan@cafepos.local',
        password: 'password123',
        role: 'customer'
      }
    ];

    console.log('\n📝 Creating users...');
    
    for (const u of users) {
      await User.create(u);
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS=1;');

    console.log('✅ Users successfully seeded for 4 Roles!');
    console.log(`
  ==== DAFTAR LOGIN ====
  (Semua Password adalah: password123)

  1. ADMIN
     Username: admin
     Akses: Semua fitur dasbor dan pengaturan.

  2. KASIR
     Username: kasir
     Akses: POS, Manajemen Meja, Transaksi kasir.

  3. DAPUR
     Username: dapur
     Akses: Fitur Kitchen display (Dapur)

  4. PELANGGAN
     Username: pelanggan
     Akses: Form pesanan pelanggan (URL /customer/login)
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
};

seedUsers();
