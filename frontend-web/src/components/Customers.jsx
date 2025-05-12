import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Tabs,
  Tab,
  TableFooter
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as OrderIcon
} from '@mui/icons-material';
import { customerService } from '../services/customerService';
import { useNavigate } from 'react-router-dom';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  taxNumber: '',
  taxOffice: '',
  status: 0,
  notes: '',
  isActive: true,
  companyId: parseInt(localStorage.getItem('company_id') || '1')
};

const customerStatuses = [
  { value: 0, label: 'Active', color: 'success' },
  { value: 1, label: 'Inactive', color: 'error' },
  { value: 2, label: 'Blocked', color: 'error' },
  { value: 3, label: 'Deleted', color: 'warning' }
];

const invoiceStatuses = [
  { value: 0, label: 'Draft', color: 'default' },
  { value: 1, label: 'Sent', color: 'info' },
  { value: 2, label: 'Paid', color: 'success' },
  { value: 3, label: 'Overdue', color: 'error' },
  { value: 4, label: 'Cancelled', color: 'warning' }
];

const orderStatuses = [
  { value: 0, label: 'Draft', color: 'default' },
  { value: 1, label: 'Pending', color: 'warning' },
  { value: 2, label: 'Confirmed', color: 'info' },
  { value: 3, label: 'Shipped', color: 'primary' },
  { value: 4, label: 'Delivered', color: 'success' },
  { value: 5, label: 'Cancelled', color: 'error' },
  { value: 6, label: 'Completed', color: 'secondary' }
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
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

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Make sure we have a token before fetching
      const token = localStorage.getItem('token');
      if (!token) {
        // Wait briefly for token to be set if it's in process
        setTimeout(fetchCustomers, 300);
        return;
      }
      
      fetchCustomers();
    };
    
    checkAuthAndFetch();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const companyId = localStorage.getItem('company_id');
      let result;
      
      // Get user role to determine which API to call
      const userRole = localStorage.getItem('user_role');
      
      if (userRole === 'Dev') {
        // Dev role can see all customers
        result = await customerService.getAll();
      } else {
        // Other roles (including Admin) can only see their company's customers
        result = await customerService.getByCompanyId(companyId);
      }
      
      if (result.success) {
        setCustomers(Array.isArray(result.data) ? result.data : []);
        setError(null);
      } else {
        setError(result.message);
        setCustomers([]);
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers');
      setCustomers([]);
      showSnackbar('Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    setDetailsLoading(true);
    try {
      const [ordersResult, invoicesResult] = await Promise.all([
        customerService.getCustomerOrders(customerId),
        customerService.getCustomerInvoices(customerId)
      ]);
      
      if (ordersResult.success) {
        setCustomerOrders(ordersResult.data);
      }
      
      if (invoicesResult.success) {
        setCustomerInvoices(invoicesResult.data);
      }
      
    } catch (err) {
      showSnackbar('Failed to fetch customer details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      // Check if user has permission to edit this customer
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      if (customer.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('You can only edit customers that belong to your company', 'error');
        return;
      }
      
      // Ensure status is numeric
      const customerStatus = typeof customer.status === 'number' ? 
        customer.status : 
        customerStatuses.findIndex(s => s.label === customer.status);
      
      setFormData({
        ...customer,
        status: customerStatus >= 0 ? customerStatus : 0
      });
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      const userId = localStorage.getItem('user_id') || 'system';
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.address) {
        showSnackbar('Please fill all required fields', 'error');
        return;
      }
      
      let result;
      
      if (isEditing) {
        // For updating, ensure we're updating a customer that belongs to the user's company
        if (formData.companyId && formData.companyId !== companyId && userRole !== 'Dev') {
          showSnackbar('You can only edit customers that belong to your company', 'error');
          return;
        }
        
        console.log('Updating customer with data:', {
          id: formData.id,
          companyId,
          data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            taxNumber: formData.taxNumber || '',
            taxOffice: formData.taxOffice || '',
            status: typeof formData.status === 'number' ? formData.status : 0,
            notes: formData.notes || '',
            isActive: formData.isActive || true,
            updatedBy: userId
          }
        });
        
        result = await customerService.update(formData.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          taxNumber: formData.taxNumber || '',
          taxOffice: formData.taxOffice || '',
          status: typeof formData.status === 'number' ? formData.status : 0,
          notes: formData.notes || '',
          isActive: formData.isActive || true,
          updatedBy: userId
        });
      } else {
        const customerData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          taxNumber: formData.taxNumber || '',
          taxOffice: formData.taxOffice || '',
          status: typeof formData.status === 'number' ? formData.status : 0,
          notes: formData.notes || '',
          isActive: true,
          companyId: companyId,
          createdBy: userId
        };
        
        console.log('Creating customer with data:', customerData);
        result = await customerService.create(customerData);
      }
      
      console.log('API response:', result);
      
      if (result.success) {
        showSnackbar(`Customer ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        handleCloseDialog();
        fetchCustomers();
      } else {
        showSnackbar(result.message || 'Operation failed', 'error');
        console.error('Operation failed:', result.error || result.message);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      showSnackbar(`Failed to ${isEditing ? 'update' : 'create'} customer: ${err.message}`, 'error');
    }
  };

  const handleDeleteClick = (customer) => {
    // Check if user has permission to delete this customer
    const companyId = parseInt(localStorage.getItem('company_id') || '1');
    const userRole = localStorage.getItem('user_role');
    
    if (customer.companyId !== companyId && userRole !== 'Dev') {
      showSnackbar('You can only delete customers that belong to your company', 'error');
      return;
    }
    
    setCustomerToDelete(customer);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      // Double check permissions
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      if (customerToDelete.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('You can only delete customers that belong to your company', 'error');
        setOpenDeleteDialog(false);
        setCustomerToDelete(null);
        return;
      }
      
      const result = await customerService.delete(customerToDelete.id);
      if (result.success) {
        showSnackbar('Customer deleted successfully', 'success');
        fetchCustomers();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      showSnackbar('Failed to delete customer', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setCustomerToDelete(null);
    }
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setTabValue(0);
    await fetchCustomerDetails(customer.id);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseDetails = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
    setCustomerInvoices([]);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Ensure customers is always an array before filtering
  const filteredCustomers = Array.isArray(customers) ? customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.taxOffice?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusChip = (status) => {
    const statusInfo = customerStatuses.find(s => s.value === status) || 
                      { label: 'Unknown', color: 'default' };
    
    return (
      <Chip 
        label={statusInfo.label} 
        color={statusInfo.color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {selectedCustomer ? (
        // Customer details view
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {selectedCustomer.name || `Customer #${selectedCustomer.id}` || 'Customer Details'}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleCloseDetails}
            >
              Back to Customers
            </Button>
          </Box>

          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer details tabs">
                <Tab label="Customer Info" />
                <Tab label="Orders" />
                <Tab label="Invoices" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Contact Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>{selectedCustomer.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>{selectedCustomer.phone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ mr: 1 }}>Status:</Typography>
                    {getStatusChip(selectedCustomer.status)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Address</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                    <Typography>
                      {selectedCustomer.address}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Additional Information</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Tax Number:</Typography>
                    <Typography>{selectedCustomer.taxNumber || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Tax Office:</Typography>
                    <Typography>{selectedCustomer.taxOffice || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Notes:</Typography>
                    <Typography>{selectedCustomer.notes || 'No notes available'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {detailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : customerOrders.length === 0 ? (
                <Typography>No orders found for this customer.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow key="orders-header-row">
                        <TableCell>Order #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow 
                          key={order.id} 
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/orders?selected=${order.id}`)}
                        >
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                          <TableCell>{(order.total || order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={orderStatuses.find(s => s.value === order.status)?.label || 'Unknown'} 
                              color={orderStatuses.find(s => s.value === order.status)?.color || 'default'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {customerOrders.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Grand Total:</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {customerOrders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0).toFixed(2)} {customerOrders[0]?.currency || 'USD'}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {detailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : customerInvoices.length === 0 ? (
                <Typography>No invoices found for this customer.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow key="invoices-header-row">
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerInvoices.map((invoice) => (
                        <TableRow 
                          key={invoice.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/invoices?selected=${invoice.id}`)}
                        >
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{(invoice.total || 0).toFixed(2)} {invoice.currency || 'USD'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={invoiceStatuses.find(s => s.value === invoice.status)?.label || 'Unknown'} 
                              color={invoiceStatuses.find(s => s.value === invoice.status)?.color || 'default'} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>
        </Box>
      ) : (
        // Customers list view
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Customers Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Customer
            </Button>
          </Box>

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                variant="outlined"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ mr: 2, flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Refresh">
                <IconButton onClick={fetchCustomers}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow key="customers-header-row">
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Tax Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow key="loading-row">
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow key="no-customers-row">
                    <TableCell colSpan={6} align="center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer) => (
                      <TableRow 
                        key={customer.id} 
                        hover
                        onClick={() => handleCustomerSelect(customer)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.taxNumber}</TableCell>
                        <TableCell>{getStatusChip(customer.status)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Orders">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerSelect(customer);
                                setTabValue(1);
                              }}
                              color="primary"
                            >
                              <OrderIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Invoices">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerSelect(customer);
                                setTabValue(2);
                              }}
                              color="primary"
                            >
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(customer);
                              }}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(customer);
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {/* Customer Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Customer Name"
                value={formData.name || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!formData.name}
                helperText={!formData.name ? 'Customer name is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!formData.email}
                helperText={!formData.email ? 'Email is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!formData.phone}
                helperText={!formData.phone ? 'Phone is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                value={formData.address || ''}
                onChange={handleInputChange}
                fullWidth
                required
                error={!formData.address}
                helperText={!formData.address ? 'Address is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxNumber"
                label="Tax Number"
                value={formData.taxNumber || ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxOffice"
                label="Tax Office"
                value={formData.taxOffice || ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="status"
                label="Status"
                select
                value={formData.status || 0}
                onChange={handleInputChange}
                fullWidth
                required
              >
                {customerStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the customer "{customerToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;
