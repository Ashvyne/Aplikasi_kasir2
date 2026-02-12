const { sequelize } = require('../src/config/database');
const Equipment = require('../src/models/Equipment');

async function seedEquipment() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const equipmentData = [
      {
        name: 'Mesin Las Inverter',
        code: 'EQ001',
        category: 'Peralatan Las',
        daily_rental_rate: 150000,
        acquisition_cost: 5000000,
        total_quantity: 3,
        available_quantity: 3,
        location: 'Gudang A',
        description: 'Mesin las inverter 200A dengan teknologi terkini'
      },
      {
        name: 'Pompa Air Submersible',
        code: 'EQ002',
        category: 'Alat Pompa',
        daily_rental_rate: 75000,
        acquisition_cost: 2000000,
        total_quantity: 5,
        available_quantity: 5,
        location: 'Gudang B',
        description: 'Pompa celup 0.5 HP untuk pertanian'
      },
      {
        name: 'Kompressor Udara',
        code: 'EQ003',
        category: 'Peralatan Kompresi',
        daily_rental_rate: 120000,
        acquisition_cost: 3500000,
        total_quantity: 2,
        available_quantity: 2,
        location: 'Gudang A',
        description: 'Kompressor 5.5 kW dengan tangki 100L'
      },
      {
        name: 'Generator Listrik',
        code: 'EQ004',
        category: 'Alat Pembangkit Daya',
        daily_rental_rate: 200000,
        acquisition_cost: 7000000,
        total_quantity: 2,
        available_quantity: 2,
        location: 'Gudang C',
        description: 'Generator 5000W untuk kebutuhan lapangan'
      },
      {
        name: 'Cangkul Baja',
        code: 'EQ005',
        category: 'Alat Tangan',
        daily_rental_rate: 15000,
        acquisition_cost: 200000,
        total_quantity: 20,
        available_quantity: 20,
        location: 'Gudang D',
        description: 'Cangkul berkualitas tinggi untuk konstruksi'
      }
    ];

    for (const data of equipmentData) {
      const existing = await Equipment.findOne({ where: { code: data.code } });
      if (!existing) {
        await Equipment.create(data);
        console.log(`✅ Equipment created: ${data.name}`);
      } else {
        console.log(`⏭️  Equipment already exists: ${data.name}`);
      }
    }

    console.log('\n✓ Equipment seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedEquipment();
