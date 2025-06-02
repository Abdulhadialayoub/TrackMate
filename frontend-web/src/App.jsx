import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DevPanel from './components/DevPanel';
import CompanyList from './pages/CompanyList';
import RoleManager from './components/RoleManager';
import ManagerView from './components/ManagerView';
import ViewerPanel from './components/ViewerPanel';
import UserManagement from './components/UserManagement';
import CompanyLogs from './components/CompanyLogs';
import AppLayout from './components/layout/AppLayout';
import ComingSoon from './components/ComingSoon';
import RoleBasedRoute from './components/RoleBasedRoute';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Invoices from './components/Invoices';
import Messages from './components/Messages';
import UserProfile from './components/UserProfile';
import Settings from './components/Settings';
import { AppProvider, useAppContext } from './context/AppContext';
import Notifications from './components/common/Notifications';
import Categories from './components/Categories';
import OrderAIAnalysis from './components/OrderAIAnalysis';
import OrdersAIAnalysis from './components/OrdersAIAnalysis';
import LandingPage from './pages/LandingPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0284c7', // This matches Tailwind's primary-600
      light: '#38bdf8', // primary-400
      dark: '#0369a1', // primary-700
      lighter: '#e0f2fe', // primary-100
    },
    secondary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8', // indigo-400
      dark: '#4f46e5', // indigo-600
      lighter: '#e0e7ff', // indigo-100
    },
    success: {
      main: '#10b981', // emerald-500
      light: '#34d399', // emerald-400
      dark: '#059669', // emerald-600
      lighter: '#d1fae5', // emerald-100
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
      lighter: '#fef3c7', // amber-100
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171', // red-400
      dark: '#dc2626', // red-600
      lighter: '#fee2e2', // red-100
    },
    background: {
      default: '#f9fafb', // gray-50
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#4b5563', // gray-600
      disabled: '#9ca3af', // gray-400
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  console.log("PrivateRoute Check:", isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AppProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with AppLayout */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              {/* Common routes accessible to all authenticated users */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/manager-view" element={<ManagerView />} />
              <Route path="/viewer-panel" element={<ViewerPanel />} />
              <Route path="/companies" element={<CompanyList />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/activity-logs" element={<CompanyLogs />} />
              
              {/* Business module pages */}
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/categories" element={<Categories />} />
              
              {/* AI Analysis routes */}
              <Route path="/order-analysis/:orderId" element={<OrderAIAnalysis />} />
              <Route path="/orders-analysis" element={<OrdersAIAnalysis />} />
              
              {/* Dev-only routes */}
              <Route element={<RoleBasedRoute allowedRoles={['Dev']} />}>
                <Route path="/dev-panel" element={<DevPanel />} />
                <Route path="/role-manager" element={<RoleManager />} />
              </Route>
            </Route>

            {/* Catch-all or Not Found Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Notifications />
        </Router>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;
