import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  ActivityIndicator, 
  Divider, 
  IconButton,
  Surface 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService } from '../../services';
import { aiService } from '../../services';
import { StatusBar } from 'expo-status-bar';

const OrderAIAnalysis = ({ route, navigation }) => {
  const orderId = route?.params?.orderId;
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // Helper function to handle navigation
  const handleGoBack = () => {
    // Check if we can go back
    const canGoBack = navigation.canGoBack();
    
    if (canGoBack) {
      navigation.goBack();
    } else {
      // If we can't go back, navigate to the Orders screen
      navigation.navigate('Orders');
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    } else {
      setOrderLoading(false);
      setError('No order ID provided. Please go back and select an order to analyze.');
    }
  }, [orderId]);

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
        // Handle both direct comment and nested comment structure
        if (result.comment) {
          setAnalysis(result.comment);
        } else if (result.data && result.data.comment) {
          setAnalysis(result.data.comment);
        } else {
          // If no comment is found, use the entire result as a fallback
          const analysisText = typeof result.data === 'string' ? 
            result.data : 
            JSON.stringify(result.data || result, null, 2);
          setAnalysis(analysisText);
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

  if (orderLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 10 }}>Loading order data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <Surface style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={handleGoBack} 
          style={styles.backButton}
        />
        <Title style={styles.headerTitle}>AI Order Analysis</Title>
      </Surface>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.orderTitle}>
            {orderData?.orderNumber ? `Order #${orderData.orderNumber}` : `Order ${orderData?.id}`}
          </Title>
          
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {!analysis && (
            <View style={styles.analysisContainer}>
              <MaterialCommunityIcons name="brain" size={60} color="#6366f1" style={styles.brainIcon} />
              <Text style={styles.infoText}>
                Click the button below to analyze this order with AI. Our system will provide recommendations based on the order details.
              </Text>
              <Button
                mode="contained"
                loading={loading}
                onPress={handleAnalyzeOrder}
                style={styles.analyzeButton}
                color="#6366f1"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Order'}
              </Button>
            </View>
          )}
          
          {analysis && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={24} color="#10b981" />
                <Text style={styles.resultTitle}>AI Recommendations:</Text>
              </View>
              <Divider style={styles.divider} />
              <Paragraph style={styles.analysisText}>
                {analysis}
              </Paragraph>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={handleAnalyzeOrder}
                style={styles.newAnalysisButton}
                color="#6366f1"
              >
                Run New Analysis
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
  },
  card: {
    margin: 16,
  },
  orderTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginVertical: 12,
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 8,
    textAlign: 'center',
  },
  analysisContainer: {
    alignItems: 'center',
    padding: 20,
  },
  brainIcon: {
    marginBottom: 16,
  },
  infoText: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  analyzeButton: {
    paddingHorizontal: 16,
  },
  resultContainer: {
    backgroundColor: 'rgba(209, 250, 229, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#047857',
  },
  divider: {
    marginVertical: 12,
  },
  analysisText: {
    lineHeight: 22,
  },
  newAnalysisButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default OrderAIAnalysis; 