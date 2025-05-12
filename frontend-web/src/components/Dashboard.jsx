import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  useTheme,
  Alert
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
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { authService, companyService } from '../services/api';
import { dashboardService } from '../services/dashboardService';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [error, setError] = useState(null);
  
  // State for real dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    userCount: 0,
    orderCount: 0,
    revenue: 0,
    productCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
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
          
          console.log('Token payload:', JSON.parse(jsonPayload)); // Debug log
          
          const parsedToken = JSON.parse(jsonPayload);
          const role = parsedToken.role || parsedToken.Role || parsedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          const userId = parsedToken.sub || parsedToken.nameid || parsedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          const userName = parsedToken.name || parsedToken.Name || parsedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
          const email = parsedToken.email || parsedToken.Email || parsedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
          
          // Get user fullname from localStorage if available
          const storedFullName = localStorage.getItem('fullname');
          const storedUserName = localStorage.getItem('user_name');
          const displayName = storedFullName || userName || storedUserName || userId || 'User';
          
          console.log('Parsed user info:', { 
            username: userId, 
            name: displayName, 
            role, 
            email 
          });
          
          if (isMounted) {
            setUserProfile({
              username: userId,
              name: displayName,
              role: role,
              email: email
            });
            
            // Only redirect developers to DevPanel on initial login, not when they explicitly click the dashboard button
            // Check if this is the initial page load and not a direct navigation to dashboard
            if (role === 'Dev' && !redirected && location.pathname !== '/dashboard') {
              navigate('/dev-panel');
              setRedirected(true);
              return;
            }
            
            // Fetch company information
            const companyId = localStorage.getItem('company_id');
            if (companyId) {
              const companyResult = await companyService.getById(companyId);
              if (companyResult.success && companyResult.data) {
                setCompanyName(companyResult.data.name || 'Your Company');
              }
            }
          }
        } catch (error) {
          console.error('Error parsing JWT token:', error);
          // Try to get basic user info from localStorage as fallback
          const fullName = localStorage.getItem('fullname');
          const userName = localStorage.getItem('user_name');
          const userRole = localStorage.getItem('user_role');
          
          if ((fullName || userName) && userRole && isMounted) {
            setUserProfile({
              username: userName,
              name: fullName || userName,
              role: userRole,
              email: localStorage.getItem('user_email') || ''
            });
          }
        }
      }
      
      // Fetch real data from backend
      if (isMounted) {
        await fetchDashboardData();
      }
    };
    
    initializeDashboard();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard statistics
      const statsResult = await dashboardService.getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setDashboardStats({
          userCount: statsResult.data.userCount || 0,
          orderCount: statsResult.data.activeOrderCount || 0,
          revenue: statsResult.data.revenue || 0,
          productCount: statsResult.data.productCount || 0
        });
      } else {
        console.error('Failed to fetch dashboard stats:', statsResult.message);
      }
      
      // Fetch recent orders - increase limit to ensure we get more orders
      const ordersResult = await dashboardService.getRecentOrders(10); // Increased from default 5
      if (ordersResult.success && ordersResult.data) {
        // Ensure recentOrders is always an array
        console.log('Recent orders data received:', ordersResult.data);
        
        if (Array.isArray(ordersResult.data)) {
          // Convert numeric status to string status for display
          const processedOrders = ordersResult.data.map(order => {
            // Make sure order has a status
            let status = order.status;
            
            // Handle both number and string status formats
            if (typeof status === 'number' || (typeof status === 'string' && !isNaN(parseInt(status)))) {
              // Convert numeric status to string status
              const statusNumber = typeof status === 'number' ? status : parseInt(status);
              switch(statusNumber) {
                case 0: status = 'Draft'; break;
                case 1: status = 'Pending'; break;
                case 2: status = 'Confirmed'; break;
                case 3: status = 'Shipped'; break;
                case 4: status = 'Delivered'; break;
                case 5: status = 'Cancelled'; break;
                case 6: status = 'Completed'; break;
                default: status = 'Unknown';
              }
            }
            
            // Make sure order has all required fields
            return {
              ...order,
              status,
              customerName: order.customerName || order.customer?.name || 'Unknown Customer',
              // Ensure total is calculated correctly
              total: order.total || order.totalAmount || 
                    (order.subTotal + (order.taxAmount || 0) + (order.shippingCost || 0)) || 0
            };
          });
          
          setRecentOrders(processedOrders);
        } else if (ordersResult.data && typeof ordersResult.data === 'object') {
          // Handle case where data might be a single object or have a nested array
          if (ordersResult.data.$values && Array.isArray(ordersResult.data.$values)) {
            setRecentOrders(ordersResult.data.$values);
          } else if (ordersResult.data.orders && Array.isArray(ordersResult.data.orders)) {
            setRecentOrders(ordersResult.data.orders);
          } else {
            // If we can't find an array, set an empty array
            console.warn('Recent orders data is not in expected format:', ordersResult.data);
            setRecentOrders([]);
          }
        } else {
          setRecentOrders([]);
        }
      } else {
        console.error('Failed to fetch recent orders:', ordersResult.message);
        setRecentOrders([]);
      }
      
      // Fetch top products
      const productsResult = await dashboardService.getTopProducts();
      if (productsResult.success && productsResult.data) {
        setTopProducts(productsResult.data);
      } else {
        console.error('Failed to fetch top products:', productsResult.message);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Get summary cards data based on the real data
  const getSummaryCards = () => {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };
    
    return [
      { title: 'Company Users', value: dashboardStats.userCount.toString(), color: '#3f51b5' },
      { title: 'Active Orders', value: dashboardStats.orderCount.toString(), color: '#f44336' },
      { title: 'Company Revenue', value: formatCurrency(dashboardStats.revenue), color: '#4caf50' },
      { title: 'Company Products', value: dashboardStats.productCount.toString(), color: '#ff9800' },
    ];
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Main content with animation */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f5f5f5',
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
                  {userProfile?.role === 'Dev' 
                    ? `System Dashboard${userProfile?.name ? ` - Welcome ${userProfile.name}` : ''}`
                    : userProfile?.role === 'Admin' 
                    ? `${companyName || 'Company'} Dashboard${userProfile?.name ? ` - Welcome ${userProfile.name}` : ''}`
                    : `Welcome back${userProfile?.name ? `, ${userProfile.name}` : ''}`}
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={1}>
                  {companyName ? `Here's what's happening with ${companyName} today.` : "Here's what's happening with your company today."}
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
            
            {/* Error message if there was an error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {/* Summary cards */}
            {loading ? (
              <Box sx={{ width: '100%', mb: 4 }}>
                <LinearProgress />
              </Box>
            ) : (
              <Grid container spacing={3} mb={6}>
                {getSummaryCards().map((card) => (
                  <Grid item xs={12} sm={6} md={3} key={card.title}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          borderTop: `4px solid ${card.color}`,
                          borderRadius: '8px',
                        }}
                      >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                          {card.value}
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* Recent Orders and Top Products */}
            <Grid container spacing={3}>
              {/* Recent Orders */}
              <Grid item xs={12} md={7}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Recent Orders</Typography>
                      <IconButton size="small" sx={{ visibility: loading ? 'hidden' : 'visible' }}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <LinearProgress sx={{ width: '100%' }} />
                      </Box>
                    ) : !recentOrders || !Array.isArray(recentOrders) || recentOrders.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        No recent orders found
                      </Typography>
                    ) : (
                      <>
                        {recentOrders.map((order, index) => (
                          <Box key={order.id || index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  {order.orderNumber || order.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {order.customerName || order.customer?.name || 
                                   (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer')}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {typeof order.total === 'number' 
                                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)
                                    : order.total || '$0.00'}
                                </Typography>
                                <Chip 
                                  label={order.status} 
                                  size="small" 
                                  color={
                                    order.status === 'Completed' ? 'secondary' :
                                    order.status === 'Delivered' ? 'success' :
                                    order.status === 'Confirmed' ? 'info' :
                                    order.status === 'Shipped' ? 'primary' :
                                    order.status === 'Pending' ? 'warning' :
                                    order.status === 'Cancelled' ? 'error' : 'default'
                                  }
                                  sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}
                                />
                              </Box>
                            </Box>
                            {index < recentOrders.length - 1 && (
                              <Divider />
                            )}
                          </Box>
                        ))}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button 
                            variant="text" 
                            size="small" 
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/orders?refresh=true')}
                          >
                            View All Orders
                          </Button>
                        </Box>
                      </>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
              
              {/* Quick Actions */}
              <Grid item xs={12} md={5}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                      onClick={() => navigate('/products/new')}
                    >
                      Add New Product
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PeopleIcon />}
                      sx={{ mb: 2 }}
                      onClick={() => navigate('/customers')}
                    >
                      Add New Customer
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<OrdersIcon />}
                      onClick={() => navigate('/orders/new')}
                    >
                      Create New Order
                    </Button>
                  </Paper>
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