import React, { useState, useEffect } from 'react';
import { ChefHat, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { kitchenService } from '../services/api';
import { formatDateTime } from '../utils/helpers';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadKitchenOrders = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        kitchenService.getActive(),
        kitchenService.getStats(),
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCooking = async (orderId) => {
    try {
      await kitchenService.startCooking(orderId);
      loadKitchenOrders();
    } catch (error) {
      console.error('Error starting cooking:', error);
      alert('Gagal memulai pesanan');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await kitchenService.complete(orderId);
      loadKitchenOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Gagal menyelesaikan pesanan');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
          <ChefHat size={32} className="text-accent-gold" />
          Kitchen Display System
        </h1>
        <button
          onClick={loadKitchenOrders}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border-l-4 border-yellow-600">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Menunggu</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="card border-l-4 border-orange-600">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Sedang Masak</p>
            <p className="text-3xl font-bold text-orange-500">{stats.cooking}</p>
          </div>
          <div className="card border-l-4 border-accent-green">
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Siap Disajikan</p>
            <p className="text-3xl font-bold text-accent-green">{stats.ready}</p>
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-16">
            <CheckCircle size={48} className="mx-auto mb-4 text-accent-green" />
            <p className="text-xl font-bold text-accent-green">No Pending Orders!</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors">Semua pesanan sudah selesai</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="card border-l-4 border-accent-gold animate-slide-in"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-accent-gold">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Meja {order.table?.tableName || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Order masuk</p>
                  <p className="text-accent-gold">{formatDateTime(order.createdAt)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-100 dark:bg-bg-darker rounded-lg p-4 mb-4 transition-colors">
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white transition-colors">{item.productName}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic transition-colors">📝 {item.notes}</p>
                        )}
                      </div>
                      <span className="bg-accent-gold text-black px-3 py-1 rounded-full font-bold">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-amber-600/20 border border-amber-600/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-100">
                    <AlertCircle className="inline mr-2" size={16} />
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === 'pending' || order.status === 'confirmed' ? (
                  <button onClick={() => handleStartCooking(order.id)} className="flex-1 btn-primary text-sm">Start Cooking</button>
                ) : null}
                {order.status === 'cooking' ? (
                  <button onClick={() => handleComplete(order.id)} className="flex-1 btn-success text-sm bg-accent-green text-black font-bold">Mark Ready</button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
