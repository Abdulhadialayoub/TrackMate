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
  CardActions,
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
  LinearProgress
} from '@mui/material';
import { 
  Inventory as InventoryIcon,
  Group as GroupIcon,
  ShoppingCart as OrdersIcon,
  ReceiptLong as InvoiceIcon,
  Assessment as ReportIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7092/api',
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
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
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

const ManagerView = () => {
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

    // Fetch data for the manager dashboard
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

  // Summary cards for the dashboard overview
  const summaryCards = [
    { 
      title: 'Inventory', 
      count: products.length, 
      icon: <InventoryIcon fontSize="large" color="primary" />,
      lowStock: products.filter(p => p.stockQuantity < 10).length,
      buttonText: 'Manage Products',
      tabIndex: 1
    },
    { 
      title: 'Customers', 
      count: customers.length, 
      icon: <GroupIcon fontSize="large" color="primary" />,
      active: customers.filter(c => c.status === 'Active').length,
      buttonText: 'Manage Customers',
      tabIndex: 2
    },
    { 
      title: 'Orders', 
      count: orders.length, 
      icon: <OrdersIcon fontSize="large" color="primary" />,
      pending: orders.filter(o => o.status === 'Pending').length,
      buttonText: 'View Orders',
      tabIndex: 3
    },
    { 
      title: 'Invoices', 
      count: invoices.length, 
      icon: <InvoiceIcon fontSize="large" color="primary" />,
      unpaid: invoices.filter(i => i.status === 'Unpaid').length,
      buttonText: 'View Invoices',
      tabIndex: 4
    }
  ];

  // Calculate monthly sales data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(currentYear, currentMonth - i, 1);
    return month.toLocaleString('default', { month: 'short' });
  }).reverse();
  
  const monthlySales = lastSixMonths.map(month => {
    // This would ideally come from an API with real data
    // For now, we'll generate random values
    return {
      month,
      amount: Math.floor(Math.random() * 50000) + 10000
    };
  });

  // Calculate top selling products
  const topSellingProducts = products
    .slice(0, 5)
    .map(product => ({
      id: product.id,
      name: product.name,
      sales: Math.floor(Math.random() * 100) + 20, // Random data for demonstration
      revenue: Math.floor(Math.random() * 5000) + 1000
    }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Manager Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage your department with insights and tools for products, customers, orders, and invoices.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="manager tabs">
            <Tab label="Overview" id="manager-tab-0" aria-controls="manager-tabpanel-0" />
            <Tab label="Products" id="manager-tab-1" aria-controls="manager-tabpanel-1" />
            <Tab label="Customers" id="manager-tab-2" aria-controls="manager-tabpanel-2" />
            <Tab label="Orders" id="manager-tab-3" aria-controls="manager-tabpanel-3" />
            <Tab label="Invoices" id="manager-tab-4" aria-controls="manager-tabpanel-4" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Summary Cards */}
            {summaryCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="div">{card.title}</Typography>
                      {card.icon}
                    </Box>
                    <Typography variant="h4" component="div" gutterBottom>
                      {card.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.lowStock !== undefined && `${card.lowStock} low stock items`}
                      {card.active !== undefined && `${card.active} active customers`}
                      {card.pending !== undefined && `${card.pending} pending orders`}
                      {card.unpaid !== undefined && `${card.unpaid} unpaid invoices`}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => setTabValue(card.tabIndex)}
                    >
                      {card.buttonText}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {/* Monthly Sales Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Sales Performance
                </Typography>
                <Box sx={{ height: 300, mt: 4 }}>
                  {/* Chart would go here - using a simplified representation */}
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'flex-end' }}>
                    {monthlySales.map((data, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          flexGrow: 1, 
                          mx: 1, 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: '100%', 
                            backgroundColor: 'primary.main',
                            height: `${(data.amount / 50000) * 100}%`,
                            minHeight: '20px',
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4
                          }} 
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {data.month}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ${data.amount.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Top Selling Products */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Top Selling Products
                </Typography>
                <List>
                  {topSellingProducts.map((product, index) => (
                    <React.Fragment key={product.id}>
                      <Box sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1">{product.name}</Typography>
                          <Typography variant="body2">{product.sales} units</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(product.sales / 100) * 100} 
                            sx={{ flexGrow: 1, mr: 1 }} 
                          />
                          <Typography variant="body2" color="primary">
                            ${product.revenue.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      {index < topSellingProducts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Product Inventory
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                sx={{ mr: 1 }}
              >
                Add Product
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                Generate Report
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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No products found</TableCell>
                  </TableRow>
                ) : (
                  products.slice(0, 10).map(product => (
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
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                        >
                          Delete
                        </Button>
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
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Customer Management
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                sx={{ mr: 1 }}
              >
                Add Customer
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                Export List
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
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No customers found</TableCell>
                  </TableRow>
                ) : (
                  customers.slice(0, 10).map(customer => (
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
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<OrdersIcon />}
                        >
                          Orders
                        </Button>
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
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Order Management
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                sx={{ mr: 1 }}
              >
                Create Order
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                Export Orders
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No orders found</TableCell>
                  </TableRow>
                ) : (
                  orders.slice(0, 10).map(order => (
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
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<InvoiceIcon />}
                        >
                          Invoice
                        </Button>
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
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Invoice Management
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                sx={{ mr: 1 }}
              >
                Create Invoice
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
              >
                Export Invoices
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
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  invoices.slice(0, 10).map(invoice => (
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
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                        >
                          Print
                        </Button>
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

export default ManagerView; 