import { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { PageLoader } from './components/Loader';

// Auth Pages
import Login from './pages/auth/Login';
// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import FarmersList from './pages/farmers/FarmersList';
import AddFarmer from './pages/farmers/AddFarmer';
import FarmerProfile from './pages/farmers/FarmerProfile';
import ProductsList from './pages/products/ProductsList';
import ProductDetail from './pages/products/ProductDetail';
import OrdersList from './pages/orders/OrdersList';
import Payments from './pages/payments/Payments';
import Settings from './pages/settings/Settings';

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Suspense fallback={<PageLoader fullScreen text="Loading AgriIndia Advisor..." />}>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="farmers" element={<FarmersList />} />
          <Route path="farmers/add" element={<AddFarmer />} />
          <Route path="farmers/:id" element={<FarmerProfile />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

