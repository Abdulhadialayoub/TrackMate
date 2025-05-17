import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Divider,
  Alert, 
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const apiBaseUrl = 'http://localhost:5105/api'; // DevPanel ile aynı olması için

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
    console.log('Setting token for API request in RoleManager');
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('API request interceptor error in RoleManager:', error);
    return Promise.reject(error);
  }
);

// TabPanel component for handling tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
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

const RoleManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState([
    { id: 0, name: 'Admin', description: 'Full access to the system' },
    { id: 1, name: 'Manager', description: 'Department management access' },
    { id: 2, name: 'User', description: 'Standard operational access' },
    { id: 3, name: 'Viewer', description: 'Read-only access' },
    { id: 4, name: 'Dev', description: 'Developer access with system configuration' }
  ]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState({
    roles: false,
    permissions: false,
    users: false
  });
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [editPermissionDialog, setEditPermissionDialog] = useState({
    open: false,
    roleId: null,
    roleName: '',
    permissions: []
  });
  const [users, setUsers] = useState([]);
  const [editUserRoleDialog, setEditUserRoleDialog] = useState({
    open: false,
    user: null,
    role: ''
  });
  const navigate = useNavigate();

  // Define permission categories
  const permissionCategories = [
    { 
      name: 'System', 
      permissions: [
        { id: 'permissions.dev.systemAccess', name: 'System Access', description: 'Access to system configuration' },
        { id: 'permissions.dev.configureSystem', name: 'Configure System', description: 'Modify system settings' },
        { id: 'permissions.dev.viewAllData', name: 'View All Data', description: 'Access to all system data' }
      ] 
    },
    { 
      name: 'Admin', 
      permissions: [
        { id: 'permissions.admin.manageRoles', name: 'Manage Roles', description: 'Create and update user roles' },
        { id: 'permissions.admin.viewAllCompanyData', name: 'View Company Data', description: 'Access all company data' }
      ] 
    },
    { 
      name: 'Companies', 
      permissions: [
        { id: 'permissions.companies.view', name: 'View Companies', description: 'View company information' },
        { id: 'permissions.companies.create', name: 'Create Company', description: 'Create new companies' },
        { id: 'permissions.companies.update', name: 'Update Company', description: 'Update company information' },
        { id: 'permissions.companies.delete', name: 'Delete Company', description: 'Delete companies' }
      ] 
    },
    { 
      name: 'Users', 
      permissions: [
        { id: 'permissions.users.view', name: 'View Users', description: 'View user information' },
        { id: 'permissions.users.create', name: 'Create User', description: 'Create new users' },
        { id: 'permissions.users.update', name: 'Update User', description: 'Update user information' },
        { id: 'permissions.users.delete', name: 'Delete User', description: 'Delete users' }
      ] 
    },
    { 
      name: 'Products', 
      permissions: [
        { id: 'permissions.products.view', name: 'View Products', description: 'View products' },
        { id: 'permissions.products.create', name: 'Create Product', description: 'Create new products' },
        { id: 'permissions.products.update', name: 'Update Product', description: 'Update product information' },
        { id: 'permissions.products.delete', name: 'Delete Product', description: 'Delete products' }
      ] 
    },
    { 
      name: 'Customers', 
      permissions: [
        { id: 'permissions.customers.view', name: 'View Customers', description: 'View customers' },
        { id: 'permissions.customers.create', name: 'Create Customer', description: 'Create new customers' },
        { id: 'permissions.customers.update', name: 'Update Customer', description: 'Update customer information' },
        { id: 'permissions.customers.delete', name: 'Delete Customer', description: 'Delete customers' }
      ] 
    },
    { 
      name: 'Orders', 
      permissions: [
        { id: 'permissions.orders.view', name: 'View Orders', description: 'View orders' },
        { id: 'permissions.orders.create', name: 'Create Order', description: 'Create new orders' },
        { id: 'permissions.orders.update', name: 'Update Order', description: 'Update order information' },
        { id: 'permissions.orders.delete', name: 'Delete Order', description: 'Delete orders' }
      ] 
    },
    { 
      name: 'Invoices', 
      permissions: [
        { id: 'permissions.invoices.view', name: 'View Invoices', description: 'View invoices' },
        { id: 'permissions.invoices.create', name: 'Create Invoice', description: 'Create new invoices' },
        { id: 'permissions.invoices.update', name: 'Update Invoice', description: 'Update invoice information' },
        { id: 'permissions.invoices.delete', name: 'Delete Invoice', description: 'Delete invoices' }
      ] 
    },
    { 
      name: 'Reports', 
      permissions: [
        { id: 'permissions.reports.view', name: 'View Reports', description: 'View reports' },
        { id: 'permissions.reports.export', name: 'Export Reports', description: 'Export reports' }
      ] 
    }
  ];

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
        
        const { role } = JSON.parse(jsonPayload);
        
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
    fetchRolePermissions();
    console.log('Calling fetchUsers from useEffect in RoleManager');
    fetchUsers();
    
    // Hiçbir durumda boş kalmasın diye başlangıçta mock veriler ata
    setUsers([
      { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', username: 'admin', role: 'Admin', companyId: 1, isActive: true },
      { id: 2, firstName: 'Dev', lastName: 'User', email: 'dev@example.com', username: 'dev', role: 'Dev', companyId: 1, isActive: true },
      { id: 3, firstName: 'Manager', lastName: 'User', email: 'manager@example.com', username: 'manager', role: 'Manager', companyId: 2, isActive: true },
      { id: 4, firstName: 'Standard', lastName: 'User', email: 'user@example.com', username: 'user', role: 'User', companyId: 2, isActive: false },
      { id: 5, firstName: 'View', lastName: 'Only', email: 'viewer@example.com', username: 'viewer', role: 'Viewer', companyId: 3, isActive: true }
    ]);
  }, []);

  const fetchRolePermissions = async () => {
    try {
      setLoading(prev => ({ ...prev, permissions: true }));
      
      // In a real implementation, this would be an API call
      // For demo, we'll use static data based on the roles from AuthService
      const rolePermissionsMap = {
        'Admin': [
          'permissions.admin.manageRoles',
          'permissions.admin.viewAllCompanyData',
          'permissions.companies.view',
          'permissions.companies.update',
          'permissions.users.view',
          'permissions.users.create',
          'permissions.users.update',
          'permissions.users.delete',
          'permissions.products.view',
          'permissions.products.create',
          'permissions.products.update',
          'permissions.products.delete',
          'permissions.customers.view',
          'permissions.customers.create',
          'permissions.customers.update',
          'permissions.customers.delete',
          'permissions.orders.view',
          'permissions.orders.create',
          'permissions.orders.update',
          'permissions.orders.delete',
          'permissions.invoices.view',
          'permissions.invoices.create',
          'permissions.invoices.update',
          'permissions.invoices.delete',
          'permissions.reports.view',
          'permissions.reports.export'
        ],
        'Manager': [
          'permissions.companies.view',
          'permissions.users.view',
          'permissions.products.view',
          'permissions.products.create',
          'permissions.products.update',
          'permissions.customers.view',
          'permissions.customers.create',
          'permissions.customers.update',
          'permissions.orders.view',
          'permissions.orders.create',
          'permissions.orders.update',
          'permissions.invoices.view',
          'permissions.invoices.create',
          'permissions.invoices.update',
          'permissions.reports.view',
          'permissions.reports.export'
        ],
        'User': [
          'permissions.products.view',
          'permissions.customers.view',
          'permissions.customers.create',
          'permissions.orders.view',
          'permissions.orders.create',
          'permissions.invoices.view',
          'permissions.reports.view'
        ],
        'Viewer': [
          'permissions.products.view',
          'permissions.customers.view',
          'permissions.orders.view',
          'permissions.invoices.view',
          'permissions.reports.view'
        ],
        'Dev': [
          'permissions.dev.systemAccess',
          'permissions.dev.configureSystem',
          'permissions.dev.viewAllData',
          'permissions.admin.manageRoles',
          'permissions.admin.viewAllCompanyData',
          'permissions.companies.view',
          'permissions.companies.create',
          'permissions.companies.update',
          'permissions.companies.delete',
          'permissions.users.view',
          'permissions.users.create',
          'permissions.users.update',
          'permissions.users.delete',
          'permissions.products.view',
          'permissions.products.create',
          'permissions.products.update',
          'permissions.products.delete',
          'permissions.customers.view',
          'permissions.customers.create',
          'permissions.customers.update',
          'permissions.customers.delete',
          'permissions.orders.view',
          'permissions.orders.create',
          'permissions.orders.update',
          'permissions.orders.delete',
          'permissions.invoices.view',
          'permissions.invoices.create',
          'permissions.invoices.update',
          'permissions.invoices.delete',
          'permissions.reports.view',
          'permissions.reports.export'
        ]
      };
      
      setPermissions(rolePermissionsMap);
      
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      setError('Failed to load role permissions');
      showAlert('error', 'Failed to load role permissions');
    } finally {
      setLoading(prev => ({ ...prev, permissions: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      console.log('Fetching users in RoleManager from API endpoint:', `${api.defaults.baseURL}/User`);
      
      try {
        // Öncelikle API'dan çekmeyi dene
        const response = await api.get('/User', { timeout: 5000 });
        console.log('Users API response in RoleManager:', response.data);
        
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
        
        console.log('Processed users data in RoleManager:', userData);
        setUsers(userData);
      } catch (error) {
        console.error('Error from API, using mock data instead');
        // API başarısız olursa mock veri kullan
        const mockUsers = [
          { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', username: 'admin', role: 'Admin', companyId: 1, isActive: true },
          { id: 2, firstName: 'Dev', lastName: 'User', email: 'dev@example.com', username: 'dev', role: 'Dev', companyId: 1, isActive: true },
          { id: 3, firstName: 'Manager', lastName: 'User', email: 'manager@example.com', username: 'manager', role: 'Manager', companyId: 2, isActive: true },
          { id: 4, firstName: 'Standard', lastName: 'User', email: 'user@example.com', username: 'user', role: 'User', companyId: 2, isActive: false },
          { id: 5, firstName: 'View', lastName: 'Only', email: 'viewer@example.com', username: 'viewer', role: 'Viewer', companyId: 3, isActive: true }
        ];
        console.log('Setting mock users in RoleManager:', mockUsers);
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users in RoleManager:', error);
      
      // Daha detaylı hata mesajları
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        showAlert('error', `Failed to load users: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        showAlert('error', 'Failed to load users: No response received from server');
      } else {
        showAlert('error', `Failed to load users: ${error.message}`);
      }
      
      // Mock veri ayarla
      const mockUsers = [
        { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', username: 'admin', role: 'Admin', companyId: 1, isActive: true },
        { id: 2, firstName: 'Dev', lastName: 'User', email: 'dev@example.com', username: 'dev', role: 'Dev', companyId: 1, isActive: true },
        { id: 3, firstName: 'Manager', lastName: 'User', email: 'manager@example.com', username: 'manager', role: 'Manager', companyId: 2, isActive: true },
        { id: 4, firstName: 'Standard', lastName: 'User', email: 'user@example.com', username: 'user', role: 'User', companyId: 2, isActive: false },
        { id: 5, firstName: 'View', lastName: 'Only', email: 'viewer@example.com', username: 'viewer', role: 'Viewer', companyId: 3, isActive: true }
      ];
      console.log('Setting mock users after error in RoleManager:', mockUsers);
      setUsers(mockUsers);
      setError('Failed to load users');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditPermissions = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setEditPermissionDialog({
        open: true,
        roleId: roleId,
        roleName: role.name,
        permissions: permissions[role.name] || []
      });
    }
  };

  const handlePermissionChange = (permissionId) => {
    setEditPermissionDialog(prev => {
      const newPermissions = [...prev.permissions];
      
      if (newPermissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: newPermissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...newPermissions, permissionId]
        };
      }
    });
  };

  const handleSavePermissions = () => {
    // In a real implementation, this would call an API to update the role permissions
    setPermissions(prev => ({
      ...prev,
      [editPermissionDialog.roleName]: editPermissionDialog.permissions
    }));
    
    showAlert('success', `Permissions updated for ${editPermissionDialog.roleName} role`);
    setEditPermissionDialog(prev => ({ ...prev, open: false }));
  };

  const showAlert = (severity, message) => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const handleEditUserRole = (user) => {
    setEditUserRoleDialog({
      open: true,
      user: user,
      role: user.role
    });
  };

  const handleUserRoleChange = (event) => {
    setEditUserRoleDialog({
      ...editUserRoleDialog,
      role: event.target.value
    });
  };

  const handleSaveUserRole = async () => {
    try {
      const { user, role } = editUserRoleDialog;
      
      console.log(`Updating user ${user.id} role from ${user.role} to ${role}`);
      
      try {
        // API endpoint'i ve request verilerini log'a kaydedelim
        console.log(`Making PUT request to: ${api.defaults.baseURL}/User/${user.id}/role`);
        console.log('With payload:', { role });
        
        // API isteği yapılıyor
        const response = await api.put(`/User/${user.id}/role`, { role });
        console.log('Role update API response:', response);
        showAlert('success', 'User role updated successfully');
      } catch (apiError) {
        console.error('API error when updating user role:', apiError);
        
        if (apiError.response) {
          // Sunucu yanıt verdi ama hata kodu döndü
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', apiError.response.data);
          showAlert('error', `API Error: ${apiError.response.status} - ${apiError.response.data?.message || apiError.response.statusText}`);
        } else if (apiError.request) {
          // İstek yapıldı ama yanıt alınamadı
          console.error('No response from server, might be a network issue');
          showAlert('warning', 'API connection issue - changes saved locally only');
        } else {
          // İstek yapılmadan hata oluştu
          console.error('Error creating request:', apiError.message);
          showAlert('warning', `Request setup error: ${apiError.message}`);
        }
        
        // API hata durumlarında da yerel verileri güncelle
        console.log('Updating local state after API error');
      }
      
      // Her durumda yerel verileri güncelle
      if (Array.isArray(users)) {
        setUsers(users.map(u => {
          if (u.id === user.id) {
            const updatedUser = { ...u, role };
            console.log('Updated user in local state:', updatedUser);
            return updatedUser;
          }
          return u;
        }));
      } else {
        console.warn('Cannot update local users state - users is not an array');
      }
      
      // Close the dialog
      setEditUserRoleDialog({
        open: false,
        user: null,
        role: ''
      });
    } catch (error) {
      console.error('Error in handleSaveUserRole function:', error);
      showAlert('error', `Error updating user role: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Role Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage user roles and permissions in the system.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="role tabs">
            <Tab label="Roles Overview" id="role-tab-0" aria-controls="role-tabpanel-0" />
            <Tab label="Role Permissions" id="role-tab-1" aria-controls="role-tabpanel-1" />
            <Tab label="User Roles" id="role-tab-2" aria-controls="role-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Roles Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <KeyIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {role.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {role.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Permissions: 
                    </Typography>
                    <Chip 
                      label={permissions[role.name]?.length || 0} 
                      size="small" 
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleEditPermissions(role.id)}
                    >
                      Manage Permissions
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Role Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} key={role.id}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {role.name} Role Permissions
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleEditPermissions(role.id)}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {permissions[role.name]?.map((permId) => {
                      // Find the permission details
                      let permDetails = null;
                      for (const category of permissionCategories) {
                        const found = category.permissions.find(p => p.id === permId);
                        if (found) {
                          permDetails = found;
                          break;
                        }
                      }
                      
                      return permDetails ? (
                        <Chip 
                          key={permId}
                          label={permDetails.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                          title={permDetails.description}
                        />
                      ) : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* User Roles Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              User Roles
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
            >
              Refresh
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
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
                  <>
                    {console.log('Rendering users in table:', users)}
                    {Array.isArray(users) && users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role || 'Unknown'} 
                            color={
                              user.role === 'Admin' ? 'error' :
                              user.role === 'Manager' ? 'warning' :
                              user.role === 'Dev' ? 'secondary' :
                              user.role === 'User' ? 'info' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.companyId}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Chip 
                              icon={<CheckIcon />} 
                              label="Active" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              icon={<CloseIcon />} 
                              label="Inactive" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEditUserRole(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Edit Permissions Dialog */}
        <Dialog
          open={editPermissionDialog.open}
          onClose={() => setEditPermissionDialog(prev => ({ ...prev, open: false }))}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Edit Permissions for {editPermissionDialog.roleName} Role
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {permissionCategories.map((category) => (
                <Box key={category.name} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {category.name}
                  </Typography>
                  <Grid container spacing={1}>
                    {category.permissions.map((permission) => (
                      <Grid item xs={12} sm={6} md={4} key={permission.id}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editPermissionDialog.permissions.includes(permission.id)}
                              onChange={() => handlePermissionChange(permission.id)}
                              name={permission.id}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                {permission.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {permission.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditPermissionDialog(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSavePermissions}
              startIcon={<SaveIcon />}
            >
              Save Permissions
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Role Dialog */}
        <Dialog
          open={editUserRoleDialog.open}
          onClose={() => setEditUserRoleDialog(prev => ({ ...prev, open: false }))}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit User Role
          </DialogTitle>
          <DialogContent>
            {editUserRoleDialog.user && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      User: <strong>{editUserRoleDialog.user.firstName} {editUserRoleDialog.user.lastName}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {editUserRoleDialog.user.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="role-select-label">Role</InputLabel>
                      <Select
                        labelId="role-select-label"
                        value={editUserRoleDialog.role}
                        label="Role"
                        onChange={handleUserRoleChange}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.name}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Current role: <Chip 
                        size="small" 
                        label={editUserRoleDialog.user.role}
                        color={
                          editUserRoleDialog.user.role === 'Admin' ? 'error' :
                          editUserRoleDialog.user.role === 'Manager' ? 'warning' :
                          editUserRoleDialog.user.role === 'Dev' ? 'secondary' :
                          editUserRoleDialog.user.role === 'User' ? 'info' : 'default'
                        }
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditUserRoleDialog(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveUserRole}
              startIcon={<SaveIcon />}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert Snackbar */}
        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default RoleManager; 