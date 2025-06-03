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
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as OrderIcon,
  AddShoppingCart as AddItemIcon,
  RemoveShoppingCart as RemoveItemIcon,
  ReceiptLong as InvoiceIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { invoiceService } from '../services/invoiceService';
import { dashboardService } from '../services/dashboardService';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderAIAnalysis from './OrderAIAnalysis';

const orderStatuses = [
  { value: 0, label: 'Draft', color: 'default', stringValue: 'Draft' },
  { value: 1, label: 'Pending', color: 'warning', stringValue: 'Pending' },
  { value: 2, label: 'Confirmed', color: 'info', stringValue: 'Confirmed' },
  { value: 3, label: 'Shipped', color: 'primary', stringValue: 'Shipped' },
  { value: 4, label: 'Delivered', color: 'success', stringValue: 'Delivered' },
  { value: 5, label: 'Cancelled', color: 'error', stringValue: 'Cancelled' },
  { value: 6, label: 'Completed', color: 'secondary', stringValue: 'Completed' }
];

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function for date formatting
  const formatDateForInput = (date) => {
    // Format Date object or ISO string to YYYY-MM-DD for input fields
    if (!date) return '';
    
    try {
      // If already in YYYY-MM-DD format, return as is
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return ''; // Invalid date
      
      // Extract year, month, and day, ensuring proper zero-padding
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-based
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: formatDateForInput(new Date()),
    dueDate: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    notes: '',
    status: 'Draft', // Use string value directly
    shippingCost: 0,
    shippingAddress: '',
    shippingMethod: '',
    taxRate: 0,
    taxAmount: 0,
    currency: 'USD',
    items: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    availableStock: 0
  });
  const [itemToRemove, setItemToRemove] = useState(null);
  const [openRemoveItemDialog, setOpenRemoveItemDialog] = useState(false);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [orderForInvoice, setOrderForInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Initial state for the form data
  const initialFormState = {
    customerId: '',
    orderDate: formatDateForInput(new Date()),
    dueDate: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    notes: '',
    status: 'Draft', // Use string value directly
    shippingCost: 0,
    shippingAddress: '',
    shippingMethod: '',
    taxRate: 0,
    taxAmount: 0,
    currency: 'USD',
    items: []
  };

  // Validate user authentication and company ID when the component mounts
  const validateUserAuth = () => {
    // Check token and company ID
    const token = localStorage.getItem('token');
    const companyId = localStorage.getItem('company_id');
    const userRole = localStorage.getItem('user_role');
    
    console.log('Validating user authentication:', { 
      hasToken: !!token, 
      companyId, 
      userRole 
    });
    
    // If no token, redirect to login
    if (!token) {
      console.error('No authentication token found, redirecting to login');
      navigate('/login');
      return false;
    }
    
    // Handle missing or invalid company ID
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      console.warn('Missing or invalid company ID found in localStorage');
      
      // For Dev users, we can use a default company
      if (userRole === 'Dev') {
        console.log('Setting default company ID for Dev user');
        localStorage.setItem('company_id', '2'); // Set a default company ID for development
      } else {
        // For regular users, we need to redirect to login
        console.error('Regular user missing company ID, redirecting to login');
        localStorage.removeItem('token'); // Clear invalid authentication
        navigate('/login');
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    console.log('Orders component mounted');
    // Validate user authentication before fetching data
    if (!validateUserAuth()) {
      return; // Exit if validation fails
    }
    
    // Check if localStorage has valid company_id and user role
    const storedCompanyId = localStorage.getItem('company_id');
    const userRole = localStorage.getItem('user_role');
    console.log('Initial localStorage values:', { 
      company_id: storedCompanyId, 
      user_role: userRole,
      token: localStorage.getItem('token') ? 'Token exists' : 'No token'
    });
    
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, []);

  // Add a new effect to check for refresh parameter or selected order in URL
  useEffect(() => {
    // Check if the URL has a refresh parameter
    const searchParams = new URLSearchParams(location.search);
    const shouldRefresh = searchParams.get('refresh') === 'true';
    const selectedOrderId = searchParams.get('selected');
    
    if (shouldRefresh) {
      console.log('Refresh parameter detected in URL, refreshing orders...');
      fetchOrders();
      
      // Remove the refresh parameter from the URL without reloading the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // If there's a selected order ID in the URL, fetch and select that order
    if (selectedOrderId && orders.length > 0) {
      console.log('Selected order ID found in URL:', selectedOrderId);
      const order = orders.find(o => o.id.toString() === selectedOrderId.toString());
      
      if (order) {
        console.log('Found matching order, selecting it');
        handleOrderSelect(order);
      } else {
        console.log('Order not found in current list, fetching it directly');
        // Order not found in current list, fetch it directly
        const fetchSelectedOrder = async () => {
          try {
            const result = await orderService.getById(selectedOrderId);
            if (result.success && result.data) {
              handleOrderSelect(result.data);
            } else {
              showSnackbar('Failed to load selected order', 'error');
            }
          } catch (err) {
            console.error('Error fetching selected order:', err);
            showSnackbar('Error loading selected order', 'error');
          }
        };
        
        fetchSelectedOrder();
      }
      
      // Clear the selected parameter from URL
      const clearedParams = new URLSearchParams(location.search);
      clearedParams.delete('selected');
      window.history.replaceState(
        {},
        '',
        clearedParams.toString() ? `?${clearedParams.toString()}` : window.location.pathname
      );
    }
  }, [location.search, orders]);

  // Update fetchOrders to better handle complex JSON with circular references
  const fetchOrders = async () => {
    setLoading(true);
    showSnackbar('Refreshing orders list...', 'info');
    
    try {
      const companyId = localStorage.getItem('company_id');
      console.log('Fetching orders for company ID:', companyId);
      
      // Validate company ID and make sure it's a number
      let validCompanyId = companyId;
      if (!validCompanyId || validCompanyId === 'null' || validCompanyId === 'undefined') {
        console.warn('Invalid company ID in localStorage');
        validCompanyId = '2'; // Set default company ID for testing
        localStorage.setItem('company_id', validCompanyId);
      }
      
      // Make sure it's a valid number
      const companyIdInt = parseInt(validCompanyId, 10);
      if (isNaN(companyIdInt)) {
        throw new Error('Invalid company ID');
      }
      
      // First make sure customers are loaded (for customer name lookup)
      if (!customers || customers.length === 0) {
        await fetchCustomers();
      }
      
      // Request orders from the service
      const result = await orderService.getByCompanyId(companyIdInt);
      
      if (result.success) {
        console.log('Orders fetched:', result.data);
        
        // Check if we have a complex JSON structure with $values property
        const ordersData = result.data && result.data.$values 
          ? result.data.$values 
          : Array.isArray(result.data) 
            ? result.data 
            : [];
        
        console.log(`Received ${ordersData.length} orders from API`);
        
        // Process the orders to handle complex JSON structure with circular references
        const processedOrders = ordersData.map(order => {
          // Create a clean order object without circular references
          
          // First, extract the customer name with a more robust approach
          const customerName = order.customerName || 
                              (order.customer && typeof order.customer === 'object' ? order.customer.name : null) || 
                              (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer');
          
          const cleanOrder = {
            id: order.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            companyId: order.companyId,
            customerId: order.customerId,
            orderNumber: order.orderNumber,
            orderDate: order.orderDate,
            dueDate: order.dueDate,
            status: order.status,
            notes: order.notes,
            currency: order.currency,
            shippingAddress: order.shippingAddress,
            shippingMethod: order.shippingMethod,
            trackingNumber: order.trackingNumber,
            shippingCost: parseFloat(order.shippingCost || 0),
            taxRate: parseFloat(order.taxRate || 0),
            taxAmount: parseFloat(order.taxAmount || 0),
            subTotal: parseFloat(order.subTotal || 0),
            totalAmount: parseFloat(order.totalAmount || 0),
            total: parseFloat(order.totalAmount || order.total || 0),
            customerName: customerName // Use the reliably extracted customer name
          };
          
          // Handle order items properly
          const items = [];
          if (order.items && order.items.$values && Array.isArray(order.items.$values)) {
            // Process items with $values structure
            items.push(...order.items.$values.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.product ? item.product.name : 'Unknown Product',
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || 0)
            })));
          } else if (order.items && Array.isArray(order.items)) {
            // Process items as regular array
            items.push(...order.items.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || 0)
            })));
          } else if (order.orderItems) {
            // Handle if items are in orderItems property
            const orderItems = Array.isArray(order.orderItems) 
              ? order.orderItems 
              : (order.orderItems.$values || []);
              
            items.push(...orderItems.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseFloat(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              totalAmount: parseFloat(item.totalAmount || 0),
              total: parseFloat(item.totalAmount || item.total || 0)
            })));
          }
          
          cleanOrder.items = items;
          
          // Store the complete customer object if available, or create a minimal one
          if (order.customer && typeof order.customer === 'object') {
            cleanOrder.customer = {
              id: order.customer.id,
              name: order.customer.name || customerName, // Ensure name is available
              email: order.customer.email,
              phone: order.customer.phone,
              address: order.customer.address
            };
          } else if (order.customerId) {
            // If we have a customer ID but no customer object, create a minimal one
            cleanOrder.customer = {
              id: order.customerId,
              name: customerName
            };
          } else {
            // Ensure there's always at least a minimal customer object
            cleanOrder.customer = {
              id: 0,
              name: 'Unknown Customer'
            };
          }
          
          return cleanOrder;
        });
        
        setOrders(processedOrders);
        setLoading(false);
      } else {
        console.error('Failed to fetch orders:', result.message);
        setOrders([]);
        setError(result.message || 'Failed to fetch orders');
        showSnackbar(result.message || 'Failed to fetch orders', 'error');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
      setError(err.message || 'Failed to fetch orders');
      showSnackbar(err.message || 'Failed to fetch orders', 'error');
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const userRole = localStorage.getItem('user_role');
      
      let result;
      if (userRole === 'Dev') {
        result = await customerService.getAll();
      } else {
        result = await customerService.getByCompanyId(companyId);
      }
      
      if (result.success) {
        setCustomers(Array.isArray(result.data) ? result.data : []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const userRole = localStorage.getItem('user_role');
      
      let result;
      if (userRole === 'Dev') {
        result = await productService.getAll();
      } else {
        result = await productService.getByCompanyId(companyId);
      }
      
      if (result.success) {
        setProducts(Array.isArray(result.data) ? result.data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (order = null) => {
    if (order) {
      // Check if this is coming from selectedOrder (detail view)
      const isFromDetail = order === selectedOrder;
      console.log(`Opening edit dialog from ${isFromDetail ? 'detail view' : 'list view'}:`, order);
      
      // For list view clicks, we need to fetch full order details first
      if (!isFromDetail) {
        console.log('Fetching complete order details for editing...');
        const fetchOrderDetails = async () => {
          try {
            setLoading(true);
            const result = await orderService.getById(order.id);
            if (result.success) {
              console.log("Order details loaded for edit:", result.data);
              const completeOrder = result.data;
              configureEditDialog(completeOrder);
            } else {
              showSnackbar('Failed to load order details for editing', 'error');
              console.error('Failed to load order details for editing:', result.message);
            }
          } catch (err) {
            console.error('Error loading order details for editing:', err);
            showSnackbar('Error loading order details for editing', 'error');
          } finally {
            setLoading(false);
          }
        };
        
        // Start the fetch operation
        fetchOrderDetails();
        return; // Exit early, dialog will be opened after fetch completes
      }
      
      // If we're editing from the detail view, we already have the full order data
      configureEditDialog(order);
    } else {
      console.log("Creating new order - initializing form");
      setFormData(initialFormState);
      setIsEditing(false);
      setOpenDialog(true);
    }
  };
  
  // Helper function to set up the edit dialog with order data
  const configureEditDialog = (order) => {
    // Check if user has permission to edit this order
    const companyId = parseInt(localStorage.getItem('company_id') || '1');
    const userRole = localStorage.getItem('user_role');
    
    if (order.companyId !== companyId && userRole !== 'Dev') {
      showSnackbar('You can only edit orders that belong to your company', 'error');
      return;
    }
    
    // Handle status value consistently - convert string status to numeric value for form select
    let statusValue = 0; // Default to Draft
    if (typeof order.status === 'number') {
      statusValue = order.status;
    } else if (typeof order.status === 'string') {
      // If it's already a number as string like "0", "1", etc.
      if (!isNaN(parseInt(order.status))) {
        statusValue = parseInt(order.status);
      } else {
        // Find the status value from the label
        const matchingStatus = orderStatuses.find(s => s.label === order.status || s.stringValue === order.status);
        statusValue = matchingStatus ? matchingStatus.value : 0;
      }
    }
    
    console.log('DEBUG - Order status value being used for edit:', {
      originalStatus: order.status,
      statusValue,
      type: typeof statusValue
    });
    
    // Ensure order items are properly set
    let orderItems = [];
    
    // Handle different item structures
    if (order.items && order.items.$values && Array.isArray(order.items.$values)) {
      // Process items with $values structure
      orderItems = order.items.$values;
    } else if (order.items && Array.isArray(order.items)) {
      // Process items as regular array
      orderItems = order.items;
    } else if (order.orderItems) {
      // Handle if items are in orderItems property
      orderItems = Array.isArray(order.orderItems) 
        ? order.orderItems 
        : (order.orderItems.$values || []);
    }
    
    console.log(`Order items for edit (count: ${orderItems.length}):`, orderItems);
    
    // Map items to ensure they have all required properties including productName
    const mappedItems = orderItems.map(item => ({
      id: item.id,
      productId: item.productId || (item.product ? item.product.id : null),
      productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
      quantity: parseInt(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      discount: parseFloat(item.discount) || 0,
      total: parseFloat(item.totalAmount || item.total || (item.quantity * item.unitPrice)) || 0
    }));
    
    // Debug the shipping cost value we're receiving
    console.log('DEBUG - Original shipping cost value:', {
      rawValue: order.shippingCost,
      type: typeof order.shippingCost,
      parsedFloat: parseFloat(order.shippingCost || 0)
    });
    
    // Ensure we have a valid number for shipping cost, defaulting to 0 if not present
    const shippingCost = parseFloat(order.shippingCost || 0);
    
    const formDataToSet = {
      ...order,
      id: order.id, // Make sure ID is included for update
      customerId: (order.customerId || '').toString(),
      orderDate: formatDateForInput(order.orderDate),
      dueDate: formatDateForInput(order.dueDate),
      status: statusValue,
      shippingCost: shippingCost, // Explicitly use the parsed float value
      shippingAddress: order.shippingAddress || '',
      shippingMethod: order.shippingMethod || '',
      trackingNumber: order.trackingNumber || '',
      taxRate: parseFloat(order.taxRate || 0),
      taxAmount: parseFloat(order.taxAmount || 0),
      currency: order.currency || 'USD', // Ensure currency is set
      items: mappedItems
    };
    
    console.log("Setting form data for edit:", {
      ...formDataToSet,
      status: formDataToSet.status, // Log status explicitly to verify
      currency: formDataToSet.currency, // Log currency explicitly to verify
      shippingCost: formDataToSet.shippingCost // Log explicitly to verify the value
    });
    
    setFormData(formDataToSet);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'status') {
      // Convert numeric status for the internal state
      const statusValue = parseInt(value);
      
      // For statusValue we use the numeric value directly
      setFormData(prev => ({
        ...prev,
        [name]: statusValue
      }));
    } else {
      const newFormData = {
        ...formData,
        [name]: value
      };
      
      setFormData(newFormData);
      
      // Recalculate tax amount when tax rate changes
      if (name === 'taxRate') {
        calculateTaxAmount(newFormData);
      }
    }
  };

  // Calculates taxAmount based on items and taxRate
  const calculateTaxAmount = (data) => {
    if (!data.items || data.items.length === 0) return;
    
    const subtotal = calculateOrderTotal(data.items);
    const taxRate = parseFloat(data.taxRate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    
    // Update both taxAmount and subtotal to ensure consistency
    setFormData(prev => ({
      ...prev,
      taxAmount: taxAmount,
      subTotal: subtotal
    }));
  };

  // Calculate totals whenever items change or tax rate/shipping cost changes
  useEffect(() => {
    if (formData.items && formData.items.length > 0) {
      calculateTaxAmount(formData);
    }
  }, [formData.items, formData.taxRate, formData.shippingCost]);

  const handleSubmit = async () => {
    try {
      // Much stronger validation for customer
      if (!formData.customerId || formData.customerId === '' || formData.customerId === 'null') {
        showSnackbar('Please select a valid customer', 'error');
        return;
      }
      
      // Find the customer for our reference - with additional validation
      const selectedCustomer = customers.find(c => c.id.toString() === formData.customerId.toString());
      if (!selectedCustomer || !selectedCustomer.name) {
        showSnackbar('Selected customer is invalid or missing required information', 'error');
        return;
      }
      
      // Ensure date is set
      if (!formData.orderDate) {
        // Set to today's date if missing
        formData.orderDate = formatDateForInput(new Date());
      }
      
      // Parse the status value
      const statusValue = parseInt(formData.status) || 0;
      const isCancelled = statusValue === 5;
      const isDraft = statusValue === 0;
      const wasDraft = isEditing && selectedOrder && 
                       (selectedOrder.status === 0 || selectedOrder.status === '0' || selectedOrder.status === 'Draft');
      
      // Find the string status for the backend
      const statusString = typeof formData.status === 'string' && isNaN(parseInt(formData.status)) 
        ? formData.status // Already a string like "Draft"
        : orderStatuses.find(s => s.value === statusValue)?.stringValue || 'Draft';
      
      // Validate dates
      const validateDate = (dateStr) => {
        if (!dateStr) return false;
        
        // Check YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          // Month is 0-based in JavaScript Date
          const date = new Date(year, month - 1, day);
          return !isNaN(date.getTime());
        }
        
        // Try regular Date parsing
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      };
      
      // Check if dates are valid
      if (!validateDate(formData.orderDate)) {
        showSnackbar('Invalid order date format. Please use YYYY-MM-DD format.', 'error');
        return;
      }
      
      if (formData.dueDate && !validateDate(formData.dueDate)) {
        showSnackbar('Invalid due date format. Please use YYYY-MM-DD format.', 'error');
        return;
      }
      
      // Check if all products have enough stock, but only for non-draft orders
      if (!isDraft) {
        const stockIssues = [];
        
        for (const item of formData.items) {
          const product = products.find(p => p.id === parseInt(item.productId));
          if (!product) continue;
          
          const requestedQuantity = parseInt(item.quantity) || 0;
          const availableStock = product.stockQuantity || 0;
          
          if (requestedQuantity > availableStock) {
            stockIssues.push(`${product.name}: Requested ${requestedQuantity} but only ${availableStock} available`);
          }
        }
        
        if (stockIssues.length > 0) {
          showSnackbar(`Stock issues found: ${stockIssues.join('; ')}`, 'error');
          return;
        }
      }
      
      setLoading(true);
      
      // Get username for database FK constraints
      const username = localStorage.getItem('username') || localStorage.getItem('user_name') || 'system';
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      
      // Helper function to prepare order items in a consistent format
      const prepareOrderItems = (items = [], orderId = null, isUpdate = false) => {
        return items.map(item => {
          // Create a clean item object with only the properties backend expects
          return {
            id: isUpdate && item.id ? item.id : null, // Include ID only for updates and if it exists
            productId: parseInt(item.productId) || 0,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            description: item.description || item.productName || `Product #${item.productId}`,
            taxRate: parseFloat(item.taxRate) || 0,
            discount: parseFloat(item.discount) || 0,
            orderId: orderId ? parseInt(orderId) : null,
            [isUpdate ? 'updatedBy' : 'createdBy']: username
          };
        });
      };
      
      let result;
      if (isEditing && selectedOrder) {
        // Create update order payload
        const updatePayload = {
          id: selectedOrder.id,
          customerId: parseInt(formData.customerId) || selectedOrder.customerId,
          orderDate: formData.orderDate,
          dueDate: formData.dueDate,
          // Status needs to be sent as a numeric value for UpdateOrderDto (OrderStatus enum)
          status: parseInt(formData.status),
          notes: formData.notes || '',
          shippingAddress: formData.shippingAddress || '',
          shippingMethod: formData.shippingMethod || '',
          shippingCost: parseFloat(formData.shippingCost) || 0,
          trackingNumber: formData.trackingNumber || '',
          taxRate: parseFloat(formData.taxRate) || 0,
          currency: formData.currency || selectedOrder.currency || 'USD',
          updatedBy: username,
          items: prepareOrderItems(formData.items, selectedOrder.id, true)
        };
        
        console.log('Updating order with payload:', {
          ...updatePayload,
          status: updatePayload.status, // Log the status value explicitly
          statusName: orderStatuses.find(s => s.value === updatePayload.status)?.label || 'Unknown'
        });
        result = await orderService.update(selectedOrder.id, updatePayload);
      } else {
        // Create new order payload with explicit customer information
        const createPayload = {
          customerId: parseInt(formData.customerId),
          companyId: companyId,
          orderDate: formData.orderDate,
          dueDate: formData.dueDate,
          status: statusString, // Use the string status value for create
          notes: formData.notes || '',
          shippingAddress: formData.shippingAddress || '',
          shippingMethod: formData.shippingMethod || '',
          shippingCost: parseFloat(formData.shippingCost) || 0,
          trackingNumber: formData.trackingNumber || '',
          taxRate: parseFloat(formData.taxRate) || 0,
          currency: formData.currency || 'USD',
          createdBy: username,
          customerName: selectedCustomer.name, // Add customer name explicitly
          customer: { // Include full customer object to help the API
            id: parseInt(formData.customerId),
            name: selectedCustomer.name,
            // Add other customer properties we have
            email: selectedCustomer.email,
            phone: selectedCustomer.phone
          },
          items: prepareOrderItems(formData.items, null, false)
        };
        
        console.log('Creating order with payload:', createPayload);
        result = await orderService.create(createPayload);
        
        if (!result.success && result.message && result.message.includes('Duplicate order number')) {
          // If we encounter a duplicate order number that wasn't automatically resolved,
          // try again with a completely different approach
          console.log('Adding unique identifier and retrying order creation...');
          
          // Add both timestamp and random values to ensure uniqueness
          const timestamp = new Date().toISOString();
          const random = Math.floor(Math.random() * 10000);
          
          const retryPayload = {
            ...createPayload,
            notes: (createPayload.notes || '') + ` [Manual retry: ${timestamp}-${random}]`
          };
          
          console.log('Retrying with modified payload');
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          result = await orderService.create(retryPayload);
          
          // If it still fails, try one more time with an even longer delay
          if (!result.success && result.message && result.message.includes('Duplicate order number')) {
            console.log('Second retry attempt with longer delay...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const finalRetryPayload = {
              ...retryPayload,
              notes: retryPayload.notes + ` [Final retry: ${new Date().getTime()}]`
            };
            
            result = await orderService.create(finalRetryPayload);
          }
        }
      }
      
      if (result.success) {
        showSnackbar(`Order ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        
        // Update stock in these cases:
        // 1. New non-draft orders
        // 2. Existing orders changing from draft to non-draft
        // 3. Don't update stock for Draft orders
        // 4. Restore stock when order status changes to Cancelled (5)
        
        // Handle stock updates based on order status
        if (isCancelled && isEditing && selectedOrder) {
          // Restore stock quantities when order is cancelled
          console.log('Order cancelled - restoring previous stock quantities');
          
          for (const item of selectedOrder.items || []) {
            const product = products.find(p => p.id === parseInt(item.productId));
            if (!product) continue;
            
            const returnQuantity = parseInt(item.quantity) || 0;
            const newStockQuantity = (product.stockQuantity || 0) + returnQuantity;
            
            try {
              await productService.updateStock(product.id, newStockQuantity);
              console.log(`Restored ${returnQuantity} units to product ${product.id}`);
            } catch (error) {
              console.error(`Failed to restore stock for product ${product.id}:`, error);
            }
          }
        } else if (!isDraft && (!isEditing || wasDraft)) {
          // Normal stock reduction for non-draft orders that are:
          // - New orders that aren't drafts
          // - Or existing orders changing from draft to non-draft
          console.log('Processing stock update for non-draft order');
          
          for (const item of formData.items) {
            const product = products.find(p => p.id === parseInt(item.productId));
            if (!product) continue;
            
            const requestedQuantity = parseInt(item.quantity) || 0;
            const newStockQuantity = (product.stockQuantity || 0) - requestedQuantity;
            
            try {
              await productService.updateStock(product.id, Math.max(0, newStockQuantity));
              console.log(`Reduced ${requestedQuantity} units from product ${product.id}`);
            } catch (error) {
              console.error(`Failed to update stock for product ${product.id}:`, error);
            }
          }
        } else {
          console.log(`No stock updates needed for order with status: ${getStatusText(statusValue)}`);
        }
        
        // Update company revenue when an order is newly completed
        const isCompleted = statusValue === 6; // Check if order is being set to Completed
        const wasCompleted = isEditing && selectedOrder && selectedOrder.status === 6; // Check if it was already completed
        
        if (isCompleted && !wasCompleted) {
          // Calculate the grand total to add to revenue
          const subtotal = calculateOrderTotal(formData.items);
          const taxAmount = subtotal * (parseFloat(formData.taxRate || 0) / 100);
          const shippingCost = parseFloat(formData.shippingCost || 0);
          const grandTotal = subtotal + taxAmount + shippingCost;
          
          console.log('Updating company revenue with completed order total:', grandTotal);
          
          try {
            const revenueResult = await dashboardService.updateCompanyRevenue(grandTotal);
            if (revenueResult.success) {
              console.log('Company revenue updated successfully');
            } else {
              console.error('Failed to update company revenue:', revenueResult.message);
            }
          } catch (error) {
            console.error('Error updating company revenue:', error);
          }
        }
        
        handleCloseDialog();
        fetchOrders();
        fetchProducts(); // Refresh products to get updated stock values
      } else {
        // Check for specific validation errors
        if (result.error && result.error.errors) {
          console.error('Validation errors:', result.error.errors);
          
          // Format validation errors for display
          let errorMessages = '';
          
          // Safely handle different validation error formats
          const errorsObj = result.error.errors;
          if (typeof errorsObj === 'object') {
            // Process error object into a string
            errorMessages = Object.entries(errorsObj)
              .map(([field, messages]) => {
                // Check if messages is an array
                if (Array.isArray(messages)) {
                  return `${field}: ${messages.join(', ')}`;
                } else if (typeof messages === 'string') {
                  return `${field}: ${messages}`;
                } else {
                  return `${field}: Invalid value`;
                }
              })
              .join('\n');
          } else {
            errorMessages = 'Validation error occurred';
          }
          
          showSnackbar(`Validation errors: ${errorMessages}`, 'error');
        } else {
          showSnackbar(result.message || 'An error occurred', 'error');
        }
        console.error('Operation failed:', result);
      }
    } catch (err) {
      console.error('Order operation error:', err);
      showSnackbar(`Failed to ${isEditing ? 'update' : 'create'} order: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (order) => {
    // Check if user has permission to delete this order
    const companyId = parseInt(localStorage.getItem('company_id') || '1');
    const userRole = localStorage.getItem('user_role');
    
    if (order.companyId !== companyId && userRole !== 'Dev') {
      showSnackbar('You can only delete orders that belong to your company', 'error');
      return;
    }
    
    setOrderToDelete(order);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    try {
      // Double check permissions
      const companyId = parseInt(localStorage.getItem('company_id') || '1');
      const userRole = localStorage.getItem('user_role');
      
      if (orderToDelete.companyId !== companyId && userRole !== 'Dev') {
        showSnackbar('You can only delete orders that belong to your company', 'error');
        setOpenDeleteDialog(false);
        setOrderToDelete(null);
        return;
      }
      
      const result = await orderService.delete(orderToDelete.id);
      if (result.success) {
        showSnackbar('Order deleted successfully', 'success');
        fetchOrders();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      showSnackbar('Failed to delete order', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setOrderToDelete(null);
    }
  };

  const handleOrderSelect = (order) => {
    // Fetch full order details to ensure we have all items
    const fetchOrderDetails = async (orderId) => {
      try {
        setLoading(true);
        const result = await orderService.getById(orderId);
        if (result.success) {
          console.log("Order details loaded:", result.data);
          
          // Check if we need to map OrderItems to items for consistency
          let orderData = result.data;
          
          // Handle circular references JSON structure
          if (orderData.$id) {
            console.log("Detected complex JSON structure with $id references");
            // Create a clean order object
            
            // Extract customer name with a comprehensive approach
            const customerName = orderData.customerName || 
                                (orderData.customer && typeof orderData.customer === 'object' ? orderData.customer.name : null) ||
                                (orderData.customerId ? `Customer #${orderData.customerId}` : 'Unknown Customer');
            
            orderData = {
              id: orderData.id,
              companyId: orderData.companyId,
              customerId: orderData.customerId,
              orderNumber: orderData.orderNumber,
              orderDate: orderData.orderDate,
              dueDate: orderData.dueDate,
              status: orderData.status,
              notes: orderData.notes,
              currency: orderData.currency,
              shippingAddress: orderData.shippingAddress,
              shippingMethod: orderData.shippingMethod,
              trackingNumber: orderData.trackingNumber,
              shippingCost: parseFloat(orderData.shippingCost || 0),
              taxRate: parseFloat(orderData.taxRate || 0),
              taxAmount: parseFloat(orderData.taxAmount || 0),
              subTotal: parseFloat(orderData.subTotal || 0),
              totalAmount: parseFloat(orderData.totalAmount || 0),
              total: parseFloat(orderData.totalAmount || orderData.total || 0),
              customerName: customerName,
              customer: orderData.customer ? {
                id: orderData.customer.id,
                name: orderData.customer.name || customerName, // Ensure name is available
                email: orderData.customer.email,
                phone: orderData.customer.phone,
                address: orderData.customer.address
              } : {
                // Create a minimal customer object if missing
                id: orderData.customerId || 0,
                name: customerName
              }
            };
            
            // Handle items with $values structure
            if (orderData.items && orderData.items.$values) {
              orderData.items = orderData.items.$values.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.product ? item.product.name : 'Unknown Product',
                quantity: parseInt(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice || 0),
                discount: parseFloat(item.discount || 0),
                totalAmount: parseFloat(item.totalAmount || 0),
                total: parseFloat(item.totalAmount || item.total || 0)
              }));
            }
          }
          
          // Ensure items array is properly set (check both orderItems and items properties)
          if (!orderData.items && orderData.orderItems) {
            console.log("Mapping orderItems to items for frontend consistency");
            const orderItems = Array.isArray(orderData.orderItems) 
              ? orderData.orderItems 
              : (orderData.orderItems.$values || []);
            
            orderData.items = orderItems.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName || (item.product ? item.product.name : 'Unknown Product'),
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              total: parseFloat(item.totalAmount || item.total || 0)
            }));
          } else if (!orderData.items) {
            // If no items array is found, create an empty one
            orderData.items = [];
          }
          
          // Ensure customer information is always available
          if (!orderData.customer || !orderData.customerName) {
            const customerName = orderData.customerName || 
                                (orderData.customerId ? `Customer #${orderData.customerId}` : 'Unknown Customer');
            
            if (!orderData.customer) {
              orderData.customer = {
                id: orderData.customerId || 0,
                name: customerName
              };
            }
            
            if (!orderData.customerName) {
              orderData.customerName = customerName;
            }
            
            // If customer object exists but name is missing, set it
            if (orderData.customer && !orderData.customer.name) {
              orderData.customer.name = customerName;
            }
          }
          
          // Ensure status is properly set
          if (orderData.status === undefined || orderData.status === null) {
            console.warn("Order has no status, defaulting to Draft");
            orderData.status = 0; // Draft
          }
          
          console.log("Final order data with items:", orderData);
          setSelectedOrder(orderData);
        } else {
          showSnackbar('Failed to load order details', 'error');
          console.error('Failed to load order details:', result.message);
        }
      } catch (err) {
        console.error('Error loading order details:', err);
        showSnackbar('Error loading order details', 'error');
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchOrderDetails(order.id);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  const handleCreateInvoice = async (orderId) => {
    // Open confirmation dialog instead of creating immediately
    const orderDetails = orders.find(o => o.id === orderId) || selectedOrder;
    setOrderForInvoice(orderDetails);
    setOpenInvoiceDialog(true);
  };
  
  const handleCreateInvoiceConfirm = async () => {
    if (!orderForInvoice) return;
    
    try {
      setLoading(true);
      const result = await invoiceService.createFromOrder(orderForInvoice.id);
      
      if (result.success) {
        showSnackbar('Invoice created successfully!', 'success');
        // Use React Router's navigate with query param to indicate new invoice
        navigate(`/invoices?created=true&orderId=${orderForInvoice.id}&invoiceId=${result.data?.id || ''}`);
      } else {
        showSnackbar('Failed to create invoice: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showSnackbar('Error creating invoice', 'error');
    } finally {
      setLoading(false);
      setOpenInvoiceDialog(false);
      setOrderForInvoice(null);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenItemDialog = () => {
    setItemFormData({
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      availableStock: 0
    });
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  const handleItemInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name === 'productId' && value) {
      const selectedProduct = products.find(p => p.id.toString() === value);
      if (selectedProduct) {
        setItemFormData(prev => ({
          ...prev,
          [name]: value,
          unitPrice: selectedProduct.unitPrice,
          availableStock: selectedProduct.stockQuantity || 0
        }));
        
        // Show stock information
        if (selectedProduct.stockQuantity <= 0) {
          showSnackbar(`Warning: ${selectedProduct.name} is out of stock!`, 'warning');
        } else if (selectedProduct.stockQuantity < 5) {
          showSnackbar(`Warning: Only ${selectedProduct.stockQuantity} units of ${selectedProduct.name} left in stock`, 'warning');
        }
        
        return;
      }
    }
    
    setItemFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddItem = () => {
    const selectedProduct = products.find(p => p.id.toString() === itemFormData.productId);
    
    if (!selectedProduct) {
      showSnackbar('Please select a product', 'error');
      return;
    }
    
    // Check if there's enough stock
    const requestedQuantity = parseInt(itemFormData.quantity) || 1;
    const availableStock = selectedProduct.stockQuantity || 0;
    
    if (availableStock <= 0) {
      showSnackbar(`Cannot add ${selectedProduct.name}: Product is out of stock`, 'error');
      return;
    }
    
    if (requestedQuantity > availableStock) {
      showSnackbar(`Cannot add ${requestedQuantity} units of ${selectedProduct.name}: Only ${availableStock} units available in stock`, 'error');
      return;
    }
    
    // Get the username
    const username = localStorage.getItem('username');
    
    // Convert values to appropriate types and ensure they're valid
    const quantity = parseInt(itemFormData.quantity) || 1;
    const unitPrice = parseFloat(itemFormData.unitPrice) || 0;
    const discount = parseFloat(itemFormData.discount) || 0;
    
    // Calculate total with proper numeric operations
    const total = (quantity * unitPrice) * (1 - discount / 100);
    
    const newItem = {
      productId: parseInt(itemFormData.productId),
      productName: selectedProduct.name,
      quantity: quantity,
      unitPrice: unitPrice,
      discount: discount,
      description: selectedProduct.description || selectedProduct.name || `Product #${itemFormData.productId}`,
      taxRate: 0,
      total: total,
      availableStock: availableStock,
      createdBy: username // Add username to item for FK constraint
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    handleCloseItemDialog();
  };

  const handleRemoveItemClick = (index) => {
    setItemToRemove(index);
    setOpenRemoveItemDialog(true);
  };

  const handleRemoveItemConfirm = () => {
    if (itemToRemove === null) return;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== itemToRemove)
    }));
    
    setOpenRemoveItemDialog(false);
    setItemToRemove(null);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusText = (status) => {
    // Handle all possible status values safely
    if (status === undefined || status === null) {
      return 'Draft'; // Default to Draft for undefined status
    }
    
    // Handle both numeric and string statuses
    let statusInfo;
    
    if (typeof status === 'number') {
      statusInfo = orderStatuses.find(s => s.value === status);
    } else if (typeof status === 'string' && !isNaN(parseInt(status))) {
      statusInfo = orderStatuses.find(s => s.value === parseInt(status));
    } else if (typeof status === 'string') {
      statusInfo = orderStatuses.find(s => s.stringValue === status || s.label === status);
    }
    
    // Fallback if status not found
    if (!statusInfo) {
      return status?.toString() || 'Unknown';
    }
    
    return statusInfo.label;
  };

  // Update the filterOrders function to include status filtering
  const filterOrders = () => {
    // Get URL parameters
    const searchParams = new URLSearchParams(location.search);
    const showAllOrders = searchParams.get('showAll') === 'true';
    const debugMode = searchParams.get('debug') === 'true';
    
    console.log("Filtering orders, total count:", orders.length, 
      "showAllOrders:", showAllOrders,
      "debugMode:", debugMode);
    
    // First ensure all orders are properly processed with required fields
    let visibleOrders = orders.map(order => {
      // Create a fixed copy to display
      const fixedOrder = { ...order };
      
      // Make sure we have an ID
      if (!fixedOrder.id) {
        fixedOrder.id = `gen-${Math.random().toString(36).substring(2, 11)}`;
        if (debugMode) console.log(`Auto-generated ID for order with number ${fixedOrder.orderNumber || 'unknown'}: ${fixedOrder.id}`);
      }
      
      // Fill in missing order number if needed
      if (!fixedOrder.orderNumber) {
        const timestamp = new Date().getTime();
        fixedOrder.orderNumber = `ORD-${fixedOrder.customerId || 'X'}-${timestamp.toString().slice(-4)}`;
        if (debugMode) console.log(`Generated order number for order ${fixedOrder.id}: ${fixedOrder.orderNumber}`);
      }
      
      return fixedOrder;
    });
    
    // DEDUPLICATION: Only remove true duplicates in the system
    // A true duplicate is an order with exactly the same ID
    if (!showAllOrders) {
      const seenIds = new Set();
      const duplicates = [];
      
      visibleOrders = visibleOrders.filter(order => {
        // If we've seen this exact ID before, it's a duplicate
        if (order.id && seenIds.has(order.id)) {
          duplicates.push(order);
          if (debugMode) console.log(`Filtered out duplicate order with ID ${order.id}`);
          return false;
        }
        
        // Record that we've seen this ID
        if (order.id) {
          seenIds.add(order.id);
        }
        
        return true;
      });
      
      if (duplicates.length > 0 && debugMode) {
        console.log(`Removed ${duplicates.length} duplicate orders:`, duplicates);
      }
    }
    
    // Filter by status if a specific status is selected
    if (statusFilter !== 'all') {
      const statusValue = parseInt(statusFilter);
      visibleOrders = visibleOrders.filter(order => {
        // Handle both numeric and string status values
        if (typeof order.status === 'number') {
          return order.status === statusValue;
        } else if (typeof order.status === 'string' && !isNaN(parseInt(order.status))) {
          return parseInt(order.status) === statusValue;
        } else if (typeof order.status === 'string') {
          const statusObj = orderStatuses.find(s => s.stringValue === order.status || s.label === order.status);
          return statusObj?.value === statusValue;
        }
        return false;
      });
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      visibleOrders = visibleOrders.filter(order => 
        String(order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.customerName || order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(getStatusText(order.status) || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (debugMode) {
        console.log(`Search filtered to ${visibleOrders.length} orders matching "${searchTerm}"`);
      }
    }
    
    return visibleOrders;
  };

  const filteredOrders = filterOrders();

  const calculateOrderTotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }
    
    return items.reduce((total, item) => {
      // Convert all values to numbers and handle discount correctly
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discount) || 0;
      
      // Calculate item total with discount applied
      const itemTotal = (quantity * unitPrice) * (1 - discount / 100);
      
      // Return a properly rounded number
      return total + parseFloat(itemTotal.toFixed(2));
    }, 0);
  };
  
  const getOrderGrandTotal = () => {
    const subtotal = calculateOrderTotal(formData.items);
    const taxRate = parseFloat(formData.taxRate || 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const shippingCost = parseFloat(formData.shippingCost || 0);
    
    // Double-check the calculation to ensure it's correct
    const calculatedTotal = subtotal + taxAmount + shippingCost;
    
    console.log('Order grand total calculation:', {
      subtotal,
      taxRate,
      taxAmount,
      shippingCost,
      calculatedTotal
    });
    
    // Calculate grand total and round to 2 decimal places
    return parseFloat(calculatedTotal.toFixed(2));
  };

  const calculateGrandTotalFromSelectedOrder = () => {
    if (!selectedOrder) return 0;
    
    // If total or totalAmount is already set, use it
    if (selectedOrder.total) {
      return parseFloat(selectedOrder.total);
    }
    if (selectedOrder.totalAmount) {
      return parseFloat(selectedOrder.totalAmount);
    }
    
    // Otherwise calculate it from the components
    let subtotal = 0;
    
    // Calculate total from items if available
    if (selectedOrder.items && selectedOrder.items.length > 0) {
      subtotal = selectedOrder.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const itemTotal = (quantity * unitPrice) * (1 - discount / 100);
        return sum + itemTotal;
      }, 0);
    } else if (selectedOrder.orderItems && selectedOrder.orderItems.length > 0) {
      // Handle orderItems which might be a regular array or have $values structure
      const orderItems = Array.isArray(selectedOrder.orderItems) 
        ? selectedOrder.orderItems 
        : (selectedOrder.orderItems.$values || []);
      
      subtotal = orderItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        const itemTotal = (quantity * unitPrice) * (1 - discount / 100);
        return sum + itemTotal;
      }, 0);
    } else {
      // If no items, use subtotal field if available
      subtotal = parseFloat(selectedOrder.subTotal || 0);
    }
    
    // Calculate tax and shipping
    const taxRate = parseFloat(selectedOrder.taxRate || 0);
    const taxAmount = parseFloat(selectedOrder.taxAmount || (subtotal * (taxRate / 100)));
    const shippingCost = parseFloat(selectedOrder.shippingCost || 0);
    
    // Calculate and double-check the total
    const calculatedTotal = subtotal + taxAmount + shippingCost;
    
    console.log('Selected order total calculation:', {
      subtotal,
      taxRate,
      taxAmount,
      shippingCost,
      calculatedTotal,
      storedTotal: selectedOrder.total || selectedOrder.totalAmount
    });
    
    // Return grand total
    return parseFloat(calculatedTotal.toFixed(2));
  };

  const getStatusChip = (status) => {
    // Handle both numeric and string statuses
    let statusInfo;
    
    if (typeof status === 'number') {
      statusInfo = orderStatuses.find(s => s.value === status);
    } else if (typeof status === 'string' && !isNaN(parseInt(status))) {
      statusInfo = orderStatuses.find(s => s.value === parseInt(status));
    } else if (typeof status === 'string') {
      statusInfo = orderStatuses.find(s => s.stringValue === status || s.label === status);
    }
    
    // Fallback if status not found
    if (!statusInfo) {
      console.warn(`Unknown status value: ${status}, using Draft as fallback`);
      // Default to Draft (0) if no matching status is found
      statusInfo = orderStatuses[0]; // Draft
    }
    
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
      {selectedOrder ? (
        // Order details view
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Order #{selectedOrder.orderNumber}
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => handleOpenDialog(selectedOrder)}
                sx={{ mr: 2 }}
              >
                Edit Order
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<InvoiceIcon />}
                onClick={() => handleCreateInvoice(selectedOrder.id)}
                sx={{ mr: 2 }}
                disabled={selectedOrder.status === 'Draft' || selectedOrder.status === 0 || loading}
              >
                Create Invoice
              </Button>
              <Button 
                variant="outlined" 
                color="info"
                startIcon={<PsychologyIcon />}
                onClick={() => {
                  // Navigate to the standalone AI analysis page
                  if (selectedOrder && selectedOrder.id) {
                    navigate(`/order-analysis/${selectedOrder.id}`);
                  } else {
                    showSnackbar('No order selected for analysis', 'error');
                  }
                }}
                sx={{ mr: 2 }}
              >
                AI Analysis
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleCloseDetails}
              >
                Back to Orders
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 3, p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Order Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography>{selectedOrder.customerName || selectedOrder.customer?.name || 'Unknown Customer'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Order Date:</Typography>
                  <Typography>
                    {selectedOrder.orderDate ? 
                      (() => {
                        try {
                          return new Date(selectedOrder.orderDate).toLocaleDateString();
                        } catch (error) {
                          console.error('Invalid date:', selectedOrder.orderDate);
                          return 'Invalid Date';
                        }
                      })() 
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Status:</Typography>
                  {getStatusChip(selectedOrder.status)}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Shipping Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Shipping Address:</Typography>
                  <Typography>{selectedOrder.shippingAddress || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Shipping Method:</Typography>
                  <Typography>{selectedOrder.shippingMethod || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Tracking Number:</Typography>
                  <Typography>{selectedOrder.trackingNumber || 'N/A'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ p: 2 }}>Order Items</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName || item.product?.name || 'Unknown Product'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{(item.unitPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell align="right">{(item.total || item.totalAmount || (item.quantity * item.unitPrice) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                    selectedOrder.orderItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName || item.product?.name || 'Unknown Product'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{(item.unitPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>{item.discount}%</TableCell>
                        <TableCell align="right">{(item.total || item.totalAmount || (item.quantity * item.unitPrice) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No items found</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Subtotal:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedOrder.subTotal?.toFixed(2) || '0.00'} {selectedOrder.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Tax ({selectedOrder.taxRate || 0}%):</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedOrder.taxAmount?.toFixed(2) || (selectedOrder.subTotal * (selectedOrder.taxRate || 0) / 100).toFixed(2) || '0.00'} {selectedOrder.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Shipping Cost:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedOrder.shippingCost?.toFixed(2) || '0.00'} {selectedOrder.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>Grand Total:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em', color: 'primary.main' }}>
                      {calculateGrandTotalFromSelectedOrder().toFixed(2)} {selectedOrder.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {selectedOrder.notes && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <Typography>{selectedOrder.notes}</Typography>
            </Paper>
          )}
          
          {/* AI Analysis Section */}
          {showAIAnalysis && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <OrderAIAnalysis 
                orderData={selectedOrder} 
                onAnalysisComplete={(analysis) => {
                  console.log('AI analysis completed:', analysis);
                  // You can store this in state or do something with it if needed
                }}
              />
            </Paper>
          )}
        </Box>
      ) : (
        // Orders list view
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Orders Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage all your orders here. The system supports multiple orders from the same customer.
              </Typography>
              {statusFilter !== 'all' && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                    Filtered by status:
                  </Typography>
                  <Chip
                    label={orderStatuses.find(s => s.value === parseInt(statusFilter))?.label || 'Unknown'}
                    color={orderStatuses.find(s => s.value === parseInt(statusFilter))?.color || 'default'}
                    size="small"
                    onDelete={() => setStatusFilter('all')}
                  />
                </Box>
              )}
            </div>
            <Box sx={{ display: 'flex' }}>
              <Button 
                variant="outlined" 
                color="info"
                startIcon={<PsychologyIcon />}
                onClick={() => navigate('/orders-analysis')}
                sx={{ mr: 2 }}
              >
                Bulk AI Analysis
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New Order
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                variant="outlined"
                placeholder="Search orders..."
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
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {orderStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: `${status.color}.main`,
                            mr: 1
                          }} 
                        />
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchOrders}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Refresh Orders
              </Button>
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
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <OrderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No orders found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 450, textAlign: 'center' }}>
                          {searchTerm ? 
                            `No orders match the search term "${searchTerm}". Try a different search or clear the search field.` : 
                            'There are no orders in the system for your company. You can create a new order using the button above.'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          {searchTerm && (
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => setSearchTerm('')}
                            >
                              Clear Search
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                          >
                            Create New Order
                          </Button>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((order) => (
                      <TableRow 
                        key={order.id || `order-${Math.random().toString(36).substring(2, 11)}`}
                        hover
                        onClick={() => handleOrderSelect(order)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>
                          {order.customerName || 
                           (order.customer?.name) || 
                           (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer')}
                        </TableCell>
                        <TableCell>
                          {order.orderDate ? 
                            (() => {
                              try {
                                return new Date(order.orderDate).toLocaleDateString();
                              } catch (error) {
                                console.error('Invalid date:', order.orderDate);
                                return 'Invalid Date';
                              }
                            })() 
                            : new Date().toLocaleDateString()} {/* Fallback to today's date */}
                        </TableCell>
                        <TableCell>{(order.total || order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}</TableCell>
                        <TableCell>
                          {getStatusChip(order.status)}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <span>
                              
                            </span>
                          </Tooltip>
                          <Tooltip title="Create Invoice">
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateInvoice(order.id);
                                }}
                                color="secondary"
                                disabled={order.status === 0 || order.status === 'Draft' || loading}
                              >
                                <InvoiceIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(order);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
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
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {/* Order Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Order' : 'Create New Order'}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading order data...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="customerId"
                  label="Customer"
                  select
                  value={formData.customerId}
                  onChange={handleInputChange}
                  fullWidth
                  required
                >
                  <MenuItem value="">Select a customer</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="status"
                  label="Status"
                  select
                  value={
                    typeof formData.status === 'string' && isNaN(parseInt(formData.status))
                      ? orderStatuses.find(s => s.stringValue === formData.status)?.value || 0
                      : typeof formData.status === 'number'
                        ? formData.status
                        : parseInt(formData.status) || 0
                  }
                  onChange={handleInputChange}
                  fullWidth
                >
                  {orderStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: `${status.color}.main`,
                            mr: 1
                          }} 
                        />
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="orderDate"
                  label="Order Date"
                  type="date"
                  value={formData.orderDate}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="dueDate"
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
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
                  name="shippingCost"
                  label="Shipping Cost"
                  type="number"
                  value={formData.shippingCost || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="taxRate"
                  label="Tax Rate (%)"
                  type="number"
                  value={formData.taxRate || 0}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ 
                    inputProps: { min: 0, max: 100, step: 0.01 },
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="currency"
                  label="Currency"
                  value={formData.currency || 'USD'}
                  onChange={handleInputChange}
                  fullWidth
                  select
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="TRY">TRY (₺)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Order Items</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddItemIcon />}
                    onClick={handleOpenItemDialog}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items && formData.items.length > 0 ? (
                        formData.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>{item.discount}%</TableCell>
                            <TableCell align="right">{item.total.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveItemClick(index)}
                                color="error"
                              >
                                <RemoveItemIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No items added</TableCell>
                        </TableRow>
                      )}
                      {formData.items && formData.items.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Subtotal:</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {calculateOrderTotal(formData.items).toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Tax ({formData.taxRate || 0}%):</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {(calculateOrderTotal(formData.items) * (parseFloat(formData.taxRate || 0) / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Shipping Cost:</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {parseFloat(formData.shippingCost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>Grand Total:</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em', color: 'primary.main' }}>
                          {getOrderGrandTotal().toFixed(2)} {formData.currency || 'USD'}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              {/* Shipping Information Section */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Shipping Information</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Shipping Address"
                    variant="outlined"
                    multiline
                    rows={3}
                    name="shippingAddress"
                    value={formData.shippingAddress || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Shipping Method"
                    variant="outlined"
                    name="shippingMethod"
                    value={formData.shippingMethod || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tracking Number"
                    variant="outlined"
                    name="trackingNumber"
                    value={formData.trackingNumber || ''}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || !formData.customerId || (formData.items && formData.items.length === 0)}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Order Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="productId"
                label="Product"
                select
                value={itemFormData.productId}
                onChange={handleItemInputChange}
                fullWidth
                required
              >
                <MenuItem value="">Select a product</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id.toString()}>
                    {product.name} - {product.unitPrice.toFixed(2)} {product.currency}
                    <Box component="span" sx={{ 
                      ml: 1, 
                      color: product.stockQuantity <= 0 ? 'error.main' : 
                             product.stockQuantity < 5 ? 'warning.main' : 'success.main',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      (Stock: {product.stockQuantity || 0})
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={itemFormData.quantity}
                onChange={handleItemInputChange}
                fullWidth
                required
                error={itemFormData.productId && parseInt(itemFormData.quantity) > (itemFormData.availableStock || 0)}
                helperText={itemFormData.productId && parseInt(itemFormData.quantity) > (itemFormData.availableStock || 0) 
                  ? `Only ${itemFormData.availableStock || 0} units available` 
                  : ''}
                InputProps={{ 
                  inputProps: { min: 1 },
                  endAdornment: itemFormData.productId && (
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mr: 1 }}>
                      Available: {itemFormData.availableStock || 0}
                    </Box>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="unitPrice"
                label="Unit Price"
                type="number"
                value={itemFormData.unitPrice}
                onChange={handleItemInputChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="discount"
                label="Discount (%)"
                type="number"
                value={itemFormData.discount}
                onChange={handleItemInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>Cancel</Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained" 
            color="primary"
            disabled={
              !itemFormData.productId || 
              itemFormData.quantity < 1 || 
              parseInt(itemFormData.quantity) > (itemFormData.availableStock || 0) ||
              (itemFormData.availableStock || 0) <= 0
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Item Confirmation Dialog */}
      <Dialog open={openRemoveItemDialog} onClose={() => setOpenRemoveItemDialog(false)}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this item from the order?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveItemDialog(false)}>Cancel</Button>
          <Button onClick={handleRemoveItemConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Order Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete order #{orderToDelete?.orderNumber}?
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

      {/* Create Invoice Confirmation Dialog */}
      <Dialog open={openInvoiceDialog} onClose={() => setOpenInvoiceDialog(false)}>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to create an invoice from order #{orderForInvoice?.orderNumber}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will create a new invoice with all items and financial details from this order.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvoiceDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateInvoiceConfirm} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Invoice'}
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

export default Orders;
