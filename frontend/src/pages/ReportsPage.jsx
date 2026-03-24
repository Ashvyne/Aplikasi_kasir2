import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Users, Package, PieChart as PieChartIcon, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = ['#FFD700', '#00C49F', '#FF8042', '#0088FE', '#AF19FF', '#FF19A3'];

export default function ReportsPage() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState('30days');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [revenueData, setRevenueData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [orderTypeData, setOrderTypeData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [revRes, payRes, typeRes, itemsRes, custRes] = await Promise.all([
        dashboardService.getRevenueAnalytics(period),
        dashboardService.getPaymentDistribution(period),
        dashboardService.getOrderTypeDistribution(period),
        dashboardService.getTopSellingItems(period, 10),
        dashboardService.getCustomerStats(period)
      ]);

      setRevenueData(revRes.data || []);
      setPaymentData(payRes.data || []);
      setOrderTypeData(typeRes.data || []);
      setTopItems(itemsRes.data || []);
      setCustomerStats(custRes.data || null);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + parseInt(item.count || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
            <BarChart3 className="text-accent-gold" /> Reports & Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">Wawasan bisnis dan performa penjualan Anda.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-200 dark:bg-darker p-1 rounded-lg transition-colors">
          {['7days', '30days', '90days', 'yearly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md transition-all text-sm font-semibold ${
                period === p ? 'bg-accent-gold text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {p === '7days' ? '7 Hari' : p === '30days' ? '30 Hari' : p === '90days' ? '3 Bulan' : '1 Tahun'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-accent-gold">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-colors">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-2 bg-accent-gold/20 rounded-lg"><DollarSign className="text-accent-gold" size={20} /></div>
              </div>
            </div>
            <div className="card border-l-4 border-accent-green">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Total Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-colors">{totalOrders}</p>
                </div>
                <div className="p-2 bg-accent-green/20 rounded-lg"><TrendingUp className="text-accent-green" size={20} /></div>
              </div>
            </div>
            <div className="card border-l-4 border-blue-400">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Rata-rata Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-colors">
                    {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : 'Rp 0'}
                  </p>
                </div>
                <div className="p-2 bg-blue-400/20 rounded-lg"><Package className="text-blue-400" size={20} /></div>
              </div>
            </div>
            <div className="card border-l-4 border-purple-400">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors">Pelanggan Unik</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 transition-colors">{customerStats?.totalCustomers || 0}</p>
                </div>
                <div className="p-2 bg-purple-400/20 rounded-lg"><Users className="text-purple-400" size={20} /></div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Line Chart */}
            <div className="card lg:col-span-2">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white transition-colors"><TrendingUp size={18} className="text-accent-gold"/> Tren Pendapatan</h2>
              {revenueData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(tick) => tick.substring(5)} />
                      <YAxis stroke="#888" fontSize={12} tickFormatter={(tick) => `Rp${tick/1000}k`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
                          border: '1px solid #FFD700',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#000000'
                        }}
                        formatter={(val) => formatCurrency(val)}
                      />
                      <Line type="monotone" dataKey="total" stroke="#FFD700" strokeWidth={3} dot={{r:4, fill:'#FFD700'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">Tidak ada data untuk periode ini</div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white transition-colors"><PieChartIcon size={18} className="text-blue-400"/> Metode Pembayaran</h2>
              {paymentData.length > 0 ? (
                <div className="h-72 w-full flex flex-col">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="paymentMethod"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
                          border: '1px solid #FFD700',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#000000'
                        }}
                        formatter={(val) => formatCurrency(val)} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 flex flex-col justify-end gap-1 px-4">
                    {paymentData.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-sm text-gray-900 dark:text-white transition-colors">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                          {entry.paymentMethod?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        <span className="font-bold">{((entry.total / totalRevenue) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">Tidak ada data pembayaran</div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white transition-colors"><Package size={18} className="text-accent-green"/> Produk Terlaris</h2>
              {topItems.length > 0 ? (
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#e5e7eb'} horizontal={true} vertical={false}/>
                      <XAxis type="number" stroke="#888" fontSize={12} />
                      <YAxis dataKey="productName" type="category" stroke="#888" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
                          border: '1px solid #FFD700',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#ffffff' : '#000000'
                        }}
                        formatter={(val, name) => [val, name === 'totalQuantity' ? 'Terjual' : 'Pendapatan']}
                      />
                      <Bar dataKey="totalQuantity" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">Tidak ada penjualan</div>
              )}
            </div>

            {/* Order Type Distribution */}
            <div className="card flex flex-col text-sm border-l-4 border-orange-400">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white transition-colors"><MapPin size={18} className="text-orange-400"/> Tipe Pesanan</h2>
               {orderTypeData.length > 0 ? (
                 <div className="flex-1 space-y-4">
                   {orderTypeData.map((entry, idx) => (
                     <div key={idx} className="bg-gray-100 dark:bg-bg-darker p-4 rounded-lg flex items-center justify-between border border-gray-200 dark:border-gray-800 transition-colors">
                       <div>
                         <p className="font-bold text-gray-900 dark:text-white transition-colors text-base">
                           {entry.orderType === 'dine_in' ? 'Dine In (Makan di Tempat)' : 'Takeaway (Bawa Pulang)'}
                         </p>
                         <p className="text-gray-600 dark:text-gray-400 transition-colors">{entry.count} pesanan</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-accent-gold text-lg">{formatCurrency(entry.total)}</p>
                         <span className="text-green-500 dark:text-green-400 font-semibold transition-colors">{((entry.total / totalRevenue)*100).toFixed(1)}%</span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">Tidak ada data tipe pesanan</div>
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
