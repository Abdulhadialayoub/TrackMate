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
  Chip
} from '@mui/material';
import { Psychology as PsychologyIcon, ArrowBack } from '@mui/icons-material';
import { aiService } from '../services/aiService';
import { orderService } from '../services/orderService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStatusName, getStatusColor } from '../utils/orderUtils';

/**
 * Component for analyzing orders with AI and displaying recommendations
 * @param {Object} props - Component props
 * @param {Object} props.orderData - Order data to analyze (optional, can be loaded from params)
 * @param {Function} props.onAnalysisComplete - Callback when analysis completes
 */
const OrderAIAnalysis = ({ orderData: propOrderData, onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [orderData, setOrderData] = useState(propOrderData || null);

  const { orderId } = useParams(); // Get orderId from URL parameters
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone = location.pathname.includes('/order-analysis');
  
  // Fetch order data if orderId is provided and we don't have orderData from props
  useEffect(() => {
    if (orderId && !orderData) {
      const fetchOrderData = async () => {
        setOrderLoading(true);
        try {
          const result = await orderService.getById(orderId);
          if (result.success) {
            setOrderData(result.data);
          } else {
            setError(`Failed to load order #${orderId}: ${result.message}`);
          }
        } catch (err) {
          console.error('Error fetching order:', err);
          setError(`Error loading order #${orderId}`);
        } finally {
          setOrderLoading(false);
        }
      };

      fetchOrderData();
    }
  }, [orderId, orderData]);

  const handleAnalyzeOrder = async () => {
    if (!orderData || !orderData.id) {
      setError('No valid order data to analyze');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiService.analyzeOrder(orderData);
      
      if (result.success) {
        setAnalysis(result.data.comment);
        if (onAnalysisComplete) {
          onAnalysisComplete(result.data.comment);
        }
      } else {
        setError(result.message || 'Failed to analyze order');
      }
    } catch (err) {
      console.error('Error in AI analysis:', err);
      setError('An unexpected error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOrder = () => {
    navigate(`/orders?selected=${orderData.id}`);
  };

  // Render loading state while fetching order
  if (orderLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading order data...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ mt: isStandalone ? 2 : 3 }}>
      {isStandalone && (
        <Container maxWidth="lg">
          <Paper sx={{ p: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" component="h1">
                  AI Order Analysis
                </Typography>
                {orderData && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mr: 1 }}>
                      Order #{orderData.orderNumber}
                    </Typography>
                    <Chip 
                      label={getStatusName(orderData.status)} 
                      color={getStatusColor(orderData.status)}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
              {orderData && (
                <Button 
                  variant="outlined" 
                  startIcon={<ArrowBack />} 
                  onClick={handleBackToOrder}
                >
                  Back to Order
                </Button>
              )}
            </Box>
            
            {!orderData && !error && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No order selected. Please go back to the Orders page and select an order to analyze.
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {orderData && !analysis && (
              <Box sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2, maxWidth: 600, textAlign: 'center' }}>
                  Click the button below to analyze this order with AI. Our system will provide recommendations based on the order details.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                  onClick={handleAnalyzeOrder}
                  disabled={loading || !orderData}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Order'}
                </Button>
              </Box>
            )}
            
            {analysis && (
              <Card variant="outlined" sx={{ mb: 2, backgroundColor: 'rgba(200, 250, 205, 0.2)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    AI Recommendations:
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {analysis}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Container>
      )}
      
      {!isStandalone && (
        <>
          <Typography variant="h6" gutterBottom>
            AI Order Analysis
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!analysis && (
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
              onClick={handleAnalyzeOrder}
              disabled={loading || !orderData}
              sx={{ mb: 2 }}
            >
              {loading ? 'Analyzing...' : 'Analyze Order'}
            </Button>
          )}
          
          {analysis && (
            <Card variant="outlined" sx={{ mb: 2, backgroundColor: 'rgba(200, 250, 205, 0.2)' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  AI Recommendations:
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {analysis}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default OrderAIAnalysis; 