import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../context/store';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Loader2, Wallet, Banknote, Edit3, MapPin } from 'lucide-react';
import { orderService, tableService } from '../../services/api';

export default function CustomerCheckout() {
  const { orderItems, getCartTotal, clearOrder } = useOrderStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Table selection state
  const [tables, setTables] = useState([]);
  const [orderType, setOrderType] = useState('dine_in'); // default dine in
  const [selectedTable, setSelectedTable] = useState('');

  // Scroll to top & fetch tables
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTables = async () => {
      try {
        const tablesRes = await tableService.getAll();
        const finalTables = tablesRes?.data?.tables || tablesRes?.data || tablesRes?.tables || tablesRes || [];
        setTables(finalTables);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      }
    };
    fetchTables();
  }, []);

  if (orderItems.length === 0) {
    navigate('/customer/menu');
    return null;
  }

  // Hitung surcharge (biaya meja) jika ada meja terpilih
  const selTable = tables.find(t => t.id === parseInt(selectedTable));
  const tableSurcharge = (orderType === 'dine_in' && selTable) ? (parseFloat(selTable.surchargeAmount) || 0) : 0;

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1; // 10%
  const total = subtotal + tax + tableSurcharge;

  const handleCheckout = async () => {
    if (orderType === 'dine_in' && !selectedTable) {
      setError('Silakan pilih meja Anda untuk Makan di Tempat.');
      return;
    }
    if (!paymentMethod) {
      setError('Silakan pilih metode pembayaran.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create the base Order
      const appendedNotes = paymentMethod === 'transfer' 
        ? `[BAYAR TRANSFER] ${notes}` 
        : `[BAYAR KASIR] ${notes}`;

      const res = await orderService.create({
        orderType: orderType,
        tableId: orderType === 'dine_in' ? selectedTable : null,
        customerName: user?.name || user?.username || 'Guest',
        notes: appendedNotes,
        userId: user?.id || 1
      });

      const orderId = res?.data?.id || res?.data?.orderNumber; // Fallback based on response
      const actualOrderId = res.data.id;

      if (!actualOrderId) {
        throw new Error("Gagal mendapatkan ID Pesanan");
      }

      // 2. Add each item to the order
      for (const item of orderItems) {
        await orderService.addItem(actualOrderId, {
          productId: item.productId || item.id,
          quantity: item.quantity,
          notes: ''
        });
      }

      // 3. Process Payment immediately if QRIS/Transfer
      if (paymentMethod === 'transfer') {
        await orderService.processPayment(actualOrderId, {
          paidAmount: total,      // Lunas sesuai tagihan
          paymentMethod: 'digital',
          keepActive: true        // Supaya tidak menghapus meja dan bisa dilanjut kitchen
        });
      }
      
      clearOrder();
      navigate(`/customer/status/${res.data.orderNumber}`);
      
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Network error, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-black p-4 md:p-6 pb-24 relative flex flex-col transition-colors duration-300">
      <button 
        onClick={() => navigate(-1)} 
        className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 flex items-center gap-2 font-bold w-max transition-colors"
      >
        <ArrowLeft size={20} /> Kembali
      </button>

      <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Ringkasan<br/>Pesanan ✨</h2>
      
      <div className="space-y-4 flex-1">
        {/* Items List */}
        <div className="space-y-3">
          {orderItems.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-bg-darker p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
              <div className="flex-1 pr-4">
                <p className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{item.name}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {item.quantity} × <span className="text-accent-gold">Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                </p>
              </div>
              <p className="font-black text-gray-900 dark:text-white text-right shrink-0">
                Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
        
        {/* Order Type & Table Selection */}
        <div className="mt-6">
          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <MapPin size={16} className="text-accent-gold" /> Lokasi Makan
          </label>
          <div className="flex bg-gray-100 dark:bg-bg-darker rounded-xl p-1.5 mb-4">
            <button 
              onClick={() => { setOrderType('dine_in'); setSelectedTable(''); }}
              className={`flex-1 py-2.5 px-4 text-sm rounded-lg font-bold transition-all ${orderType === 'dine_in' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >Dine In / Di Tempat</button>
            <button 
              onClick={() => setOrderType('take_away')}
              className={`flex-1 py-2.5 px-4 text-sm rounded-lg font-bold transition-all ${orderType === 'take_away' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >Bawa Pulang</button>
          </div>

          {orderType === 'dine_in' && (
            <div className="mb-4">
              <select 
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="w-full bg-white hover:bg-gray-50 focus:bg-white dark:bg-bg-dark dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-gold transition-all shadow-inner appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
              >
                <option value="" disabled>Pilih Nomor Meja Anda...</option>
                {tables.filter(t => t.status === 'available').map(table => (
                  <option key={table.id} value={table.id}>
                    {table.tableName} (Kap: {table.capacity} org){parseFloat(table.surchargeAmount) > 0 ? ` - Ada Tambahan Biaya VIP` : ''}
                  </option>
                ))}
                {tables.filter(t => t.status === 'available').length === 0 && (
                  <option value="" disabled>-- Maaf, Semua Meja Penuh / Tidak Tersedia --</option>
                )}
              </select>
              {tableSurcharge > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 ml-1 font-semibold flex items-center gap-1">
                  ⭐ Meja ini memiliki biaya tambahan / VIP: Rp {tableSurcharge.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="mt-6 p-5 bg-gray-50 dark:bg-bg-darker border border-gray-200 dark:border-gray-800 rounded-3xl space-y-3">
          <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-400">
            <span>Pajak (10%)</span>
            <span className="text-gray-900 dark:text-white">Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          {tableSurcharge > 0 && (
          <div className="flex justify-between text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            <span>Biaya Tambahan Meja</span>
            <span>Rp {tableSurcharge.toLocaleString('id-ID')}</span>
          </div>
          )}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-4" />
          <div className="flex justify-between items-end">
            <span className="font-bold text-gray-500 dark:text-gray-400">Total Bayar</span>
            <span className="font-black text-2xl text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-accent-gold dark:to-yellow-500">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8">
          <label className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <Edit3 size={16} className="text-accent-gold" /> Catatan Khusus
          </label>
          <textarea 
            placeholder="Misal: pedas luar biasa, tanpa bawang..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white dark:bg-bg-darker dark:hover:bg-gray-900 dark:focus:bg-bg-darker border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-accent-gold transition-all shadow-inner h-24 resize-none"
          />
        </div>

        {/* Payment Methods */}
        <div className="mt-8">
          <label className="block text-sm font-bold mb-4 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Pilih Metode Bayar
          </label>
          <div className="grid grid-cols-1 gap-3">
             <label className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-accent-gold bg-accent-gold/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-bg-dark'}`}>
              <div className="flex items-center h-5">
                <input type="radio" className="w-5 h-5 text-accent-gold bg-gray-100 border-gray-300 focus:ring-accent-gold dark:focus:ring-accent-gold dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
              </div>
              <div className="ml-4 flex items-center gap-4 w-full">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
                  <Wallet size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">QRIS / Transfer Bank</p>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">E-wallet atau Mobile Banking</p>
                </div>
              </div>
            </label>

            <label className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'pay_at_cashier' ? 'border-accent-gold bg-accent-gold/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-bg-dark'}`}>
              <div className="flex items-center h-5">
                <input type="radio" className="w-5 h-5 text-accent-gold bg-gray-100 border-gray-300 focus:ring-accent-gold dark:focus:ring-accent-gold dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" name="payment" value="pay_at_cashier" checked={paymentMethod === 'pay_at_cashier'} onChange={() => setPaymentMethod('pay_at_cashier')} />
              </div>
              <div className="ml-4 flex items-center gap-4 w-full">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-xl text-green-600 dark:text-green-400">
                  <Banknote size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">Bayar di Kasir</p>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Tunjukkan pesanan fisik</p>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Floating Checkout Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black dark:to-transparent z-50 md:max-w-xl md:mx-auto">
        <button 
          onClick={handleCheckout}
          disabled={loading || !paymentMethod}
          className="w-full bg-gray-900 hover:bg-black dark:bg-accent-gold dark:hover:bg-yellow-500 text-white dark:text-black font-black py-4 rounded-2xl shadow-xl dark:shadow-accent-gold/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mb-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Memproses...
            </>
          ) : (
            'Selesaikan & Pesan Sekarang'
          )}
        </button>
      </div>
    </div>
  );
}
