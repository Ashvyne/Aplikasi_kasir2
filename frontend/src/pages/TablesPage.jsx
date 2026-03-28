import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, MapPin, CheckCircle2, Sparkles } from 'lucide-react';
import { tableService } from '../services/api';
import { getTableStatusColor, getTableStatusLabel } from '../utils/helpers';
import Swal from 'sweetalert2';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  const [formData, setFormData] = useState({
    tableNumber: '',
    tableName: '',
    capacity: 4,
    location: '',
    surchargeAmount: 0
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const [tablesRes, statsRes] = await Promise.all([
        tableService.getAll(),
        tableService.getStats(),
      ]);
      // Universal data extractor
      const tablesData = tablesRes?.data || tablesRes || [];
      setTables(Array.isArray(tablesData) ? tablesData : []);
      setStats(statsRes?.data || statsRes || null);
    } catch (error) {
      console.error('Error loading tables:', error);
      Swal.fire('Error', 'Gagal memuat data meja', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        capacity: table.capacity,
        location: table.location || '',
        surchargeAmount: parseFloat(table.surchargeAmount) || 0
      });
    } else {
      setEditingTable(null);
      setFormData({
        tableNumber: '',
        tableName: '',
        capacity: 4,
        location: '',
        surchargeAmount: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tableService.update(editingTable.id, formData);
        Swal.fire('Sukses', 'Meja berhasil diupdate', 'success');
      } else {
        await tableService.create(formData);
        Swal.fire('Sukses', 'Meja berhasil ditambahkan', 'success');
      }
      setIsModalOpen(false);
      loadTables();
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal menyimpan meja', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Meja?',
      text: "Data tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      try {
        await tableService.delete(id);
        Swal.fire('Terhapus!', 'Meja telah dihapus.', 'success');
        loadTables();
      } catch (error) {
        Swal.fire('Error', error.message || 'Gagal menghapus meja', 'error');
      }
    }
  };

  const handleMarkCleaning = async (table) => {
    const result = await Swal.fire({
      title: 'Tandai Selesai?',
      text: `Apakah tamu di ${table.tableName} sudah selesai makan?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Bersihkan!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await tableService.updateStatus(table.id, 'cleaning');
        Swal.fire({
          title: 'Proses Pembersihan!',
          text: `${table.tableName} sedang dibersihkan.`,
          icon: 'info',
          timer: 2000,
          showConfirmButton: false
        });
        loadTables();
      } catch (error) {
        Swal.fire('Error', error.message || 'Gagal mengubah status meja', 'error');
      }
    }
  };

  const handleMarkClean = async (table) => {
    try {
      await tableService.updateStatus(table.id, 'available');
      Swal.fire({
        title: 'Meja Siap!',
        text: `${table.tableName} sekarang tersedia untuk tamu baru.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      loadTables();
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal mengubah status meja', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
          <MapPin size={32} className="text-accent-gold" />
          Manajemen Meja
        </h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Tambah Meja
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Total Meja</p>
            <p className="text-2xl font-bold text-accent-gold">{stats.totalTables}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Meja Terisi</p>
            <p className="text-2xl font-bold text-red-500">{stats.activeTables ?? stats.occupiedTables ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Meja Tersedia</p>
            <p className="text-2xl font-bold text-accent-green">{stats.availableTables ?? 0}</p>
          </div>
          <div className="card border-orange-500/30">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Proses Pembersihan</p>
            <p className="text-2xl font-bold text-orange-500">{tables.filter(t => t.status === 'cleaning').length}</p>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading...</div>
        ) : tables.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">Belum ada meja</div>
        ) : (
          tables.map((table) => {
            const statusColors = {
              available: { icon: 'text-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', dot: 'bg-green-500' },
              occupied:  { icon: 'text-red-500',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',   dot: 'bg-red-500'   },
              reserved:  { icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', dot: 'bg-yellow-400' },
              cleaning:  { icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', dot: 'bg-orange-500' },
            };
            const colors = statusColors[table.status] || { icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
            const currentOrder = table.orders?.[0];
            const kitchenDone = !currentOrder || ['ready', 'delivered', 'served'].includes(currentOrder.kitchenStatus);

            return (
              <div
                key={table.id}
                className={`card text-center transition-all hover:shadow-glow ${getTableStatusColor(table.status)} ${table.status === 'cleaning' ? 'animate-pulse' : ''}`}
              >
                {/* Status dot + Icon */}
                <div className="flex items-center justify-center mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    table.status === 'available' ? 'bg-green-100 dark:bg-green-900/30' :
                    table.status === 'occupied'  ? 'bg-red-100 dark:bg-red-900/30' :
                    table.status === 'reserved'  ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-orange-100 dark:bg-orange-900/30'
                  }`}>
                    {table.status === 'cleaning'
                      ? <Sparkles size={24} className={`${colors.icon} animate-spin`} style={{animationDuration:'3s'}} />
                      : <UtensilsCrossed size={24} className={colors.icon} />}
                  </div>
                </div>

                <p className="font-bold text-lg text-gray-900 dark:text-white transition-colors">{table.tableName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 transition-colors">Kapasitas: {table.capacity} orang</p>

                {table.location && (
                  <p className="text-xs mb-2 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 transition-colors">
                    <MapPin size={11} /> {table.location}
                  </p>
                )}

                {/* Status Badge */}
                <div className={`text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${colors.badge} transition-colors`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                  {getTableStatusLabel(table.status)}
                </div>

                {/* VIP Surcharge Badge */}
                {parseFloat(table.surchargeAmount) > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full">
                    ⭐ VIP +Rp {Number(table.surchargeAmount).toLocaleString('id-ID')}
                  </div>
                )}

                {/* Occupied: Selesai & Bersihkan */}
                {table.status === 'occupied' && (
                  <div className="mt-3 relative group">
                    <button
                      onClick={() => kitchenDone ? handleMarkCleaning(table) : null}
                      disabled={!kitchenDone}
                      className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow
                        ${kitchenDone
                          ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                    >
                      <Sparkles size={15} />
                      Selesai &amp; Bersihkan
                    </button>
                    {!kitchenDone && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        ⏳ Makanan belum tersaji
                      </div>
                    )}
                  </div>
                )}

                {/* Cleaning: Tandai Bersih */}
                {table.status === 'cleaning' && (
                  <button
                    onClick={() => handleMarkClean(table)}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow"
                  >
                    <CheckCircle2 size={15} />
                    Tandai Bersih
                  </button>
                )}

                {/* Edit & Delete */}
                <div className="flex gap-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <button
                    onClick={() => handleOpenModal(table)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors"
                    title="Edit Meja"
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      table.status !== 'available'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-40'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
                    }`}
                    disabled={table.status !== 'available'}
                    title={table.status !== 'available' ? 'Meja sedang digunakan' : 'Hapus meja'}
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">{editingTable ? 'Edit Meja' : 'Tambah Meja'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Nomor Meja</label>
                  <input type="number" required className="input-field" value={formData.tableNumber} onChange={e => setFormData({...formData, tableNumber: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Kapasitas</label>
                  <input type="number" required min="1" className="input-field" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Nama/Label Meja (contoh: Meja 1, VIP 2)</label>
                <input type="text" required className="input-field" value={formData.tableName} onChange={e => setFormData({...formData, tableName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Lokasi / Area (opsional)</label>
                <input type="text" className="input-field" placeholder="contoh: Indoor, Outdoor" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-2">
                  Biaya Tambahan Meja (Rp)
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">VIP / Premium</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="input-field"
                  placeholder="0 = tidak ada biaya tambahan"
                  value={formData.surchargeAmount}
                  onChange={e => setFormData({...formData, surchargeAmount: parseFloat(e.target.value) || 0})}
                />
                {formData.surchargeAmount > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    💰 Pelanggan di meja ini akan dikenakan biaya tambahan Rp {Number(formData.surchargeAmount).toLocaleString('id-ID')} per kunjungan.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Batal</button>
                <button type="submit" className="btn-primary px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
