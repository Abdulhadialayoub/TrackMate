import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  ReceiptLong as InvoiceIcon,
  Assessment as ReportIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  RemoveRedEye as EyeIcon,
  GetApp as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://trackmate.runasp.net/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
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

// TabPanel component for handling tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`viewer-tabpanel-${index}`}
      aria-labelledby={`viewer-tab-${index}`}
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

const ViewerPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState({
    products: false,
    customers: false,
    orders: false,
    invoices: false
  });
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get company ID from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setCompanyId(payload.companyId || null);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    // Fetch data for the viewer dashboard
    fetchProducts();
    fetchCustomers();
    fetchOrders();
    fetchInvoices();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const response = await api.get('/Product');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      const response = await api.get('/Customer');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(prev => ({ ...prev, orders: true }));
      const response = await api.get('/Order');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, invoices: true }));
      const response = await api.get('/Invoice');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter data based on search term
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.id?.toString().includes(searchTerm) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers.find(c => c.id === order.customerId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(invoice =>
    invoice.id?.toString().includes(searchTerm) ||
    invoice.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers.find(c => c.id === invoice.customerId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary cards for the dashboard overview
  const summaryCards = [
    { 
      title: 'Products', 
      count: products.length, 
      icon: <InventoryIcon fontSize="large" sx={{ color: '#3f51b5' }} />,
      tabIndex: 1
    },
    { 
      title: 'Customers', 
      count: customers.length, 
      icon: <PeopleIcon fontSize="large" sx={{ color: '#f44336' }} />,
      tabIndex: 2
    },
    { 
      title: 'Orders', 
      count: orders.length, 
      icon: <OrdersIcon fontSize="large" sx={{ color: '#4caf50' }} />,
      tabIndex: 3
    },
    { 
      title: 'Invoices', 
      count: invoices.length, 
      icon: <InvoiceIcon fontSize="large" sx={{ color: '#ff9800' }} />,
      tabIndex: 4
    }
  ];

  // Order status summary
  const orderStatusCounts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Processing: orders.filter(o => o.status === 'Processing').length,
    Completed: orders.filter(o => o.status === 'Completed').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length
  };

  // Invoice status summary
  const invoiceStatusCounts = {
    Paid: invoices.filter(i => i.status === 'Paid').length,
    Unpaid: invoices.filter(i => i.status === 'Unpaid').length,
    Overdue: invoices.filter(i => i.status === 'Overdue').length,
    Cancelled: invoices.filter(i => i.status === 'Cancelled').length
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Viewer Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            View-only access to company data, products, customers, orders, and invoices.
          </Typography>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> You have view-only access to this data. Contact an administrator or manager to make changes.
            </Typography>
          </Alert>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="viewer tabs">
            <Tab 
              icon={<EyeIcon />} 
              iconPosition="start" 
              label="Overview" 
              id="viewer-tab-0" 
              aria-controls="viewer-tabpanel-0" 
            />
            <Tab 
              icon={<InventoryIcon />} 
              iconPosition="start" 
              label="Products" 
              id="viewer-tab-1" 
              aria-controls="viewer-tabpanel-1" 
            />
            <Tab 
              icon={<PeopleIcon />} 
              iconPosition="start" 
              label="Customers" 
              id="viewer-tab-2" 
              aria-controls="viewer-tabpanel-2" 
            />
            <Tab 
              icon={<OrdersIcon />} 
              iconPosition="start" 
              label="Orders" 
              id="viewer-tab-3" 
              aria-controls="viewer-tabpanel-3" 
            />
            <Tab 
              icon={<InvoiceIcon />} 
              iconPosition="start" 
              label="Invoices" 
              id="viewer-tab-4" 
              aria-controls="viewer-tabpanel-4" 
            />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Summary Cards */}
            {summaryCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent>
                    {card.icon}
                    <Typography variant="h5" component="div" sx={{ mt: 2 }}>
                      {card.count}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {card.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Order Status Summary */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Order Status
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={orderStatusCounts.Pending} 
                        color="warning" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Pending</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={orderStatusCounts.Processing} 
                        color="info" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Processing</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={orderStatusCounts.Completed} 
                        color="success" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Completed</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={orderStatusCounts.Cancelled} 
                        color="error" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Cancelled</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Invoice Status Summary */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Invoice Status
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={invoiceStatusCounts.Paid} 
                        color="success" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Paid</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={invoiceStatusCounts.Unpaid} 
                        color="warning" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Unpaid</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={invoiceStatusCounts.Overdue} 
                        color="error" 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Overdue</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={invoiceStatusCounts.Cancelled} 
                        sx={{ fontSize: '1.5rem', height: 'auto', py: 1, px: 2, mb: 1, fontWeight: 'bold' }} 
                      />
                      <Typography variant="body2">Cancelled</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Product Catalog
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Search Products"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mr: 2, minWidth: '250px' }}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />
                }}
              />
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                View Report
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.products ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No products found</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.slice(0, 10).map(product => (
                    <TableRow key={product.id}>
                      <TableCell>{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category || 'General'}</TableCell>
                      <TableCell>${product.price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{product.stockQuantity || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.stockQuantity > 10 ? 'In Stock' : 'Low Stock'} 
                          color={product.stockQuantity > 10 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Customers Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Customer Directory
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Search Customers"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mr: 2, minWidth: '250px' }}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />
                }}
              />
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                View Report
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.customers ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No customers found</TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.slice(0, 10).map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.id}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.status || 'Active'} 
                          color={customer.status === 'Active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{orders.filter(o => o.customerId === customer.id).length}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Order History
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Search Orders"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mr: 2, minWidth: '250px' }}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />
                }}
              />
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                View Report
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.orders ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No orders found</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.slice(0, 10).map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>
                        {customers.find(c => c.id === order.customerId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status || 'Pending'} 
                          color={
                            order.status === 'Completed' ? 'success' :
                            order.status === 'Pending' ? 'warning' :
                            order.status === 'Cancelled' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>${order.total?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{order.orderItems?.length || 0}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Invoice">
                          <IconButton size="small" color="info">
                            <InvoiceIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Order">
                          <IconButton size="small">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Invoices Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Invoice Records
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Search Invoices"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ mr: 2, minWidth: '250px' }}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />
                }}
              />
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                View Report
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading.invoices ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.slice(0, 10).map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id}</TableCell>
                      <TableCell>
                        {customers.find(c => c.id === invoice.customerId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{invoice.orderId}</TableCell>
                      <TableCell>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>${invoice.amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.status || 'Unpaid'} 
                          color={
                            invoice.status === 'Paid' ? 'success' :
                            invoice.status === 'Partial' ? 'warning' :
                            invoice.status === 'Overdue' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small" color="secondary">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Invoice">
                          <IconButton size="small">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ViewerPanel; 