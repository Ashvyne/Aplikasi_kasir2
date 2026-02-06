/**
 * SEED INITIAL DATA
 * Mengisi database dengan data contoh untuk aplikasi peminjaman alat
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Equipment = require('../src/models/Equipment');
const Borrower = require('../src/models/Borrower');
const Loan = require('../src/models/Loan');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✓ Database synced');
    
    // Seed Users with 3 roles
    console.log('\n📝 Creating users with different roles...');
    
    const adminPassword = await bcrypt.hash('123456', 10);
    const admin = await User.create({
      name: 'Kepala Warehouse',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('✓ Admin user created:', admin.email);
    
    // Create Petugas users
    const petugas1 = await User.create({
      name: 'Budi Santoso',
      email: 'petugas1@example.com',
      password: adminPassword,
      role: 'petugas'
    });
    console.log('✓ Petugas user created:', petugas1.email);
    
    const petugas2 = await User.create({
      name: 'Siti Nurhaliza',
      email: 'petugas2@example.com',
      password: adminPassword,
      role: 'petugas'
    });
    console.log('✓ Petugas user created:', petugas2.email);
    
    // Create Peminjam users
    const peminjam1 = await User.create({
      name: 'PT. Konstruksi Maju Jaya',
      email: 'peminjam1@example.com',
      password: adminPassword,
      role: 'peminjam'
    });
    console.log('✓ Peminjam user created:', peminjam1.email);
    
    const peminjam2 = await User.create({
      name: 'Toko Bangunan Berkah',
      email: 'peminjam2@example.com',
      password: adminPassword,
      role: 'peminjam'
    });
    console.log('✓ Peminjam user created:', peminjam2.email);
    
    const peminjam3 = await User.create({
      name: 'Workshop Mekanik Sentosa',
      email: 'peminjam3@example.com',
      password: adminPassword,
      role: 'peminjam'
    });
    console.log('✓ Peminjam user created:', peminjam3.email);
    
    // Seed Equipment
    const equipment = await Equipment.bulkCreate([
      {
        name: 'Bor Listrik Bosch',
        code: 'BOR-001',
        category: 'Alat Perkakas',
        description: 'Bor listrik 13mm dengan kecepatan variabel',
        acquisition_cost: 500000,
        daily_rental_rate: 50000,
        condition: 'Baik',
        total_quantity: 3,
        available_quantity: 3,
        location: 'Gudang A'
      },
      {
        name: 'Mesin Las Inverter',
        code: 'LAS-001',
        category: 'Alat Berat',
        description: 'Mesin las inverter 200A, cocok untuk pekerjaan industri',
        acquisition_cost: 3000000,
        daily_rental_rate: 200000,
        condition: 'Baik',
        total_quantity: 2,
        available_quantity: 2,
        location: 'Gudang B'
      },
      {
        name: 'Tangga Aluminium 5 Meter',
        code: 'TGG-001',
        category: 'Alat Konstruksi',
        description: 'Tangga aluminium lipat 5 meter dengan beban maksimal 150kg',
        acquisition_cost: 800000,
        daily_rental_rate: 75000,
        condition: 'Baik',
        total_quantity: 5,
        available_quantity: 5,
        location: 'Gudang A'
      },
      {
        name: 'Kompresor Udara 50L',
        code: 'KMP-001',
        category: 'Alat Pneumatik',
        description: 'Kompresor udara 50 liter dengan tekanan 8 bar',
        acquisition_cost: 2500000,
        daily_rental_rate: 150000,
        condition: 'Baik',
        total_quantity: 2,
        available_quantity: 2,
        location: 'Gudang B'
      },
      {
        name: 'Gergaji Potong Kayu',
        code: 'GRG-001',
        category: 'Alat Potong',
        description: 'Gergaji potong kayu dengan panjang 45cm',
        acquisition_cost: 150000,
        daily_rental_rate: 25000,
        condition: 'Baik',
        total_quantity: 8,
        available_quantity: 8,
        location: 'Gudang A'
      },
      {
        name: 'Palu Pneumatik',
        code: 'PLU-001',
        category: 'Alat Pneumatik',
        description: 'Palu pneumatik untuk paku dan pekerjaan finishing',
        acquisition_cost: 450000,
        daily_rental_rate: 50000,
        condition: 'Baik',
        total_quantity: 4,
        available_quantity: 4,
        location: 'Gudang B'
      },
      {
        name: 'Generator Listrik 3000W',
        code: 'GEN-001',
        category: 'Alat Elektronik',
        description: 'Generator portabel 3000W, cocok untuk penggunaan outdoor',
        acquisition_cost: 3500000,
        daily_rental_rate: 250000,
        condition: 'Baik',
        total_quantity: 1,
        available_quantity: 1,
        location: 'Gudang C'
      },
      {
        name: 'Pompa Air Submersible 0.5HP',
        code: 'PMP-001',
        category: 'Alat Pompa',
        description: 'Pompa submersible 0.5HP untuk ekstraksi air dari sumur/sungai',
        acquisition_cost: 800000,
        daily_rental_rate: 100000,
        condition: 'Baik',
        total_quantity: 2,
        available_quantity: 2,
        location: 'Gudang B'
      }
    ]);
    console.log(`✓ ${equipment.length} equipment seeded`);
    
    // Seed Borrowers
    const borrowers = await Borrower.bulkCreate([
      {
        name: 'PT. Konstruksi Maju Jaya',
        email: 'kontraktor@contoh.com',
        phone: '081234567890',
        identity_type: 'KTP',
        identity_number: '1234567890123456',
        address: 'Jl. Diponegoro No. 45, Jakarta',
        organization: 'PT. Konstruksi Maju Jaya',
        contact_person: 'Budi Santoso',
        contact_person_phone: '087654321098',
        is_verified: true
      },
      {
        name: 'Toko Bangunan Berkah',
        email: 'tokoberkah@contoh.com',
        phone: '085555555555',
        identity_type: 'SIM',
        identity_number: '12 04 94 8412',
        address: 'Jl. Gatot Subroto No. 12, Bandung',
        organization: 'Toko Bangunan Berkah',
        contact_person: 'Amin Wijaya',
        contact_person_phone: '08888888888',
        is_verified: true
      },
      {
        name: 'Sumber Perumahan Indonesia',
        email: 'spi@contoh.com',
        phone: '082222222222',
        identity_type: 'KTP',
        identity_number: '3214567890321456',
        address: 'Jl. Imam Bonjol No. 67, Surabaya',
        organization: 'Sumber Perumahan Indonesia',
        contact_person: 'Rudi Hermawan',
        contact_person_phone: '089999999999',
        is_verified: false
      },
      {
        name: 'Workshop Mekanik Sentosa',
        email: 'workshop@contoh.com',
        phone: '083333333333',
        identity_type: 'KTP',
        identity_number: '5432167890543216',
        address: 'Jl. Merdeka No. 78, Medan',
        organization: 'Workshop Mekanik Sentosa',
        contact_person: 'Hendra Syahputra',
        contact_person_phone: '081111111111',
        is_verified: true
      }
    ]);
    console.log(`✓ ${borrowers.length} borrowers seeded`);
    
    // Seed Loans (beberapa peminjaman aktif, some completed)
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 30);
    
    const loans = await Loan.bulkCreate([
      {
        loan_number: 'PJM-1001',
        borrower_id: borrowers[0].id,
        equipment_id: equipment[0].id,
        quantity: 1,
        loan_date: pastDate.toISOString().split('T')[0],
        due_date: new Date(pastDate.getTime() + 7*24*60*60*1000).toISOString().split('T')[0],
        return_date: new Date(pastDate.getTime() + 8*24*60*60*1000).toISOString().split('T')[0],
        status: 'Selesai',
        daily_rate: 50000,
        rental_cost: 400000,
        damage_cost: 0,
        late_fee: 50000,
        is_late: true,
        return_condition: 'Baik',
        notes: 'Peminjaman untuk proyek renovasi toko'
      },
      {
        loan_number: 'PJM-1002',
        borrower_id: borrowers[1].id,
        equipment_id: equipment[1].id,
        quantity: 1,
        loan_date: new Date(today.getTime() - 3*24*60*60*1000).toISOString().split('T')[0],
        due_date: new Date(today.getTime() + 4*24*60*60*1000).toISOString().split('T')[0],
        status: 'Aktif',
        daily_rate: 200000,
        notes: 'Peminjaman untuk pekerjaan las struktur baja'
      },
      {
        loan_number: 'PJM-1003',
        borrower_id: borrowers[0].id,
        equipment_id: equipment[2].id,
        quantity: 2,
        loan_date: new Date(today.getTime() - 10*24*60*60*1000).toISOString().split('T')[0],
        due_date: new Date(today.getTime() - 3*24*60*60*1000).toISOString().split('T')[0],
        status: 'Terlambat',
        daily_rate: 75000,
        is_late: true,
        notes: 'Tangga untuk pekerjaan cat gedung'
      },
      {
        loan_number: 'PJM-1004',
        borrower_id: borrowers[3].id,
        equipment_id: equipment[3].id,
        quantity: 1,
        loan_date: new Date(today.getTime() - 2*24*60*60*1000).toISOString().split('T')[0],
        due_date: new Date(today.getTime() + 5*24*60*60*1000).toISOString().split('T')[0],
        status: 'Aktif',
        daily_rate: 150000,
        notes: 'Kompresor untuk pneumatik dan finishing'
      }
    ]);
    console.log(`✓ ${loans.length} loans seeded`);
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           ✓ DATABASE SEEDING COMPLETED SUCCESSFULLY        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Data Summary:');
    console.log('');
    console.log('👥 Users (All use password: 123456):');
    console.log('   • Admin: admin@example.com (Kepala Warehouse)');
    console.log('   • Petugas #1: petugas1@example.com (Budi Santoso)');
    console.log('   • Petugas #2: petugas2@example.com (Siti Nurhaliza)');
    console.log('   • Peminjam #1: peminjam1@example.com (PT. Konstruksi Maju Jaya)');
    console.log('   • Peminjam #2: peminjam2@example.com (Toko Bangunan Berkah)');
    console.log('   • Peminjam #3: peminjam3@example.com (Workshop Mekanik Sentosa)');
    console.log('');
    console.log(`   • Equipment: ${equipment.length}`);
    console.log(`   • Borrowers: ${borrowers.length}`);
    console.log(`   • Loans: ${loans.length}`);
    console.log('');
    console.log('🔐 Role-Based Access:');
    console.log('   • Admin: Full system access, kelola user, kategori, alat');
    console.log('   • Petugas: Kelola peminjaman, setujui, proses pengembalian');
    console.log('   • Peminjam: Ajukan peminjaman, lihat riwayat, kembalikan alat');
    console.log('');
    console.log('🚀 You can now start the application with: npm run dev');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
