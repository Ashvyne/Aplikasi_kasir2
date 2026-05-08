import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import TablesPage from './pages/TablesPage';
import KitchenPage from './pages/KitchenPage';
import MenuPage from './pages/MenuPage';
import ReportsPage from './pages/ReportsPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import StockPage from './pages/StockPage';
import UsersPage from './pages/UsersPage';
import AdminRegister from './pages/AdminRegister';

// Customer Pages
import CustomerLayout from './layouts/CustomerLayout';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerHistory from './pages/customer/CustomerHistory.jsx';
import CustomerCheckout from './pages/customer/CustomerCheckout';
import CustomerOrderStatus from './pages/customer/CustomerOrderStatus';

// Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Context
import { useAuth } from './hooks/useAuth';

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-bg-dark text-gray-900 dark:text-white transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect logic if role is not allowed
    if (user.role === 'customer') return <Navigate to="/customer/menu" replace />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
    if (user.role === 'cashier') return <Navigate to="/pos" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function CustomerRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/customer/login" replace />;
  }

  // Only customers can access customer-facing routes
  if (user && user.role !== 'customer') {
     return <Navigate to="/dashboard" replace />;
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        
        {/* Customer Public Routes */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />

        {/* Protected Customer Routes */}
        <Route path="/customer/menu" element={<CustomerRoute><CustomerMenu /></CustomerRoute>} />
        <Route path="/customer/history" element={<CustomerRoute><CustomerHistory /></CustomerRoute>} />
        <Route path="/customer/checkout" element={<CustomerRoute><CustomerCheckout /></CustomerRoute>} />
        <Route path="/customer/status/:id" element={<CustomerRoute><CustomerOrderStatus /></CustomerRoute>} />

        {/* Protected Staff Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'cashier']}><DashboardPage /></ProtectedRoute>
        } />
        
        <Route path="/pos" element={
          <ProtectedRoute allowedRoles={['admin', 'cashier']}><POSPage /></ProtectedRoute>
        } />
        
        <Route path="/tables" element={
          <ProtectedRoute allowedRoles={['admin', 'cashier']}><TablesPage /></ProtectedRoute>
        } />
        
        <Route path="/kitchen" element={
          <ProtectedRoute allowedRoles={['admin', 'kitchen']}><KitchenPage /></ProtectedRoute>
        } />
        
        <Route path="/menu/*" element={
          <ProtectedRoute allowedRoles={['admin']}><MenuPage /></ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>
        } />
        
        <Route path="/transactions" element={
          <ProtectedRoute allowedRoles={['admin', 'cashier']}><TransactionsPage /></ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>
        } />

        <Route path="/stock" element={
          <ProtectedRoute allowedRoles={['admin']}><StockPage /></ProtectedRoute>
        } />

        {/* Default Catch-All */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/customer" element={<Navigate to="/customer/login" replace />} />
      </Routes>
    </Router>
  );
}
