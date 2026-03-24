import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, MapPin } from 'lucide-react';
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
    location: ''
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
      setTables(tablesRes.data || []);
      setStats(statsRes.data || null);
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
        location: table.location || ''
      });
    } else {
      setEditingTable(null);
      setFormData({
        tableNumber: '',
        tableName: '',
        capacity: 4,
        location: ''
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
            <p className="text-2xl font-bold text-red-500">{stats.activeTables}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Meja Tersedia</p>
            <p className="text-2xl font-bold text-accent-green">{stats.availableTables}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Tingkat Okupansi</p>
            <p className="text-2xl font-bold text-accent-gold">{stats.occupancyRate}</p>
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
          tables.map((table) => (
            <div
              key={table.id}
              className={`card text-center transition-all hover:shadow-glow ${getTableStatusColor(table.status)}`}
            >
              <div className="flex items-center justify-center mb-2">
                <UtensilsCrossed size={28} />
              </div>
              <p className="font-bold text-lg text-gray-900 dark:text-white transition-colors">{table.tableName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 transition-colors">Kapasitas: {table.capacity} orang</p>
              
              {table.location && (
                <p className="text-xs mb-2 text-gray-600 dark:text-gray-300 transition-colors">{table.location}</p>
              )}

              <div className="text-xs font-semibold inline-block px-2 py-1 rounded bg-gray-200 dark:bg-black/20 text-gray-800 dark:text-gray-200 transition-colors">
                {getTableStatusLabel(table.status)}
              </div>
              
              <div className="flex gap-2 mt-4 justify-center border-t border-gray-200 dark:border-black/10 pt-3 transition-colors">
                <button onClick={() => handleOpenModal(table)} className="p-2 hover:bg-gray-100 dark:hover:bg-black/20 rounded text-gray-600 dark:text-gray-300 transition-colors">
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(table.id)} 
                  className={`p-2 rounded transition-colors ${table.status !== 'available' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-black/20 text-red-500 dark:text-gray-300 hover:text-red-600'}`}
                  disabled={table.status !== 'available'}
                  title={table.status !== 'available' ? 'Meja sedang terisi' : 'Hapus meja'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
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
