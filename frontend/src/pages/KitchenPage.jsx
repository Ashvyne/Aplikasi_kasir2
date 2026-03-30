import React, { useState, useEffect } from 'react';
import { ChefHat, AlertCircle, CheckCircle, Clock, Play, Check, RefreshCcw, Timer } from 'lucide-react';
import { kitchenService } from '../services/api';
import { formatTime } from '../utils/helpers';
import Swal from 'sweetalert2';

const OrderCard = ({ order, onStart, onComplete }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 60000));
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 10000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const isUrgent = elapsed >= 15;
  const isPending = order.status === 'pending' || order.status === 'confirmed';
  const isCooking = order.status === 'cooking';

  return (
    <div className={`relative bg-white dark:bg-bg-dark border-l-[12px] rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-[1.01] ${
      isUrgent ? 'border-red-500 shadow-red-500/10' : 
      isCooking ? 'border-orange-500 animate-pulse-slow shadow-orange-500/10' : 
      'border-accent-gold shadow-accent-gold/10'
    }`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-black text-gray-900 dark:text-white transition-colors">{order.orderNumber}</span>
              {isUrgent && <span className="flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">URGENT</span>}
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold transition-colors">📍 Meja: {order.table?.tableName || 'TA'}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-mono text-sm mb-1 transition-colors">
              <Timer size={14} />
              <span>{elapsed} min</span>
            </div>
            <p className="text-xs text-gray-400 transition-colors uppercase tracking-widest font-bold">{formatTime(order.createdAt)}</p>
          </div>
        </div>

        {/* Dash Separator */}
        <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-800 my-4"></div>

        <div className="space-y-3 mb-6">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-bg-darker text-gray-900 dark:text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border border-gray-200 dark:border-gray-700 transition-colors">
                {item.quantity}
              </div>
              <div className="flex-1 pt-1">
                <p className="font-bold text-gray-900 dark:text-white leading-tight transition-colors">{item.productName}</p>
                {item.notes && (
                  <p className="text-xs text-orange-500 font-medium mt-0.5">Note: {item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-3 mb-6 transition-colors">
            <p className="text-xs text-orange-700 dark:text-orange-400 font-bold flex items-center gap-2">
              <AlertCircle size={14} /> Special Request:
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-300 ml-5">{order.notes}</p>
          </div>
        )}

        <div className="flex gap-3">
          {isPending && (
            <button 
              onClick={() => onStart(order.id)} 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              <Play size={20} fill="currentColor" /> MULAI MASAK
            </button>
          )}
          {isCooking && (
            <button 
              onClick={() => onComplete(order.id)} 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-all active:scale-95"
            >
              <Check size={24} strokeWidth={4} /> SIAP SAJI
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 10000);
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clock);
    };
  }, []);

  const loadKitchenOrders = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        kitchenService.getActive(),
        kitchenService.getStats(),
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    }
  };

  const handleStartCooking = async (orderId) => {
    try {
      await kitchenService.startCooking(orderId);
      loadKitchenOrders();
    } catch (error) {
      Swal.fire('Error', 'Gagal memulai pesanan', 'error');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await kitchenService.complete(orderId);
      loadKitchenOrders();
    } catch (error) {
      Swal.fire('Error', 'Gagal menyelesaikan pesanan', 'error');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-bg-darker min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-accent-gold p-3 rounded-2xl shadow-glow">
            <ChefHat size={32} className="text-black" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white transition-colors">DAPUR POS</h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold transition-colors uppercase tracking-[0.2em] text-xs">Kitchen Display System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-3xl font-mono font-black text-accent-gold">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase transition-colors">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={loadKitchenOrders} className="p-4 bg-white dark:bg-bg-dark text-gray-900 dark:text-white rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:rotate-180 transition-all duration-500">
            <RefreshCcw size={24} />
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/10 p-3 rounded-2xl text-yellow-500"><Clock size={24} /></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Menunggu</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white transition-colors">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500/10 p-3 rounded-2xl text-orange-500"><Play size={24} /></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sedang Masak</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white transition-colors">{stats.cooking}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-2xl text-green-500"><CheckCircle size={24} /></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Siap Saji</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white transition-colors">{stats.ready}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-glow">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white transition-colors">SEMUA PESANAN SELESAI!</h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold transition-colors">Dapur bersih, koki senang.</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onStart={handleStartCooking} 
              onComplete={handleComplete} 
            />
          ))
        )}
      </div>
    </div>
  );
}
