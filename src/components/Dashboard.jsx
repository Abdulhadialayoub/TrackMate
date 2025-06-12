import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Alert,
  CircularProgress
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
import { orderService } from '../services/orderService';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState(null);
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
              setCompanyId(companyId);
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
          
          // Get company ID
          const companyId = localStorage.getItem('company_id');
          if (companyId) {
            setCompanyId(companyId);
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
      // Get current company ID from state or localStorage
      const currentCompanyId = companyId || localStorage.getItem('company_id');
      console.log('Fetching dashboard data for company ID:', currentCompanyId);
      
      if (!currentCompanyId) {
        setError('Company ID is required to calculate revenue.');
        setLoading(false);
        return;
      }
      
      // Fetch company orders directly from API endpoint
      let calculatedRevenue = 0;
      const ordersResult = await orderService.getOrdersByCompany(currentCompanyId);
      
      if (ordersResult.success && Array.isArray(ordersResult.data)) {
        console.log(`Got ${ordersResult.data.length} orders for company ID ${currentCompanyId}`);
        
        // Calculate revenue based only on Completed orders (status 6)
        calculatedRevenue = ordersResult.data
          .filter(order => {
            // Check if order status is 'Completed' (either as number 6 or string 'Completed')
            return order.status === 6 || order.status === '6' || order.status === 'Completed';
          })
          .reduce((total, order) => {
            // Use totalAmount, total, or calculate from items if available
            let orderTotal = 0;
            if (typeof order.totalAmount === 'number') {
              orderTotal = order.totalAmount;
            } else if (typeof order.total === 'number') {
              orderTotal = order.total;
            } else if (typeof order.subTotal === 'number') {
              orderTotal = order.subTotal + (order.taxAmount || 0) + (order.shippingCost || 0);
            } else if (typeof order.totalAmount === 'string' && !isNaN(parseFloat(order.totalAmount))) {
              orderTotal = parseFloat(order.totalAmount);
            } else if (typeof order.total === 'string' && !isNaN(parseFloat(order.total))) {
              orderTotal = parseFloat(order.total);
            }
            return total + orderTotal;
          }, 0);
          
        console.log('Calculated revenue from completed orders for company:', calculatedRevenue);
      } else {
        console.error('Failed to fetch company orders:', ordersResult.message);
      }
      
      // Fetch dashboard statistics for other data
      const statsResult = await dashboardService.getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setDashboardStats({
          userCount: statsResult.data.userCount || 0,
          orderCount: statsResult.data.activeOrderCount || 0,
          revenue: calculatedRevenue, // Use our calculated revenue
          productCount: statsResult.data.productCount || 0
        });
      } else {
        console.error('Failed to fetch dashboard stats:', statsResult.message);
      }
      
      // Fetch recent orders - increase limit to ensure we get more orders
      const recentOrdersResult = await dashboardService.getRecentOrders(10); // Increased from default 5
      if (recentOrdersResult.success && recentOrdersResult.data) {
        // Ensure recentOrders is always an array
        console.log('Recent orders data received:', recentOrdersResult.data);
        
        if (Array.isArray(recentOrdersResult.data)) {
          // Convert numeric status to string status for display
          const processedOrders = recentOrdersResult.data.map(order => {
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
        } else if (recentOrdersResult.data && typeof recentOrdersResult.data === 'object') {
          // Handle case where data might be a single object or have a nested array
          if (recentOrdersResult.data.$values && Array.isArray(recentOrdersResult.data.$values)) {
            setRecentOrders(recentOrdersResult.data.$values);
          } else if (recentOrdersResult.data.orders && Array.isArray(recentOrdersResult.data.orders)) {
            setRecentOrders(recentOrdersResult.data.orders);
          } else {
            // If we can't find an array, set an empty array
            console.warn('Recent orders data is not in expected format:', recentOrdersResult.data);
            setRecentOrders([]);
          }
        } else {
          setRecentOrders([]);
        }
      } else {
        console.error('Failed to fetch recent orders:', recentOrdersResult.message);
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
      { 
        title: t('dashboard.companyUsers'), 
        value: dashboardStats.userCount.toString(), 
        color: theme.palette.primary.main,
        icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      },
      { 
        title: t('dashboard.activeOrders'), 
        value: dashboardStats.orderCount.toString(), 
        color: theme.palette.secondary.main,
        icon: <OrdersIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
      },
      { 
        title: t('dashboard.companyRevenue'), 
        value: formatCurrency(dashboardStats.revenue), 
        color: theme.palette.success.main,
        icon: <AttachMoneyIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
      },
      { 
        title: t('dashboard.companyProducts'), 
        value: dashboardStats.productCount.toString(), 
        color: theme.palette.warning.main,
        icon: <InventoryIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
      },
    ];
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: '#f8fafc',
        pt: 2,
        pb: 6
      }}
    >
      {/* Main content with animation */}
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header with welcome message and refresh button */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4,
              pb: 3,
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {userProfile?.role === 'Dev' 
                  ? t('dashboard.systemDashboard')
                  : userProfile?.role === 'Admin' 
                  ? t('dashboard.companyDashboard', { company: companyName || 'Company' })
                  : t('dashboard.welcomeBack')}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {userProfile?.name ? t('dashboard.greeting', { name: userProfile.name }) : ''}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {companyName 
                  ? t('dashboard.companyStatus', { company: companyName })
                  : t('dashboard.companyStatusDefault')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ 
                px: 3, 
                py: 1.2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: 2
              }}
            >
              {t('common.refreshData')}
            </Button>
          </Box>
            
          {/* Error message if there was an error */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              {error}
            </Alert>
          )}
            
          {/* Summary cards */}
          {loading ? (
            <Box sx={{ width: '100%', mb: 6 }}>
              <LinearProgress />
            </Box>
          ) : (
            <Grid container spacing={3} mb={6}>
              {getSummaryCards().map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={card.title}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="subtitle1" color="text.secondary" fontWeight="medium">
                            {card.title}
                          </Typography>
                          <Box 
                            sx={{ 
                              bgcolor: `${card.color}15`, // 15% opacity of the color
                              p: 1,
                              borderRadius: 2
                            }}
                          >
                            {card.icon}
                          </Box>
                        </Box>
                        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                          {card.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
            
          {/* Recent Orders and Quick Actions */}
          <Grid container spacing={4}>
            {/* Recent Orders */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card
                  sx={{
                    mb: 4,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                      p: 3, 
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <Typography variant="h6" fontWeight="bold">{t('dashboard.recentOrders')}</Typography>
                      <Box sx={{ visibility: loading ? 'hidden' : 'visible' }}>
                        <Button
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate('/orders')}
                          sx={{ p: 0 }}
                        >
                          {t('dashboard.viewAll')}
                        </Button>
                      </Box>
                    </Box>
                    
                    {loading ? (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress color="primary" size={40} thickness={4} />
                      </Box>
                    ) : !recentOrders || !Array.isArray(recentOrders) || recentOrders.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
                        {t('dashboard.noRecentOrders')}
                      </Typography>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {recentOrders.map((order, index) => (
                          <React.Fragment key={order.id || index}>
                            <ListItem sx={{ px: 3, py: 2 }}>
                              <ListItemAvatar>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: 
                                      order.status === 'Completed' ? 'success.lighter' :
                                      order.status === 'Pending' ? 'warning.lighter' :
                                      'info.lighter',
                                    color: 
                                      order.status === 'Completed' ? 'success.main' :
                                      order.status === 'Pending' ? 'warning.main' :
                                      'info.main'
                                  }}
                                >
                                  {(order.orderNumber || order.id || '').toString().charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {order.orderNumber || order.id}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    {order.customerName || order.customer?.name || 
                                    (order.customerId ? t('dashboard.customerNumber', { id: order.customerId }) : t('dashboard.unknownCustomer'))}
                                  </Typography>
                                }
                              />
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
                                    order.status === 'Completed' ? 'success' :
                                    order.status === 'Delivered' ? 'secondary' :
                                    order.status === 'Confirmed' ? 'info' :
                                    order.status === 'Shipped' ? 'primary' :
                                    order.status === 'Pending' ? 'warning' :
                                    order.status === 'Cancelled' ? 'error' : 'default'
                                  }
                                  sx={{ fontWeight: 'medium', mt: 0.5 }}
                                />
                              </Box>
                            </ListItem>
                            {index < recentOrders.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
              
            {/* Quick Actions */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card
                  sx={{
                    mb: 4,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                      p: 3, 
                      borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="h6" fontWeight="bold">{t('dashboard.quickActions')}</Typography>
                    </Box>
                    
                    <Box sx={{ p: 3 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddIcon />}
                        sx={{ 
                          mb: 2.5, 
                          py: 1.5, 
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        onClick={() => navigate('/products')}
                      >
                        {t('dashboard.addNewProduct')}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<PeopleIcon />}
                        sx={{ mb: 2.5, py: 1.5, borderRadius: 2 }}
                        onClick={() => navigate('/customers')}
                      >
                        {t('dashboard.addNewCustomer')}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<OrdersIcon />}
                        sx={{ py: 1.5, borderRadius: 2 }}
                        onClick={() => navigate('/orders')}
                      >
                        {t('dashboard.createNewOrder')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Company Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  
                </motion.div>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Dashboard; 