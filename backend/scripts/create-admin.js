/**
 * SCRIPT CREATE ADMIN USER
 * 
 * Penggunaan:
 * node scripts/create-admin.js <username> <password> <name>
 * 
 * Contoh:
 * node scripts/create-admin.js bos_kasir 123456 "Si Bos"
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

const args = process.argv.slice(2);
const username = args[0] || 'admin_baru';
const password = args[1] || 'admin123';
const name = args[2] || 'Administrator';
const email = args[3] || `${username}@example.com`;

async function createAdmin() {
  try {
    console.log('🚀 Menghubungkan ke database...');
    await sequelize.authenticate();
    
    console.log(`🔍 Memeriksa user: ${username}...`);
    const existingUser = await User.findOne({ where: { username } });
    
    if (existingUser) {
      console.log('⚠️ User sudah ada! Mengupdate password...');
      existingUser.password = password; // Akan di-hash otomatis oleh hook model
      existingUser.name = name;
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`✅ User ${username} berhasil diupdate!`);
    } else {
      console.log(`➕ Membuat user admin baru...`);
      await User.create({
        username,
        password, // Akan di-hash otomatis oleh hook model
        name,
        email,
        role: 'admin'
      });
      console.log(`✅ Admin baru berhasil dibuat!`);
      console.log(`-----------------------------------`);
      console.log(`Username : ${username}`);
      console.log(`Password : ${password}`);
      console.log(`Role     : admin`);
      console.log(`-----------------------------------`);
    }
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

createAdmin();
