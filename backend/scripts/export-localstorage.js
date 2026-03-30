/**
 * SCRIPT UNTUK EXPORT LOCALSTORAGE KE JSON FILE
 * 
 * Usage di browser console:
 * 1. Buka Inspector (F12) → Console tab
 * 2. Copy-paste script ini
 * 3. Jalankan: exportLocalStorageToJSON()
 * 4. File akan di-download sebagai 'kasir_backup.json'
 */

function exportLocalStorageToJSON() {
  console.log('🔄 Exporting localStorage data...');
  
  // Ambil semua data dari localStorage
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: {}
  };
  
  // Mapping key-key yang penting
  const keysToExport = [
    'user',
    'token',
    'products',
    'transactions',
    'users',
    'roles'
  ];
  
  // Export semua key yang ada
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    
    try {
      // Coba parse JSON, jika tidak bisa ambil sebagai string
      backupData.data[key] = JSON.parse(value);
    } catch (e) {
      backupData.data[key] = value;
    }
  }
  
  console.log('📊 Data extracted:');
  console.table(Object.keys(backupData.data));
  console.log('📋 Full backup object:', backupData);
  
  // Convert ke JSON string dengan formatting
  const jsonString = JSON.stringify(backupData, null, 2);
  
  // Create blob & download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kasir_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Export successful! Check your downloads folder.');
  return backupData;
}

// Run the export
exportLocalStorageToJSON();
