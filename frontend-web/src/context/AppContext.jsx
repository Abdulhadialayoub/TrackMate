import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const authStatus = await authService.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          const role = authService.getUserRole();
          setUserRole(role);
          
          const userData = await authService.getCurrentUser();
          if (userData.success) {
            setUser(userData.data);
            setCompanyId(userData.data.companyId);
            localStorage.setItem('company_id', userData.data.companyId);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      
      // Check if login was successful AND data is present
      if (result.success && result.data?.user) { 
        // Set user info in state
        setIsAuthenticated(true);
        setUser(result.data.user);
        setUserRole(result.data.user.role);
        setCompanyId(result.data.user.companyId);
        
        // Store important user info in localStorage
        localStorage.setItem('company_id', result.data.user.companyId);
        localStorage.setItem('user_role', result.data.user.role);
        
        // Store fullname
        if (result.data.user.firstName || result.data.user.lastName) {
          const fullName = `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim();
          localStorage.setItem('fullname', fullName);
        } else if (result.data.user.fullName) {
          localStorage.setItem('fullname', result.data.user.fullName);
        }
        
        // Store user name consistently
        const userName = result.data.user.name || 
          result.data.user.fullName || 
          `${result.data.user.firstName || ''} ${result.data.user.lastName || ''}`.trim() || 
          result.data.user.username || 
          result.data.user.email;
          
        localStorage.setItem('user_name', userName);
        
        console.log('AppContext: Stored user info:', { 
          userName,
          fullName: localStorage.getItem('fullname'),
          role: result.data.user.role,
          companyId: result.data.user.companyId
        });
        
        return { success: true };
      } else {
        // Login failed (e.g., 401 Unauthorized or other issue reported by authService)
        setIsAuthenticated(false); // Ensure state is false
        setUser(null);
        setUserRole('');
        setCompanyId(null);
        localStorage.removeItem('company_id'); // Clean up potential stale data
        localStorage.removeItem('token'); // Remove token if login failed
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('fullname');
        return { success: false, message: result.message || 'Invalid credentials or error' };
      }
    } catch (error) {
      console.error('Login error in AppContext:', error);
      // Ensure state is cleaned up on unexpected errors too
      setIsAuthenticated(false);
      setUser(null);
      setUserRole('');
      setCompanyId(null);
      localStorage.removeItem('company_id');
      localStorage.removeItem('token'); 
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('fullname');
      return { success: false, message: 'An unexpected error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setUserRole('');
      setCompanyId(null);
      // Clear all user data from storage
      localStorage.removeItem('company_id');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('username');
      localStorage.removeItem('fullname');
      localStorage.removeItem('user_email');
      setLoading(false);
    }
  };

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, ...notification }]);
    
    // Auto-remove notification after timeout
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }
    
    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    localStorage.setItem('darkMode', !darkMode);
  };

  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    userRole,
    loading,
    companyId,
    notifications,
    darkMode,
    login,
    logout,
    addNotification,
    removeNotification,
    toggleDarkMode
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
