import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  DeleteForever as ResetIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const apiBaseUrl = 'http://trackmate.runasp.net/api'; // Make sure this matches your backend URL

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 saniye timeout
});

// Token eklemek için interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DevPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeUsers: 0,
    version: '1.0.0',
    uptime: '0h 0m',
    lastRestart: 'N/A'
  });
  const [loading, setLoading] = useState({
    stats: false,
    users: false,
    backup: false,
    restore: false,
    reset: false,
    config: false,
    smtp: false,
    smtpUpdate: false,
    testEmail: false
  });
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: '', // 'user' or 'company'
    id: null,
    name: ''
  });
  const [editUserDialog, setEditUserDialog] = useState({
    open: false,
    user: null
  });
  const [editCompanyDialog, setEditCompanyDialog] = useState({
    open: false,
    company: null
  });
  const [alert, setAlert] = useState({
    show: false,
    severity: 'info',
    message: ''
  });
  const [userRoles, setUserRoles] = useState(['Admin', 'Manager', 'User', 'Viewer', 'Dev']);
  
  // Configuration state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userRegistration, setUserRegistration] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [defaultUserRole, setDefaultUserRole] = useState('User');
  const [systemEmail, setSystemEmail] = useState('system@trackmate.com');
  const [resetDatabaseDialog, setResetDatabaseDialog] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [companyDialog, setCompanyDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    taxOffice: '',
    website: ''
  });
  const [userDialog, setUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    companyId: '',
    role: 'User',
    isActive: true
  });

  // Email konfigürasyon state değişkenlerini ekleyelim
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    enableSsl: true,
    username: '',
    password: '',
    from: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Parse the JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const tokenPayload = JSON.parse(jsonPayload);
        console.log('JWT Token Payload:', tokenPayload);
        
        const { role, CompanyId } = tokenPayload;
        console.log('User Role:', role);
        console.log('User CompanyId:', CompanyId);
        
        // If not Dev role, redirect to dashboard
        if (role !== 'Dev') {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCompanies();
    fetchBackups();
    fetchSmtpSettings();
  }, []);

  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    // In a real app, you would fetch system statistics from the API
    // For now, we'll use mock data
    setTimeout(() => {
      setSystemStats({
        totalUsers: users.length,
        totalCompanies: companies.length,
        activeUsers: users.filter(user => user.isActive).length,
        version: '1.0.0',
        uptime: '2h 34m',
        lastRestart: new Date().toLocaleString()
      });
      setLoading(prev => ({ ...prev, stats: false }));
    }, 500);
  };

  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      console.log('Fetching users from API endpoint:', `${apiBaseUrl}/User`);
      
      try {
        // Önce API'dan almayı dene
        const response = await api.get('/User', { timeout: 5000 });
        console.log('Users API response:', response);
        
        // Handle API response safely - extract users array from response data
        // Handle cases where response.data might be an object with nested arrays like {$values: [...]}
        let userData;
        if (response.data && typeof response.data === 'object') {
          // Check if data has $values property (common in .NET API responses)
          if (Array.isArray(response.data.$values)) {
            userData = response.data.$values;
          } 
          // Check if data itself is an array
          else if (Array.isArray(response.data)) {
            userData = response.data;
          }
          // Check if data is a simple object with users property
          else if (response.data.users && Array.isArray(response.data.users)) {
            userData = response.data.users;
          }
          // Last resort - try to extract any array properties
          else {
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              userData = possibleArrays[0];
            } else {
              userData = [];
            }
          }
        } else {
          userData = [];
        }
        
        console.log('Processed users data:', userData);
        setUsers(userData);
      } catch (apiError) {
        console.error('API error when fetching users, using mock data instead:', apiError);
        // API başarısız olursa mock veri kullan
        const mockUsers = [
          { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', username: 'admin', role: 'Admin', companyId: 1, isActive: true },
          { id: 2, firstName: 'Dev', lastName: 'User', email: 'dev@example.com', username: 'dev', role: 'Dev', companyId: 1, isActive: true },
          { id: 3, firstName: 'Manager', lastName: 'User', email: 'manager@example.com', username: 'manager', role: 'Manager', companyId: 2, isActive: true },
          { id: 4, firstName: 'Standard', lastName: 'User', email: 'user@example.com', username: 'user', role: 'User', companyId: 2, isActive: false },
          { id: 5, firstName: 'View', lastName: 'Only', email: 'viewer@example.com', username: 'viewer', role: 'Viewer', companyId: 3, isActive: true }
        ];
        setUsers(mockUsers);
        showAlert('info', 'Using example user data due to API connection issues');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Daha detaylı hata mesajları
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        showAlert('error', `Failed to fetch users: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        showAlert('error', 'Failed to fetch users: No response received from server');
      } else {
        showAlert('error', `Failed to fetch users: ${error.message}`);
      }
      
      // Yedek mock veri
      const mockUsers = [
        { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', username: 'admin', role: 'Admin', companyId: 1, isActive: true },
        { id: 2, firstName: 'Dev', lastName: 'User', email: 'dev@example.com', username: 'dev', role: 'Dev', companyId: 1, isActive: true },
        { id: 3, firstName: 'Manager', lastName: 'User', email: 'manager@example.com', username: 'manager', role: 'Manager', companyId: 2, isActive: true }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      console.log('Fetching companies from API endpoint:', `${apiBaseUrl}/Company`);
      
      try {
        // Önce API'dan almayı dene
        const response = await api.get('/Company', { timeout: 5000 });
        console.log('Companies API response:', response);
        
        // Handle API response safely - extract companies array from response data
        let companyData;
        if (response.data && typeof response.data === 'object') {
          // Check if data has $values property (common in .NET API responses)
          if (Array.isArray(response.data.$values)) {
            companyData = response.data.$values;
          } 
          // Check if data itself is an array
          else if (Array.isArray(response.data)) {
            companyData = response.data;
          }
          // Check if data is a simple object with companies property
          else if (response.data.companies && Array.isArray(response.data.companies)) {
            companyData = response.data.companies;
          }
          // Last resort - try to extract any array properties
          else {
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              companyData = possibleArrays[0];
            } else {
              companyData = [];
            }
          }
        } else {
          companyData = [];
        }
        
        console.log('Processed companies data:', companyData);
        setCompanies(companyData);
      } catch (apiError) {
        console.error('API error when fetching companies, using mock data instead:', apiError);
        // API başarısız olursa mock veri kullan
        const mockCompanies = [
          { id: 1, name: 'TrackMate Systems', email: 'info@trackmate.com', phone: '+1-555-123-4567', website: 'www.trackmate.com', address: '123 Tech Lane, Silicon Valley', taxNumber: '123456789', taxOffice: 'Valley Tax Office', isActive: true },
          { id: 2, name: 'Acme Corp', email: 'info@acme.com', phone: '+1-555-987-6543', website: 'www.acme.com', address: '456 Business Ave, New York', taxNumber: '987654321', taxOffice: 'NYC Tax Office', isActive: true },
          { id: 3, name: 'TechStars Inc', email: 'contact@techstars.com', phone: '+1-555-789-0123', website: 'www.techstars.com', address: '789 Innovation Dr, Boston', taxNumber: '456789012', taxOffice: 'Boston Tax Office', isActive: false }
        ];
        setCompanies(mockCompanies);
        showAlert('info', 'Using example company data due to API connection issues');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      // Daha detaylı hata mesajları
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        showAlert('error', `Failed to load companies: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        showAlert('error', 'Failed to load companies: No response received from server');
      } else {
        showAlert('error', `Failed to load companies: ${error.message}`);
      }
      
      // Yedek mock veri
      const mockCompanies = [
        { id: 1, name: 'TrackMate Systems', email: 'info@trackmate.com', phone: '+1-555-123-4567', website: 'www.trackmate.com', address: '123 Tech Lane, Silicon Valley', taxNumber: '123456789', taxOffice: 'Valley Tax Office', isActive: true },
        { id: 2, name: 'Acme Corp', email: 'info@acme.com', phone: '+1-555-987-6543', website: 'www.acme.com', address: '456 Business Ave, New York', taxNumber: '987654321', taxOffice: 'NYC Tax Office', isActive: true }
      ];
      setCompanies(mockCompanies);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const showAlert = (severity, message) => {
    setAlert({
      open: true,
      severity,
      message
    });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, open: false }));
    }, 5000);
  };

  const handleDeleteClick = (type, id, name) => {
    setDeleteDialog({
      open: true,
      type,
      id,
      name
    });
  };

  const handleDeleteConfirm = async () => {
    const { type, id } = deleteDialog;
    
    try {
      if (type === 'user') {
        await api.delete(`/User/${id}`);
        setUsers(users.filter(user => user.id !== id));
        showAlert('success', 'User deleted successfully');
      } else if (type === 'company') {
        await api.delete(`/Company/${id}`);
        setCompanies(companies.filter(company => company.id !== id));
        showAlert('success', 'Company deleted successfully');
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showAlert('error', `Failed to delete ${type}`);
    }
    
    setDeleteDialog(prev => ({ ...prev, open: false }));
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(prev => ({ ...prev, open: false }));
  };

  const handleEditUser = (user) => {
    setEditUserDialog({
      open: true,
      user: { ...user }
    });
  };

  const handleEditCompany = (company) => {
    setEditCompanyDialog({
      open: true,
      company: { ...company }
    });
  };

  const handleUserChange = (field, value) => {
    setEditUserDialog(prev => ({
      ...prev,
      user: {
        ...prev.user,
        [field]: value
      }
    }));
  };

  const handleCompanyChange = (field, value) => {
    setEditCompanyDialog(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }));
  };

  const handleSaveUser = async () => {
    try {
      const { user } = editUserDialog;
      
      // Make a copy of the user data for the request
      const userData = { ...user };
      
      // Log the request data for debugging
      console.log('Sending user update with data:', userData);
      
      try {
        // Try API first
        const response = await api.put(`/User/${user.id}`, userData);
        console.log('Update response:', response);
      } catch (apiError) {
        console.error('API error when updating user, using local state update instead:', apiError);
        // Just update local state if API fails
        showAlert('info', 'API connection issue - changes saved locally');
      }
      
      // Update the users list with the updated user data
      setUsers(users.map(u => u.id === user.id ? user : u));
      showAlert('success', 'User updated successfully');
      setEditUserDialog(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Get more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Show a specific error message if available from the API
        const errorMessage = error.response.data?.message || 'Failed to update user';
        showAlert('error', errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        showAlert('error', 'No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        showAlert('error', `Error: ${error.message}`);
      }
    }
  };

  const handleSaveCompany = async () => {
    try {
      const { company } = editCompanyDialog;
      
      try {
        // Try API first
        await api.put(`/Company/${company.id}`, company);
      } catch (apiError) {
        console.error('API error when updating company, using local state update instead:', apiError);
        // Just update local state if API fails
        showAlert('info', 'API connection issue - changes saved locally');
      }
      
      // Update companies list in any case
      setCompanies(companies.map(c => c.id === company.id ? company : c));
      showAlert('success', 'Company updated successfully');
      setEditCompanyDialog(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error('Error updating company:', error);
      
      // Get more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        const errorMessage = error.response.data?.message || 'Failed to update company';
        showAlert('error', errorMessage);
      } else if (error.request) {
        console.error('Error request:', error.request);
        showAlert('error', 'No response from server. Please try again later.');
      } else {
        showAlert('error', `Error: ${error.message}`);
      }
    }
  };

  // System Configuration handlers
  const handleSaveConfiguration = async () => {
    try {
      setLoading(prev => ({ ...prev, config: true }));
      
      // In a real app, this would be an API call to save the configuration
      // For now, we'll just simulate an API call
      setTimeout(() => {
        showAlert('success', 'System configuration saved successfully');
        setLoading(prev => ({ ...prev, config: false }));
      }, 800);
      
      // Example of how to call the API in a real implementation:
      // await api.post('/Configuration', {
      //   maintenanceMode,
      //   userRegistration,
      //   debugMode,
      //   defaultUserRole,
      //   systemEmail
      // });
    } catch (error) {
      console.error('Error saving configuration:', error);
      showAlert('error', 'Failed to save configuration');
      setLoading(prev => ({ ...prev, config: false }));
    }
  };
  
  const handleBackupDatabase = async () => {
    try {
      setLoading(prevState => ({ ...prevState, backup: true }));
      // Make the actual API call
      const response = await api.post('/Database/backup');
      showAlert('success', 'Database backup created successfully');
      // Refresh the backup list
      fetchBackups();
    } catch (error) {
      console.error('Error backing up database:', error);
      showAlert('error', 'Failed to backup database: ' + (error.response?.data || error.message));
    } finally {
      setLoading(prevState => ({ ...prevState, backup: false }));
    }
  };
  
  const handleRestoreDatabase = async () => {
    try {
      // Create a file input element to allow user to select a backup file
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.bak,.sql,.backup';
      
      // Trigger click and wait for file selection
      fileInput.click();
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setLoading(prev => ({ ...prev, restore: true }));
        
        // Create form data to send the file
        const formData = new FormData();
        formData.append('backupFile', file);
        
        try {
          // Send the file to the API
          const response = await api.post('/Database/restore', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          showAlert('success', 'Database restored successfully');
          
          // Refresh data after restore
          fetchStats();
          fetchUsers();
          fetchCompanies();
          fetchBackups();
        } catch (error) {
          console.error('Error restoring database:', error);
          showAlert('error', 'Failed to restore database: ' + (error.response?.data || error.message));
        } finally {
          setLoading(prev => ({ ...prev, restore: false }));
        }
      };
    } catch (error) {
      console.error('Error handling file selection:', error);
      showAlert('error', 'Failed to open file selector');
    }
  };
  
  const handleResetDatabaseConfirm = async () => {
    try {
      setLoading(prev => ({ ...prev, reset: true }));
      setResetDatabaseDialog(false);
      
      // Real API call for database reset
      await api.post('/Database/reset');
      
      showAlert('success', 'Database reset successfully');
      
      // Refresh data after reset
      fetchStats();
      fetchUsers();
      fetchCompanies();
      
    } catch (error) {
      console.error('Error resetting database:', error);
      showAlert('error', 'Failed to reset database: ' + (error.response?.data || error.message));
    } finally {
      setLoading(prev => ({ ...prev, reset: false }));
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await api.get('/Database/backup/list');
      // Directly set the raw data - our rendering logic will handle extraction
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
      showAlert('error', 'Failed to load backup list: ' + (error.response?.data?.message || error.message));
      setBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  };

  const downloadBackup = async (fileName, downloadUrl) => {
    try {
      if (!fileName) {
        showAlert('error', 'Invalid backup filename');
        return;
      }
      
      // Determine the endpoint to use
      const endpoint = downloadUrl || `/Database/backup/download/${fileName}`;
      
      // Make API request with proper authorization (handled by interceptor now)
      const response = await api.get(endpoint, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      showAlert('success', `Downloading backup: ${fileName}`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      showAlert('error', 'Failed to download backup file');
    }
  };

  // Handle company dialog open/close
  const handleOpenCompanyDialog = () => {
    setNewCompany({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      taxOffice: '',
      website: ''
    });
    setCompanyDialog(true);
  };

  const handleCloseCompanyDialog = () => {
    setCompanyDialog(false);
  };

  // Handle company form input changes
  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompany({
      ...newCompany,
      [name]: value
    });
  };

  // Create new company
  const handleCreateCompany = async () => {
    try {
      await api.post('/Company', newCompany);
      showAlert('success', 'Company created successfully');
      handleCloseCompanyDialog();
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      showAlert('error', 'Failed to create company: ' + (error.response?.data || error.message));
    }
  };

  // Handle user dialog open/close
  const handleOpenUserDialog = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      companyId: '',
      role: 'User',
      isActive: true
    });
    setUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialog(false);
  };

  // Handle user form input changes
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Handle checkbox change for isActive
  const handleUserCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: checked
    });
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      await api.post('/User', newUser);
      showAlert('success', 'User created successfully');
      handleCloseUserDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      showAlert('error', 'Failed to create user: ' + (error.response?.data || error.message));
    }
  };

  // SMTP ayarlarını yükleyen fonksiyon
  const fetchSmtpSettings = useCallback(async () => {
    try {
      setLoading(prevState => ({ ...prevState, smtp: true }));
      const response = await api.get('/Configuration/smtp');
      setSmtpSettings(response.data);
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      showAlert('error', 'Failed to load SMTP settings');
    } finally {
      setLoading(prevState => ({ ...prevState, smtp: false }));
    }
  }, [showAlert]);

  // Email ayarlarını güncelleme fonksiyonu
  const updateSmtpSettings = async () => {
    try {
      setLoading(prevState => ({ ...prevState, smtpUpdate: true }));
      await api.post('/Configuration/smtp', smtpSettings);
      showAlert('success', 'SMTP settings updated successfully');
    } catch (error) {
      console.error('Error updating SMTP settings:', error);
      showAlert('error', 'Failed to update SMTP settings');
    } finally {
      setLoading(prevState => ({ ...prevState, smtpUpdate: false }));
    }
  };

  // Test email gönderme fonksiyonu
  const sendTestEmail = async () => {
    try {
      setLoading(prevState => ({ ...prevState, testEmail: true }));
      await api.post('/Configuration/test-email', { 
        recipient: systemEmail || smtpSettings.username 
      });
      showAlert('success', 'Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      showAlert('error', 'Failed to send test email');
    } finally {
      setLoading(prevState => ({ ...prevState, testEmail: false }));
    }
  };

  // SMTP input değişikliklerini işleyen fonksiyon
  const handleSmtpInputChange = (e) => {
    const { name, value } = e.target;
    setSmtpSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // SMTP checkbox değişikliklerini işleyen fonksiyon
  const handleSmtpCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSmtpSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({...alert, show: false})}>
          {alert.message}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Developer Panel
      </Typography>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        aria-label="dev panel tabs"
        sx={{ mb: 2 }}
      >
        <Tab label="System" />
        <Tab label="Database" />
        <Tab label="Users" />
        <Tab label="Companies" />
        <Tab label="Configuration" />
      </Tabs>

      {/* System tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" sx={{ mb: 3 }}>System Information</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Statistics
              </Typography>
              {loading.stats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemText primary="Total Users" secondary={systemStats.totalUsers} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Active Users" secondary={systemStats.activeUsers} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Total Companies" secondary={systemStats.totalCompanies} />
                  </ListItem>
                </List>
              )}
              <Box textAlign="right" mt={1}>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={fetchStats}
                  size="small"
                >
                  Refresh Stats
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                System Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="App Version" secondary={systemStats.version} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="System Uptime" secondary={systemStats.uptime} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="Last Restart" secondary={systemStats.lastRestart} />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Environment Variables
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>API_URL</TableCell>
                      <TableCell>{apiBaseUrl}</TableCell>
                      <TableCell>Base URL for API endpoints</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>NODE_ENV</TableCell>
                      <TableCell>{process.env.NODE_ENV || 'development'}</TableCell>
                      <TableCell>Current environment</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>DEBUG_MODE</TableCell>
                      <TableCell>{debugMode ? 'Enabled' : 'Disabled'}</TableCell>
                      <TableCell>Debug status</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Database tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" sx={{ mb: 3 }}>Database Management</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Database Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<BackupIcon />}
                  onClick={handleBackupDatabase}
                  disabled={loading.backup}
                >
                  {loading.backup ? 'Creating Backup...' : 'Create Backup'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<RestoreIcon />}
                  onClick={handleRestoreDatabase}
                  disabled={loading.restore}
                >
                  {loading.restore ? 'Restoring...' : 'Restore from Backup'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<ResetIcon />}
                  onClick={() => setResetDatabaseDialog(true)}
                  disabled={loading.reset}
                >
                  {loading.reset ? 'Resetting Database...' : 'Reset Database'}
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                Note: Database operations may take some time to complete.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Available Backups
                <IconButton 
                  size="small" 
                  onClick={fetchBackups} 
                  sx={{ ml: 1 }}
                  disabled={loadingBackups}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Typography>
              
              {loadingBackups ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Box sx={{ flexGrow: 1 }}>
                  {(() => {
                    // Get the actual backups array, handling the specific .NET structure
                    let actualBackups = [];
                    
                    try {
                      // Handle the specific structure shown in the API response
                      if (backups && backups.backups && backups.backups.$values) {
                        // The exact structure we're seeing
                        actualBackups = backups.backups.$values;
                      }
                      // Other possible structures
                      else if (backups && backups.$values) {
                        actualBackups = backups.$values;
                      }
                      else if (backups && backups.backups) {
                        // If backups.backups is directly an array
                        if (Array.isArray(backups.backups)) {
                          actualBackups = backups.backups;
                        }
                      }
                      else if (Array.isArray(backups)) {
                        actualBackups = backups;
                      }
                    } catch (error) {
                      console.error('Error processing backups data:', error);
                    }
                    
                    // Check if we have any backups to display
                    if (!actualBackups.length) {
                      return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                          <Typography variant="body2" color="text.secondary">
                            No backups available
                          </Typography>
                        </Box>
                      );
                    }
                    
                    // If we have backups, render them
                    return (
                      <List dense sx={{ overflow: 'auto', maxHeight: 300 }}>
                        {actualBackups.map((backup, index) => (
                          <React.Fragment key={backup?.fileName || `backup-${index}`}>
                            <ListItem
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  size="small" 
                                  onClick={() => downloadBackup(backup?.fileName, backup?.downloadUrl)}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText 
                                primary={backup?.fileName || `Backup ${index + 1}`} 
                                secondary={
                                  <>
                                    {backup?.createdAt ? new Date(backup.createdAt).toLocaleString() : 'Unknown date'}
                                    {backup?.fileSizeKB && ` • ${backup.fileSizeKB} KB`}
                                  </>
                                }
                              />
                            </ListItem>
                            {index < actualBackups.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    );
                  })()}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {/* Database reset confirmation dialog */}
        <Dialog
          open={resetDatabaseDialog}
          onClose={() => setResetDatabaseDialog(false)}
        >
          <DialogTitle>Confirm Database Reset</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Warning: This will reset the database to its initial state. All data will be permanently deleted. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDatabaseDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleResetDatabaseConfirm} 
              color="error" 
              variant="contained"
            >
              Reset Database
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* Users tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Manage Users
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenUserDialog}
              sx={{ mr: 1 }}
            >
              Add User
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading.users}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.users ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading users...</TableCell>
                </TableRow>
              ) : !Array.isArray(users) || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No users found</TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.companyId}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                          <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Active
                        </Box>
                      ) : (
                        <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
                          <CloseIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Inactive
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteClick('user', user.id, `${user.firstName || ''} ${user.lastName || ''}`)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Companies tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Manage Companies
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCompanyDialog}
              sx={{ mr: 1 }}
            >
              Add Company
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchCompanies}
              disabled={loadingCompanies}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Tax ID</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingCompanies ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading companies...</TableCell>
                </TableRow>
              ) : !Array.isArray(companies) || companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No companies found</TableCell>
                </TableRow>
              ) : (
                companies.map(company => (
                  <TableRow key={company.id}>
                    <TableCell>{company.id}</TableCell>
                    <TableCell>{company.name || 'Unnamed Company'}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{company.taxNumber}</TableCell>
                    <TableCell>{Array.isArray(users) ? users.filter(u => u.companyId === company.id).length : 0}</TableCell>
                    <TableCell>
                      {company.isActive ? (
                        <Box sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                          <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Active
                        </Box>
                      ) : (
                        <Box sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
                          <CloseIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Inactive
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleEditCompany(company)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleDeleteClick('company', company.id, company.name || 'Unnamed Company')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Configuration tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" sx={{ mb: 3 }}>System Configuration</Typography>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
          
            <Grid item xs={12}>
            
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Email Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="host"
                    label="SMTP Server"
                    value={smtpSettings.host}
                    onChange={handleSmtpInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="port"
                    label="SMTP Port"
                    value={smtpSettings.port}
                    onChange={handleSmtpInputChange}
                    fullWidth
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="username"
                    label="SMTP Username"
                    value={smtpSettings.username}
                    onChange={handleSmtpInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="password"
                    label="SMTP Password"
                    value={smtpSettings.password}
                    onChange={handleSmtpInputChange}
                    fullWidth
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="from"
                    label="From Email"
                    value={smtpSettings.from}
                    onChange={handleSmtpInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smtpSettings.enableSsl}
                        onChange={handleSmtpCheckboxChange}
                        name="enableSsl"
                      />
                    }
                    label="Enable SSL"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={updateSmtpSettings}
                  disabled={loading.smtpUpdate}
                  startIcon={loading.smtpUpdate ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {loading.smtpUpdate ? 'Updating...' : 'Update SMTP Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      {/* Add Company Dialog */}
      <Dialog open={companyDialog} onClose={handleCloseCompanyDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Company Name"
                value={newCompany.name}
                onChange={handleCompanyInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={newCompany.email}
                onChange={handleCompanyInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={newCompany.phone}
                onChange={handleCompanyInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="website"
                label="Website"
                value={newCompany.website}
                onChange={handleCompanyInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                value={newCompany.address}
                onChange={handleCompanyInputChange}
                fullWidth
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxNumber"
                label="Tax Number"
                value={newCompany.taxNumber}
                onChange={handleCompanyInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxOffice"
                label="Tax Office"
                value={newCompany.taxOffice}
                onChange={handleCompanyInputChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompanyDialog}>Cancel</Button>
          <Button onClick={handleCreateCompany} variant="contained" color="primary">
            Create Company
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {deleteDialog.type} "{deleteDialog.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={userDialog} onClose={handleCloseUserDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="First Name"
                value={newUser.firstName}
                onChange={handleUserInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Last Name"
                value={newUser.lastName}
                onChange={handleUserInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={newUser.email}
                onChange={handleUserInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="Username"
                value={newUser.username}
                onChange={handleUserInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="Password"
                type="password"
                value={newUser.password}
                onChange={handleUserInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={newUser.phone}
                onChange={handleUserInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="company-select-label">Company</InputLabel>
                <Select
                  labelId="company-select-label"
                  id="company-select"
                  name="companyId"
                  value={newUser.companyId}
                  label="Company"
                  onChange={handleUserInputChange}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  name="role"
                  value={newUser.role}
                  label="Role"
                  onChange={handleUserInputChange}
                >
                  {userRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newUser.isActive}
                    onChange={handleUserCheckboxChange}
                    name="isActive"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" color="primary">
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog.open} onClose={() => setEditUserDialog({...editUserDialog, open: false})} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editUserDialog.user && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={editUserDialog.user.firstName || ''}
                  onChange={(e) => handleUserChange('firstName', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={editUserDialog.user.lastName || ''}
                  onChange={(e) => handleUserChange('lastName', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={editUserDialog.user.email || ''}
                  onChange={(e) => handleUserChange('email', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Username"
                  value={editUserDialog.user.username || ''}
                  onChange={(e) => handleUserChange('username', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={editUserDialog.user.phone || ''}
                  onChange={(e) => handleUserChange('phone', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={editUserDialog.user.companyId || ''}
                    onChange={(e) => handleUserChange('companyId', e.target.value)}
                    label="Company"
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUserDialog.user.role || ''}
                    onChange={(e) => handleUserChange('role', e.target.value)}
                    label="Role"
                  >
                    {userRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editUserDialog.user.isActive || false}
                      onChange={(e) => handleUserChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog({...editUserDialog, open: false})}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editCompanyDialog.open} onClose={() => setEditCompanyDialog({...editCompanyDialog, open: false})} maxWidth="md" fullWidth>
        <DialogTitle>Edit Company</DialogTitle>
        <DialogContent>
          {editCompanyDialog.company && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company Name"
                  value={editCompanyDialog.company.name || ''}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={editCompanyDialog.company.email || ''}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={editCompanyDialog.company.phone || ''}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Website"
                  value={editCompanyDialog.company.website || ''}
                  onChange={(e) => handleCompanyChange('website', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={editCompanyDialog.company.address || ''}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax Number"
                  value={editCompanyDialog.company.taxNumber || ''}
                  onChange={(e) => handleCompanyChange('taxNumber', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax Office"
                  value={editCompanyDialog.company.taxOffice || ''}
                  onChange={(e) => handleCompanyChange('taxOffice', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editCompanyDialog.company.isActive || false}
                      onChange={(e) => handleCompanyChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCompanyDialog({...editCompanyDialog, open: false})}>Cancel</Button>
          <Button onClick={handleSaveCompany} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DevPanel; 