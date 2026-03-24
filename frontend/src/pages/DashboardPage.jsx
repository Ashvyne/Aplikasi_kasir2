import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryData, revenueRes, topItemsRes, recentOrdersRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getRevenueAnalytics('30days'),
        dashboardService.getTopSellingItems('30days', 5),
        dashboardService.getRecentOrders(5)
      ]);

      setSummary(summaryData.data || {});
      setRevenueData(revenueRes.data || []);
      setTopItems(topItemsRes.data || []);
      setRecentOrders(recentOrdersRes.data || []);
      setLowStockItems(summaryData.data?.lowStockItems || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card bg-red-900/20 border-red-400/30 p-6">
          <p className="text-red-400">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const today = summary?.today || { orders: 0, revenue: 0, itemsSold: 0 };
  const tables = summary?.tables || { total: 0, active: 0, available: 0, occupancyRate: '0%' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white transition-colors">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-primary px-6">
          Refresh
        </button>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orders Today */}
        <div className="card hover:border-accent-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Orders Today</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{today.orders || 0}</h3>
              <p className="text-accent-gold text-sm mt-2">+12% from yesterday</p>
            </div>
            <div className="p-3 bg-accent-gold/20 rounded-lg">
              <ShoppingCart className="text-accent-gold" size={28} />
            </div>
          </div>
        </div>

        {/* Revenue Today */}
        <div className="card hover:border-accent-green/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Revenue Today</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Rp {Number(today.revenue || 0).toLocaleString('id-ID')}</h3>
              <p className="text-accent-green text-sm mt-2">+8% from yesterday</p>
            </div>
            <div className="p-3 bg-accent-green/20 rounded-lg">
              <DollarSign className="text-accent-green" size={28} />
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="card hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Items Sold</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{today.itemsSold || 0}</h3>
              <p className="text-blue-400 text-sm mt-2">Average order value</p>
            </div>
            <div className="p-3 bg-blue-400/20 rounded-lg">
              <Package className="text-blue-400" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Tables */}
        <div className="card hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Active Tables</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{tables.active}/{tables.total}</h3>
              <p className="text-orange-400 text-sm mt-2">Currently occupied</p>
            </div>
            <div className="p-3 bg-orange-400/20 rounded-lg">
              <Users className="text-orange-400" size={28} />
            </div>
          </div>
        </div>

        {/* Available Tables */}
        <div className="card hover:border-accent-green/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Available Tables</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{tables.available}</h3>
              <p className="text-accent-green text-sm mt-2">Ready for guests</p>
            </div>
            <div className="p-3 bg-accent-green/20 rounded-lg">
              <CheckCircle className="text-accent-green" size={28} />
            </div>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="card hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 transition-colors">Occupancy Rate</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{tables.occupancyRate}</h3>
              <p className="text-purple-400 text-sm mt-2">Space utilization</p>
            </div>
            <div className="p-3 bg-purple-400/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Revenue Trend (Last 30 Days)</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#888' }}
                />
                <YAxis 
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff', 
                    border: '1px solid #FFD700',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                  formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#FFD700" 
                  dot={{ fill: '#FFD700', r: 4 }}
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Top Selling Items (30 Days)</h2>
          <div className="space-y-3">
            {topItems.length > 0 ? (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-bg-darker rounded-lg hover:bg-gray-100 dark:hover:bg-bg-darker/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
                      <span className="text-accent-gold text-xs font-bold">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium transition-colors">{item.productName}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs transition-colors">{item.totalQuantity} sold</p>
                    </div>
                  </div>
                  <p className="text-accent-gold font-bold">Rp {Number(item.totalRevenue || 0).toLocaleString('id-ID')}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No sales data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="card border-l-4 border-l-red-500">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors">
            <AlertTriangle size={20} className="text-red-500" />
            Low Stock Items
          </h2>
          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-400/20 transition-colors">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium text-sm transition-colors">{item.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs transition-colors">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-lg">{item.stock}</p>
                    <p className="text-gray-500 text-xs">units left</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">All items in stock</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors">
            <Clock size={20} className="text-accent-gold" />
            Recent Orders
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-bg-darker rounded-lg hover:bg-gray-100 dark:hover:bg-bg-darker/80 transition-colors">
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium text-sm transition-colors">{order.orderNumber}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs transition-colors">Table {order.table?.tableName || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent-gold font-bold">Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</p>
                    <p className={`text-xs font-medium mt-1 ${
                      order.status === 'completed' ? 'text-accent-green' :
                      order.status === 'pending' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
