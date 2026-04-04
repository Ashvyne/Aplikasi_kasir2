import React, { useState, useEffect } from 'react';
import { FileText, Eye, Search, Filter, Calendar, MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { orderService } from '../services/api';
import { formatCurrency, getOrderStatusColor, getOrderStatusLabel } from '../utils/helpers';
import Receipt from '../components/Receipt';

export default function TransactionsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAll({ limit: 100 });
      setOrders(res.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleViewReceipt = async (orderId) => {
    try {
      const res = await orderService.getById(orderId);
      setSelectedOrder(res.data);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error fetching order for receipt:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
            <FileText className="text-accent-gold" /> Riwayat Transaksi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Daftar semua transaksi yang telah diproses di POS.</p>
        </div>
        
        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-gold transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Order # atau Nama..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-all dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 transition-colors uppercase text-[10px] tracking-wider font-black">
                  <th className="py-4 px-4 font-black">Waktu / No. Order</th>
                  <th className="py-4 px-4 font-black">Pelanggan / Meja</th>
                  <th className="py-4 px-4 font-black">Metode</th>
                  <th className="py-4 px-4 font-black">Total</th>
                  <th className="py-4 px-4 font-black">Status</th>
                  <th className="py-4 px-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 dark:text-gray-300">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-gray-400 font-bold italic">
                      Tidak ada riwayat transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-black text-gray-900 dark:text-white">{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {order.orderType === 'dine_in' ? (
                          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-orange-400" /> {order.table?.tableName || 'Meja'}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Smartphone size={12} className="text-blue-400" /> Takeaway</span>
                        )}
                        {order.customerName && <p className="text-[10px] opacity-60 font-normal mt-0.5">{order.customerName}</p>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {order.paymentMethod === 'cash' ? <Banknote size={14} className="text-green-500" /> : 
                           order.paymentMethod === 'card' ? <CreditCard size={14} className="text-blue-500" /> : 
                           <Smartphone size={14} className="text-purple-500" />}
                          <span className="uppercase text-[10px] font-black bg-gray-100 dark:bg-bg-darker px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                            {order.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-black text-accent-gold text-base">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase text-white ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleViewReceipt(order.id)}
                          className="bg-accent-gold hover:bg-yellow-400 text-black p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-2 ml-auto shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                          <Eye size={16} /> <span className="hidden sm:inline">LIHAT STRUK</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Preview */}
      {showReceipt && selectedOrder && (
        <Receipt 
          order={selectedOrder} 
          onClose={() => {
            setShowReceipt(false);
            setSelectedOrder(null);
          }} 
        />
      )}
    </div>
  );
}
