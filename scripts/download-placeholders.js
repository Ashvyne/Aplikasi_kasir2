#!/usr/bin/env node

/**
 * Helper Script untuk Download Placeholder Images
 * 
 * Script ini membantu download placeholder images dari placekitten.com
 * dan menyimpannya ke folder uploads untuk testing
 * 
 * Usage: node scripts/download-placeholders.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const uploadsDir = path.join(__dirname, '..', 'src', 'public', 'uploads');

// Buat folder uploads jika belum ada
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Created uploads directory:', uploadsDir);
}

// Placeholder products dengan URL gambar
const placeholderProducts = [
  {
    name: 'Nasi Goreng',
    filename: 'nasi-goreng-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=1'
  },
  {
    name: 'Mie Ayam',
    filename: 'mie-ayam-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=2'
  },
  {
    name: 'Es Teh Manis',
    filename: 'es-teh-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=3'
  },
  {
    name: 'Soto Ayam',
    filename: 'soto-ayam-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=4'
  },
  {
    name: 'Lumpia Goreng',
    filename: 'lumpia-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=5'
  },
  {
    name: 'Lele Goreng',
    filename: 'lele-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=6'
  },
  {
    name: 'Anime',
    filename: 'anime-placeholder.jpg',
    url: 'https://placekitten.com/400/400?image=7'
  }
];

// Function untuk download file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Main function
async function downloadPlaceholders() {
  console.log('📥 Downloading placeholder images...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (const product of placeholderProducts) {
    const filePath = path.join(uploadsDir, product.filename);
    
    // Skip jika file sudah ada
    if (fs.existsSync(filePath)) {
      console.log('⏭️  Skipped (sudah ada):', product.name);
      continue;
    }

    try {
      await downloadFile(product.url, filePath);
      console.log('✓ Downloaded:', product.name, `-> ${product.filename}`);
      successCount++;
    } catch (error) {
      console.error('✗ Failed to download:', product.name, '-', error.message);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  console.log(`  📁 Location: ${uploadsDir}`);
  
  if (successCount === 0 && failCount === 0) {
    console.log('\n⏭️  All images already exist!');
  }
}

// Run jika di-execute langsung
if (require.main === module) {
  downloadPlaceholders().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { downloadPlaceholders };
