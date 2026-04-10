import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt, Clock, MapPin, SearchX } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../context/store';

export default function CustomerHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Fetch orders for this specific customer
      const res = await api.get(`/orders?userId=${user?.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusTranslations = {
    'pending': { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
    'confirmed': { text: 'Diterima', color: 'bg-blue-100 text-blue-700' },
    'cooking': { text: 'Dimasak', color: 'bg-orange-100 text-orange-700' },
    'ready': { text: 'Siap', color: 'bg-green-100 text-green-700' },
    'served': { text: 'Disajikan', color: 'bg-teal-100 text-teal-700' },
    'completed': { text: 'Selesai', color: 'bg-gray-100 text-gray-700' },
    'cancelled': { text: 'Batal', color: 'bg-red-100 text-red-700' }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-black w-full">
      {/* Header */}
      <div className="px-4 py-6 bg-white dark:bg-bg-dark border-b border-gray-100 dark:border-gray-800 rounded-b-3xl shadow-sm z-10 sticky top-0 flex items-center justify-between">
        <button 
          onClick={() => navigate('/customer/menu')}
          className="p-2 bg-gray-100 dark:bg-bg-darker rounded-xl text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Riwayat Pesanan</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* History List */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 dark:bg-bg-dark flex justify-center items-center">
              <SearchX size={40} className="opacity-50" />
            </div>
            <p className="font-bold text-gray-500">Belum ada pesanan.</p>
            <p className="text-sm mt-2">Yuk pesan menu favoritmu sekarang!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {orders.map(order => {
              const statusInfo = statusTranslations[order.status] || { text: order.status, color: 'bg-gray-100 text-gray-700' };
              
              return (
                <div 
                  key={order.id}
                  onClick={() => navigate(`/customer/status/${order.id}`)}
                  className="bg-white dark:bg-bg-dark p-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Receipt size={16} className="text-accent-gold" /> {order.orderNumber}
                      </h3>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 space-x-1 rounded-lg ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  {order.table && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-bg-darker w-max px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      <MapPin size={12} className="text-accent-gold" /> {order.table.tableName}
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 dark:border-gray-800 pt-3 flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 font-medium">Total Pembayaran</p>
                    <p className="text-sm font-black text-accent-gold">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.totalAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
