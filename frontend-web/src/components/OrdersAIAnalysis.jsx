import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent, 
  Alert,
  Paper,
  Container,
  Divider,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Psychology as PsychologyIcon, 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon 
} from '@mui/icons-material';
import { aiService } from '../services/aiService';
import { orderService } from '../services/orderService';
import { useNavigate } from 'react-router-dom';
import { ORDER_STATUS, ORDER_STATUS_NAMES, getStatusName, getStatusColor } from '../utils/orderUtils';

const OrdersAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Map status values to objects with label and color for UI
  const orderStatuses = Object.entries(ORDER_STATUS_NAMES).map(([value, label]) => ({
    value: parseInt(value),
    label,
    color: getStatusColor(parseInt(value)),
    stringValue: label
  }));

  // Fetch all orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const companyId = localStorage.getItem('company_id');
      console.log('Fetching orders for company ID:', companyId);
      
      if (!companyId) {
        throw new Error('No company ID found');
      }
      
      const result = await orderService.getByCompanyId(companyId);
      
      if (result.success) {
        console.log(`Fetched ${result.data.length} orders successfully`);
        setOrders(result.data);
      } else {
        setError('Failed to fetch orders: ' + result.message);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error fetching orders: ' + err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAnalyzeAllOrders = async () => {
    if (!orders || orders.length === 0) {
      setError('No orders available to analyze');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get filtered orders for analysis
      const ordersToAnalyze = filterOrders();
      
      if (ordersToAnalyze.length === 0) {
        setError('No orders match your filters for analysis');
        setLoading(false);
        return;
      }
      
      console.log(`Sending ${ordersToAnalyze.length} orders for bulk analysis`);
      
      // Send the orders for analysis
      const result = await aiService.analyzeOrders(ordersToAnalyze);
      
      if (result.success) {
        setAnalysis(result.data.comment);
      } else {
        setError(result.message || 'Failed to analyze orders');
      }
    } catch (err) {
      console.error('Error in AI analysis:', err);
      setError('An unexpected error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOrders = () => {
    navigate('/orders');
  };

  // Filter orders based on search term and status filter
  const filterOrders = () => {
    let filteredOrders = [...orders];
    
    // Filter by status
    if (statusFilter !== 'all') {
      const statusValue = parseInt(statusFilter);
      filteredOrders = filteredOrders.filter(order => {
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
    
    // Filter by search term
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        String(order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.customerName || order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredOrders;
  };

  // Get the count of orders that match the current filters
  const getFilteredOrdersCount = () => {
    return filterOrders().length;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" component="h1">
              Bulk AI Order Analysis
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Analyze trends and patterns across all your orders
            </Typography>
          </div>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBackToOrders}
          >
            Back to Orders
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter Orders for Analysis
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
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
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Orders selected:
                </Typography>
                <Chip 
                  label={ordersLoading ? "..." : getFilteredOrdersCount()} 
                  color="primary" 
                  size="small" 
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {ordersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading orders...
            </Typography>
          </Box>
        ) : orders.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No orders available for analysis. Please create some orders first.
          </Alert>
        ) : (
          !analysis && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom sx={{ maxWidth: 600, textAlign: 'center', mb: 3 }}>
                Click the button below to analyze {getFilteredOrdersCount()} orders. Our AI will identify patterns, trends, and provide business recommendations based on your order data.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                onClick={handleAnalyzeAllOrders}
                disabled={loading || getFilteredOrdersCount() === 0}
              >
                {loading ? 'Analyzing...' : `Analyze ${getFilteredOrdersCount()} Orders`}
              </Button>
            </Box>
          )
        )}

        {/* Analysis results */}
        {analysis && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            <Card variant="outlined" sx={{ mb: 2, backgroundColor: 'rgba(200, 250, 205, 0.2)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
                  Business Intelligence & Recommendations
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {analysis}
                </Typography>
              </CardContent>
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setAnalysis(null)}
                sx={{ mr: 2 }}
              >
                Reset Analysis
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                onClick={handleAnalyzeAllOrders}
                disabled={loading}
              >
                Run New Analysis
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default OrdersAIAnalysis; 