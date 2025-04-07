import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Drawer,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Receipt as InvoicesIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  AttachMoney as AttachMoneyIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { authService } from '../services/api';
import { motion } from 'framer-motion';


const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const drawerWidth = 240;
  
  // Mock data for dashboard
  const summaryData = [
    { id: 1, title: 'Total Revenue', value: '$12,543.00', change: '+12.5%', isPositive: true, icon: <AttachMoneyIcon /> },
    { id: 2, title: 'Total Orders', value: '152', change: '+8.2%', isPositive: true, icon: <OrdersIcon /> },
    { id: 3, title: 'Total Products', value: '86', change: '+3.7%', isPositive: true, icon: <InventoryIcon /> },
    { id: 4, title: 'Total Customers', value: '241', change: '-2.3%', isPositive: false, icon: <PeopleIcon /> },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Smith', date: '2025-04-07', total: '$235.89', status: 'Completed' },
    { id: 'ORD-002', customer: 'Sarah Johnson', date: '2025-04-06', total: '$129.50', status: 'Processing' },
    { id: 'ORD-003', customer: 'Michael Brown', date: '2025-04-05', total: '$89.99', status: 'Completed' },
    { id: 'ORD-004', customer: 'Emily Davis', date: '2025-04-04', total: '$320.75', status: 'Pending' },
  ];

  const topProducts = [
    { id: 1, name: 'Bluetooth Headphones', sales: 28, stock: 45 },
    { id: 2, name: 'Wireless Mouse', sales: 24, stock: 32 },
    { id: 3, name: 'USB-C Cable', sales: 22, stock: 78 },
    { id: 4, name: 'Power Bank', sales: 19, stock: 23 },
  ];

  useEffect(() => {
    // Use a flag to prevent multiple renders
    let isMounted = true;
    
    const initializeDashboard = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token && isMounted) {
        try {
          // Parse the JWT token
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const { role, sub, name, email } = JSON.parse(jsonPayload);
          
          // Store user info in state
          if (isMounted) {
            setUserProfile({
              username: sub,
              name: name || sub || 'User', // Provide a fallback name if both name and sub are undefined
              role: role,
              email: email
            });
          }
        } catch (error) {
          console.error('Error parsing JWT token:', error);
        }
      }
      
      // Simulate loading data - use a shorter timeout to prevent double rendering appearance
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, 300);
      }
    };
    
    initializeDashboard();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, []);
  
  const handleRefresh = () => {
    setLoading(true);
    // Simulate refreshing data
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          TrackMate
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {/* Main menu items */}
        <ListItem component={Link} to="/dashboard" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        <ListItem component={Link} to="/products" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Products" />
        </ListItem>

        <ListItem component={Link} to="/customers" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItem>

        <ListItem component={Link} to="/orders" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <OrdersIcon />
          </ListItemIcon>
          <ListItemText primary="Orders" />
        </ListItem>

        <ListItem component={Link} to="/invoices" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <InvoicesIcon />
          </ListItemIcon>
          <ListItemText primary="Invoices" />
        </ListItem>

        {/* Admin-specific menu items */}
        {userProfile?.role === 'Admin' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pl: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ADMINISTRATION
              </Typography>
            </ListItem>
            <ListItem component={Link} to="/user-management" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItem>
            <ListItem component={Link} to="/company-settings" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Company Settings" />
            </ListItem>
            <ListItem component={Link} to="/activity-logs" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Company Logs" />
            </ListItem>
          </>
        )}

        {/* Developer-specific menu items */}
        {userProfile?.role === 'Dev' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pl: 2 }}>
              <Typography variant="caption" color="text.secondary">
                DEVELOPER TOOLS
              </Typography>
            </ListItem>
            <ListItem component={Link} to="/dev-panel" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText primary="Developer Panel" />
            </ListItem>
            <ListItem component={Link} to="/role-manager" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Role Manager" />
            </ListItem>
          </>
        )}

        {/* Manager-specific menu items */}
        {userProfile?.role === 'Manager' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pl: 2 }}>
              <Typography variant="caption" color="text.secondary">
                MANAGEMENT
              </Typography>
            </ListItem>
            <ListItem component={Link} to="/manager-view" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Manager View" />
            </ListItem>
            <ListItem component={Link} to="/reports" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <VisibilityIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
          </>
        )}

        {/* Viewer-specific menu items */}
        {userProfile?.role === 'Viewer' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pl: 2 }}>
              <Typography variant="caption" color="text.secondary">
                REPORTS
              </Typography>
            </ListItem>
            <ListItem component={Link} to="/viewer-panel" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemIcon>
                <VisibilityIcon />
              </ListItemIcon>
              <ListItemText primary="Reports Panel" />
            </ListItem>
          </>
        )}
      </List>

      <Divider />

      {/* Settings and logout */}
      <List>
        <ListItem component={Link} to="/settings" sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        
        <ListItem button onClick={handleLogout} sx={{ color: 'inherit', textDecoration: 'none' }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );
  
  // Dashboard summary cards
  const summaryCards = [
    { title: 'Total Customers', value: '86', color: '#3f51b5' },
    { title: 'Active Orders', value: '24', color: '#f44336' },
    { title: 'Monthly Revenue', value: '$12,540', color: '#4caf50' },
    { title: 'Total Products', value: '145', color: '#ff9800' },
  ];
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 1,
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 'medium', color: theme.palette.primary.main }}
          >
            TrackMate
          </Typography>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
              {userProfile?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                width: 200,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {userProfile?.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {userProfile?.email || ''}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => navigate('/profile')}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content with animation */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Container maxWidth="lg">
            {/* Header with welcome message and refresh button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
              <Box>
                <Typography variant="h4" fontWeight="medium">
                  Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={1}>
                  Here's what's happening with your business today.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
            
            {/* Summary cards */}
            {loading ? (
              <Box sx={{ width: '100%', mb: 4 }}>
                <LinearProgress />
              </Box>
            ) : (
              <Grid container spacing={3} mb={6}>
                {summaryCards.map((card) => (
                  <Grid item xs={12} sm={6} md={3} key={card.title}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h3" component="div" fontWeight="bold">
                              {card.value}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                              {card.title}
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: 4,
                                bgcolor: card.color,
                                borderRadius: 2,
                                mt: 2,
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* Recent activity section */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Recent Orders</Typography>
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {recentOrders && recentOrders.length > 0 ? (
                        <Box>
                          <List sx={{ width: '100%' }}>
                            {recentOrders.map((order, index) => (
                              <React.Fragment key={order.id}>
                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2">{order.id}</Typography>
                                        <Typography variant="subtitle2">{order.total}</Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">{order.customer}</Typography>
                                        <Chip
                                          label={order.status}
                                          size="small"
                                          sx={{
                                            fontSize: '0.75rem',
                                            height: 24,
                                            color: order.status === 'Completed' ? 'success.main' : 
                                                  order.status === 'Processing' ? 'primary.main' : 'warning.main',
                                            bgcolor: order.status === 'Completed' ? 'success.lighter' : 
                                                    order.status === 'Processing' ? 'primary.lighter' : 'warning.lighter',
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                                {index < recentOrders.length - 1 && <Divider component="li" />}
                              </React.Fragment>
                            ))}
                          </List>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                              endIcon={<ArrowForwardIcon />}
                              onClick={() => navigate('/orders')}
                            >
                              View All Orders
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            You don't have any recent orders. When you start receiving orders, they'll appear here.
                          </Typography>
                          <Button variant="outlined" onClick={() => navigate('/orders')}>
                            View All Orders
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quick Actions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/products/new')}
                          sx={{ py: 1.2 }}
                        >
                          Add New Product
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/customers/new')}
                          sx={{ py: 1.2 }}
                        >
                          Add New Customer
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/orders/new')}
                          sx={{ py: 1.2 }}
                        >
                          Create New Order
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Dashboard; 