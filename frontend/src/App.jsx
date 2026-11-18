import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import VehiclesList from './pages/VehiclesList';
import AddVehicle from './pages/AddVehicle';
import VehicleDetails from './pages/VehicleDetails';
import AllDocuments from './pages/AllDocuments';
import AddDocument from './pages/AddDocument';
import ExpiryCalendar from './pages/ExpiryCalendar';
import NotificationCenter from './pages/NotificationCenter';
import RenewalHistory from './pages/RenewalHistory';
import UserSettings from './pages/UserSettings';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />

            {/* Authenticated Dashboard Pages */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehiclesList />} />
              <Route path="/vehicles/new" element={<AddVehicle />} />
              <Route path="/vehicles/:id" element={<VehicleDetails />} />
              <Route path="/documents" element={<AllDocuments />} />
              <Route path="/documents/new" element={<AddDocument />} />
              <Route path="/calendar" element={<ExpiryCalendar />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/renewals" element={<RenewalHistory />} />
              <Route path="/settings" element={<UserSettings />} />

              {/* Admin Protected Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
