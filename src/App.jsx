import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './hooks/useAuth';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './components/Auth/Login';

// Pages
import Dashboard from './pages/Dashboard';
import Salons from './pages/Salons';
import SalonDetail from './pages/SalonDetail';
import KycVerification from './pages/KycVerification';
import Users from './pages/Users';
import Support from './pages/Support';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PromoManagement from './pages/PromoManagement';
import CrashMonitoring from './pages/CrashMonitoring';

// Thème Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

// Composant de protection des routes
function ProtectedRoute({ children }) {
  const { user, loading, isAdminUser } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user || !isAdminUser) {
    return <Login />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/salons" 
            element={
              <ProtectedRoute>
                <Salons />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/salon/:salonId" 
            element={
              <ProtectedRoute>
                <SalonDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/promos" 
            element={
              <ProtectedRoute>
                <PromoManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kyc" 
            element={
              <ProtectedRoute>
                <KycVerification />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/support" 
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/crashes" 
            element={
              <ProtectedRoute>
                <CrashMonitoring />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      {/* Notifications toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
