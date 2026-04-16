import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  X,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  Archive,
  ClipboardList,
  Trash2,
  Check,
} from 'lucide-react';

import { getImageUrl } from '../utils/helpers';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Add Stock Modal ──────────────────────────────────────────────────────────
function AddStockModal({ products, onClose, onSuccess }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchProd, setSearchProd] = useState('');

  const selectedProduct = products.find((p) => p.id === parseInt(productId));
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProd.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchProd.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !quantity || parseInt(quantity) <= 0) {
      setError('Pilih produk dan masukkan jumlah yang valid.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/stockin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: parseInt(productId),
          quantity: parseInt(quantity),
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah stok');
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-bg-light rounded-2xl shadow-2xl w-full max-w-md animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-gold/20 rounded-xl">
              <Plus size={20} className="text-accent-gold" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tambah Stok</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-bg-darker transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Produk <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* Custom Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="input-field w-full flex items-center justify-between text-left focus:ring-accent-gold focus:border-accent-gold"
              >
                {selectedProduct ? (
                  <div className="flex items-center gap-3">
                    {getImageUrl(selectedProduct.image_url) ? (
                      <img 
                        src={getImageUrl(selectedProduct.image_url)} 
                        alt={selectedProduct.name}
                        className="w-6 h-6 rounded object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                    ) : null}
                    <div className="w-6 h-6 rounded bg-gray-200 dark:bg-bg-dark border border-gray-300 dark:border-gray-700 items-center justify-center" style={{display: getImageUrl(selectedProduct.image_url) ? 'none' : 'flex'}}>
                      <Package size={12} className="text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {selectedProduct.name} ({selectedProduct.sku})
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">-- Pilih Produk --</span>
                )}
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-bg-darker border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  <div className="sticky top-0 z-10 bg-white dark:bg-bg-darker p-3 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Cari nama / SKU produk..." 
                        value={searchProd}
                        onChange={(e) => setSearchProd(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-bg-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-gold text-gray-900 dark:text-white"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="p-1">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">Produk tidak ditemukan</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <div 
                          key={p.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            productId === p.id 
                              ? 'bg-accent-gold/10 border border-accent-gold/20' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                          }`}
                          onClick={() => { 
                            setProductId(p.id); 
                            setIsDropdownOpen(false); 
                            setSearchProd('');
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            {getImageUrl(p.image_url) ? (
                              <img 
                                src={getImageUrl(p.image_url)} 
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                                onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                              />
                            ) : null}
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-bg-dark border border-gray-300 dark:border-gray-700 items-center justify-center" style={{display: getImageUrl(p.image_url) ? 'none' : 'flex'}}>
                              <Package size={20} className="text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{p.sku}</span>
                              <span className="text-[11px] text-gray-500">• Stok: <span className="font-bold text-accent-gold">{p.stock}</span></span>
                            </div>
                          </div>
                          {productId === p.id && (
                            <div className="pr-2 text-accent-gold">
                              <Check size={18} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Backdrop for closing dropdown when clicking outside */}
            {isDropdownOpen && (
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
            )}

            {selectedProduct && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Stok saat ini:{' '}
                <span className="font-bold text-accent-gold">{selectedProduct.stock} unit</span> |
                Harga beli: {formatRupiah(selectedProduct.buy_price)}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jumlah Tambah <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Masukkan jumlah..."
              className="input-field"
              required
            />
            {selectedProduct && quantity > 0 && (
              <p className="mt-1 text-xs text-green-500">
                Stok setelah tambah:{' '}
                <span className="font-bold">
                  {(selectedProduct.stock || 0) + parseInt(quantity || 0)} unit
                </span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembelian dari supplier A..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
              <Check size={16} />
              Stok berhasil ditambahkan!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button type="submit" disabled={loading || success} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Tambah Stok'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'products'
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [prodRes, stockRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/stockin`, { headers: getAuthHeaders() }),
      ]);

      // Handle 401 — token expired/invalid → redirect to login
      if (prodRes.status === 401 || stockRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }

      if (!prodRes.ok) throw new Error(`Gagal mengambil produk (${prodRes.status})`);
      if (!stockRes.ok) throw new Error(`Gagal mengambil stok (${stockRes.status})`);

      const prodData = await prodRes.json();
      const stockData = await stockRes.json();

      // /api/products returns { success: true, products: [...] }
      // /api/stockin returns an array directly
      const prodList = Array.isArray(prodData) ? prodData : (prodData.products || []);
      const stockList = Array.isArray(stockData) ? stockData : (stockData.data || []);

      setProducts(prodList);
      setStockHistory(stockList);
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError(err.message || 'Gagal memuat data. Coba refresh halaman.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockProducts = products.filter((p) => (p.stock || 0) < 10);
  const totalStockIn = stockHistory.reduce((sum, r) => sum + (r.quantity || 0), 0);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredHistory = stockHistory.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.product?.name?.toLowerCase().includes(q) || r.product?.sku?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/stockin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      await fetchData();
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-bg-dark">
      {/* ── Fetch Error Banner ───────────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span className="flex-1 text-sm font-medium">{fetchError}</span>
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
          >
            Coba lagi
          </button>
        </div>
      )}
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="text-accent-gold" size={32} />
            Manajemen Stok
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola persediaan makanan &amp; minuman
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Tambah Stok
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Archive}
          label="Total Produk"
          value={totalProducts}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Stok"
          value={totalStock.toLocaleString('id-ID')}
          sub="unit tersedia"
          color="bg-accent-gold"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Masuk"
          value={totalStockIn.toLocaleString('id-ID')}
          sub="unit (semua waktu)"
          color="bg-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Menipis"
          value={lowStockProducts.length}
          sub="produk < 10 unit"
          color={lowStockProducts.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
        />
      </div>

      {/* ── Low Stock Alert ─────────────────────────────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">Peringatan Stok Menipis!</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {lowStockProducts.map((p) => `${p.name} (${p.stock} sisa)`).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="card">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex gap-1 bg-gray-100 dark:bg-bg-darker rounded-xl p-1">
            {[
              { key: 'history', label: 'Riwayat Masuk', icon: ClipboardList },
              { key: 'products', label: 'Stok Produk', icon: Package },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-accent-gold text-black shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
        </div>

        {/* ── Tab: Riwayat Masuk ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-accent-gold" />
                Memuat riwayat stok...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat stok masuk</p>
                <p className="text-sm mt-1">Klik &quot;Tambah Stok&quot; untuk mulai mencatat</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700/30">
                      {['#', 'Produk', 'SKU', 'Jumlah', 'Catatan', 'Tanggal', ''].map((h) => (
                        <th
                          key={h}
                          className="text-left pb-3 px-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/20">
                    {filteredHistory.map((record, idx) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 dark:hover:bg-bg-darker/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                          {record.product?.name || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-gray-100 dark:bg-bg-darker text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                            {record.product?.sku || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                            <TrendingUp size={13} />+{record.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {record.notes || <span className="italic opacity-40">—</span>}
                        </td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          {deleteId === record.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(record.id)}
                                disabled={deleting}
                                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all disabled:opacity-50"
                              >
                                {deleting ? '...' : 'Ya'}
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="text-xs px-2 py-1 bg-gray-200 dark:bg-bg-darker text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 transition-all"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteId(record.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Hapus record"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 text-right mt-3">
                  Menampilkan {filteredHistory.length} record
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Stok Produk ─────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-accent-gold" />
                Memuat data produk...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700/30">
                      {['#', 'Produk', 'SKU', 'Harga Beli', 'Harga Jual', 'Stok', 'Status'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left pb-3 px-3 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/20">
                    {filteredProducts.map((p, idx) => {
                      const stock = p.stock || 0;
                      const isLow = stock < 10;
                      const isEmpty = stock === 0;
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 dark:hover:bg-bg-darker/50 transition-colors"
                        >
                          <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {getImageUrl(p.image_url) ? (
                                <img
                                  src={getImageUrl(p.image_url)}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                  onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                />
                              ) : null}
                              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-bg-darker items-center justify-center" style={{display: getImageUrl(p.image_url) ? 'none' : 'flex'}}>
                                <Package size={14} className="text-gray-400" />
                              </div>
                              {p.name}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-gray-100 dark:bg-bg-darker text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                              {p.sku}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                            {formatRupiah(p.buy_price)}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                            {formatRupiah(p.sell_price)}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                            {stock}
                          </td>
                          <td className="py-3 px-3">
                            {isEmpty ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                                Habis
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-medium">
                                Menipis
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                                Tersedia
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 text-right mt-3">
                  Menampilkan {filteredProducts.length} produk
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {showModal && (
        <AddStockModal
          products={products}
          onClose={() => setShowModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
