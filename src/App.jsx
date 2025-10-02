import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './hooks/useAuth';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './components/Auth/Login';

// Lazy loading des pages pour optimiser les performances
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Salons = lazy(() => import('./pages/Salons'));
const SalonDetail = lazy(() => import('./pages/SalonDetail'));
const KycVerification = lazy(() => import('./pages/KycVerification'));
const Users = lazy(() => import('./pages/Users'));
const Support = lazy(() => import('./pages/Support'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const PromoManagement = lazy(() => import('./pages/PromoManagement'));
const PromoManagementV2 = lazy(() => import('./pages/PromoManagementV2'));
const PaymentValidation = lazy(() => import('./pages/PaymentValidation'));
const CrashMonitoring = lazy(() => import('./pages/CrashMonitoring'));
const FirestoreMonitoring = lazy(() => import('./pages/FirestoreMonitoring'));

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

// Composant de chargement optimisé
function LoadingSpinner() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <div>Chargement...</div>
    </Box>
  );
}

// Composant de protection des routes
function ProtectedRoute({ children }) {
  const { user, loading, isAdminUser } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdminUser) {
    return <Login />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </AdminLayout>
  );
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
            path="/promos-global" 
            element={
              <ProtectedRoute>
                <PromoManagementV2 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <ProtectedRoute>
                <PaymentValidation />
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
          <Route 
            path="/firestore-monitoring" 
            element={
              <ProtectedRoute>
                <FirestoreMonitoring />
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
