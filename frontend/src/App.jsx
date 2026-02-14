import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import LandingPage from './pages/LandingPage';
import ThreatMonitorBlog from './pages/ThreatMonitorBlog';
import LiveCameraFeedBlog from './pages/LiveCameraFeedBlog';
import FaceVerificationBlog from './pages/FaceVerificationBlog';
import ActivityLogBlog from './pages/ActivityLogBlog';
import QuickTransferPage from './pages/QuickTransferPage';
import BillPaymentsPage from './pages/BillPaymentsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import LoansCreditPage from './pages/LoansCreditPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import LinkedDevicesPage from './pages/LinkedDevicesPage';
import NotificationsPage from './pages/NotificationsPage';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirect to admin panel if user is admin and trying to access dashboard
  if (isAuthenticated && user?.role === 'admin' && location.pathname === '/dashboard') {
    return <Navigate to="/admin" />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="spinner"></div>;

  return isAuthenticated && user?.username === 'admin' ? children : <Navigate to="/dashboard" />;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.username === 'admin' ? "/admin" : "/dashboard"} />;
  }

  return children;
};


function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        {/* Security Blog Pages */}
        <Route
          path="/security/threat-monitor"
          element={
            <ProtectedRoute>
              <ThreatMonitorBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/live-camera"
          element={
            <ProtectedRoute>
              <LiveCameraFeedBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/face-verification"
          element={
            <ProtectedRoute>
              <FaceVerificationBlog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security/activity-log"
          element={
            <ProtectedRoute>
              <ActivityLogBlog />
            </ProtectedRoute>
          }
        />
        {/* Services Pages */}
        <Route
          path="/services/quick-transfer"
          element={
            <ProtectedRoute>
              <QuickTransferPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services/bill-payments"
          element={
            <ProtectedRoute>
              <BillPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services/transactions"
          element={
            <ProtectedRoute>
              <TransactionHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services/loans-credit"
          element={
            <ProtectedRoute>
              <LoansCreditPage />
            </ProtectedRoute>
          }
        />
        {/* Account Pages */}
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/security"
          element={
            <ProtectedRoute>
              <SecuritySettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/devices"
          element={
            <ProtectedRoute>
              <LinkedDevicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
