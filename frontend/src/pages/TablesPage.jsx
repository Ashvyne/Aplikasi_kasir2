import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit, Trash2, MapPin, CheckCircle2, Sparkles, CreditCard, X, Banknote, Smartphone, Copy } from 'lucide-react';
import { tableService, orderService } from '../services/api';
import { getTableStatusColor, getTableStatusLabel, formatCurrency } from '../utils/helpers';
import NumericInput from '../components/NumericInput';
import Receipt from '../components/Receipt';
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

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

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

  const handleDuplicate = async (table) => {
    try {
      setLoading(true);
      // Temukan nomor meja tertinggi untuk menyarankan nomor meja berikutnya
      const maxTableNumber = Math.max(...tables.map(t => parseInt(t.tableNumber) || 0), 0);
      
      const duplicateData = {
        tableNumber: maxTableNumber + 1,
        tableName: `${table.tableName} (Copy)`,
        capacity: table.capacity,
        location: table.location || '',
        surchargeAmount: parseFloat(table.surchargeAmount) || 0
      };

      await tableService.create(duplicateData);
      Swal.fire({
        title: 'Sukses',
        text: `Meja ${table.tableName} berhasil diduplikat menjadi ${duplicateData.tableName}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      loadTables();
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal menduplikat meja', 'error');
    } finally {
      setLoading(false);
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

  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('cash');
    setPaidAmount('');
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedOrder) return;

    const totalToPay = parseFloat(selectedOrder.totalAmount);
    const paid = parseFloat(paidAmount);
    
    if (paymentMethod === 'cash' && (!paid || paid < totalToPay)) {
      return Swal.fire('Error', `Uang yang dibayar kurang! Minimal Rp ${totalToPay.toLocaleString('id-ID')}`, 'error');
    }

    try {
      setProcessingPayment(true);
      
      await orderService.processPayment(selectedOrder.id, {
        paidAmount: paymentMethod === 'cash' ? paid : totalToPay,
        paymentMethod
      });

      const change = paymentMethod === 'cash' ? Math.max(0, paid - totalToPay) : 0;
      
      setShowPaymentModal(false);
      
      // For receipt modal
      setCompletedOrder({
        ...selectedOrder,
        paidAmount: paymentMethod === 'cash' ? paid : totalToPay,
        changeAmount: change,
        paymentMethod,
        paidAt: new Date()
      });

      Swal.fire({
        title: 'Pembayaran Berhasil! 🎉',
        html: change > 0
          ? `<p class="text-gray-700">Total: <strong>Rp ${totalToPay.toLocaleString('id-ID')}</strong></p><p class="text-gray-700">Bayar: <strong>Rp ${paid.toLocaleString('id-ID')}</strong></p><p class="text-2xl font-bold text-green-600 mt-2">Kembalian: Rp ${change.toLocaleString('id-ID')}</p>`
          : `<p>Pembayaran <strong>${paymentMethod === 'card' ? 'Kartu Debit' : paymentMethod === 'digital' ? 'Digital' : 'Tunai'}</strong> berhasil diproses.</p>`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#FFD700',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Cetak Struk',
        cancelButtonText: 'OK',
        customClass: {
          confirmButton: 'text-black font-bold',
        }
      }).then((result) => {
        if (result.isConfirmed) {
          setShowReceipt(true);
        }
      });

      loadTables();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error?.response?.data?.message || error.message || 'Gagal memproses pembayaran', 'error');
    } finally {
      setProcessingPayment(false);
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
            
            // Check if customer already paid (Customer app QRIS flow)
            const isPaid = currentOrder && parseFloat(currentOrder.paidAmount || 0) > 0 && parseFloat(currentOrder.paidAmount || 0) >= parseFloat(currentOrder.totalAmount || 0);

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

                {/* Occupied: Bayar & Selesai */}
                {table.status === 'occupied' && currentOrder && (
                  <div className="mt-3 space-y-2">
                    {!isPaid ? (
                      <button
                        onClick={() => handleOpenPayment(currentOrder)}
                        className="w-full flex items-center justify-center gap-2 bg-accent-gold hover:bg-yellow-400 text-black font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow-glow"
                      >
                        <CreditCard size={15} />
                        Bayar Sekarang
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm py-2 px-3 rounded-lg transition-colors">
                        <CheckCircle2 size={15} />
                        Lunas ({currentOrder.paymentMethod === 'digital' ? 'QRIS' : currentOrder.paymentMethod === 'card' ? 'Kartu' : 'Tunai'})
                      </div>
                    )}
                    
                    <div className="relative group">
                      <button
                        onClick={() => (kitchenDone && isPaid) ? handleMarkCleaning(table) : null}
                        disabled={!isPaid}
                        className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow ${
                          !isPaid 
                            ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            : 'bg-white dark:bg-bg-darker text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Sparkles size={15} />
                        Selesai &amp; Bersihkan
                      </button>
                      {!isPaid && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          🔒 Silakan proses pembayaran dahulu
                        </div>
                      )}
                    </div>
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
                    onClick={() => handleDuplicate(table)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 text-xs font-semibold transition-colors"
                    title="Duplikat Meja"
                  >
                    <Copy size={13} /> Copy
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
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Nomor Meja</label>
                  <input type="number" required className="input-field font-bold" placeholder="1" value={formData.tableNumber} onChange={e => setFormData({...formData, tableNumber: parseInt(e.target.value)})} />
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 pl-1"><Sparkles size={10} /> ID unik sistem</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Kapasitas</label>
                  <input type="number" required min="1" className="input-field font-bold" placeholder="4" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 pl-1">👥 Maks. tamu</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Nama / Label Meja</label>
                <div className="relative group">
                  <input type="text" required className="input-field pl-10" placeholder="Meja 1, VIP A, Outdoor 5" value={formData.tableName} onChange={e => setFormData({...formData, tableName: e.target.value})} />
                  <UtensilsCrossed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-gold transition-colors" />
                </div>
                <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center gap-2 animate-in fade-in duration-300">
                  <span className="text-xs">💡</span>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Contoh: Meja 1, VIP A, atau Meja Taman 1.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Lokasi / Area (Opsional)</label>
                <div className="relative group">
                  <input type="text" className="input-field pl-10" placeholder="Indoor, Outdoor, Lantai 2" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-gold transition-colors" />
                </div>
                <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center gap-2 animate-in fade-in duration-300">
                  <span className="text-xs">📍</span>
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">Gunakan untuk mengelompokkan area meja.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-between">
                  <span className="flex items-center gap-2">Biaya Tambahan Meja</span>
                  <span className="text-[10px] uppercase tracking-wider bg-accent-gold/20 text-accent-gold font-bold px-2 py-0.5 rounded-md border border-accent-gold/30">VIP / Premium</span>
                </label>
                
                <NumericInput
                  value={formData.surchargeAmount}
                  onChange={val => setFormData({...formData, surchargeAmount: val})}
                  prefix="Rp"
                  placeholder="0"
                  className="font-bold text-lg text-accent-gold !bg-accent-gold/5 border-accent-gold/30 focus:border-accent-gold"
                />

                {formData.surchargeAmount > 0 ? (
                  <div className="p-3 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <span className="text-lg">💰</span>
                    <p className="text-xs text-accent-gold font-medium leading-relaxed">
                      Pelanggan di meja ini akan dikenakan biaya tambahan <span className="font-bold underline">Rp {Number(formData.surchargeAmount).toLocaleString('id-ID')}</span> secara otomatis di setiap pesanan.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-gray-500/5 border border-gray-500/10 flex items-center gap-2 animate-in fade-in duration-300">
                    <span className="text-xs text-gray-500">ℹ️</span>
                    <p className="text-[11px] text-gray-500 italic font-medium">Isi biaya jika ini adalah meja dengan fasilitas khusus (VIP).</p>
                  </div>
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
      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-accent-gold/10 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="text-accent-gold" size={22} /> Pembayaran {selectedOrder.orderNumber}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 dark:bg-bg-darker rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Pajak & Layanan</span><span>{formatCurrency(parseFloat(selectedOrder.taxAmount) + parseFloat(selectedOrder.serviceCharge))}</span>
                </div>
                {parseFloat(selectedOrder.tableSurcharge) > 0 && (
                  <div className="flex justify-between text-yellow-600 dark:text-yellow-400 font-medium">
                    <span>⭐ Biaya Meja VIP</span><span>{formatCurrency(selectedOrder.tableSurcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span>Total</span>
                  <span className="text-accent-gold">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash',    label: 'Tunai',          icon: Banknote },
                  { value: 'card',    label: 'Kartu',          icon: CreditCard },
                  { value: 'digital', label: 'QRIS',           icon: Smartphone },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      paymentMethod === m.value
                        ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <m.icon size={20} />
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <NumericInput
                    value={paidAmount}
                    onChange={val => setPaidAmount(val.toString())}
                    prefix="Rp"
                    placeholder="Jumlah Bayar"
                    className="text-lg font-bold"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {[10000, 20000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setPaidAmount(prev => ((parseFloat(prev) || 0) + amt).toString())}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-bg-darker text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 border border-gray-200 dark:border-gray-700 transition"
                      >
                        +{amt/1000}rb
                      </button>
                    ))}
                    <button
                      onClick={() => setPaidAmount(selectedOrder.totalAmount.toString())}
                      className="px-3 py-1.5 bg-accent-gold text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition"
                    >
                      Uang Pas
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={confirmPayment}
                disabled={processingPayment || (paymentMethod === 'cash' && (!paidAmount || parseFloat(paidAmount) < parseFloat(selectedOrder.totalAmount)))}
                className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  processingPayment || (paymentMethod === 'cash' && (!paidAmount || parseFloat(paidAmount) < parseFloat(selectedOrder.totalAmount)))
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-accent-gold text-black hover:bg-yellow-400 shadow-lg'
                }`}
              >
                {processingPayment ? 'Memproses...' : `Konfirmasi Bayar ${formatCurrency(selectedOrder.totalAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Receipt Modal */}
      {showReceipt && completedOrder && (
        <Receipt 
          order={completedOrder} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
