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
  Surface,
  Chip,
  Menu
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService } from '../../services';
import { aiService } from '../../services';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';
import { ORDER_STATUS_NAMES, ORDER_STATUS_COLORS, getStatusName, getStatusColor } from '../../utils/orderUtils';

const OrdersAIAnalysis = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

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

  const orderStatuses = [
    { value: 0, label: ORDER_STATUS_NAMES[0], color: ORDER_STATUS_COLORS[0] },
    { value: 1, label: ORDER_STATUS_NAMES[1], color: ORDER_STATUS_COLORS[1] },
    { value: 2, label: ORDER_STATUS_NAMES[2], color: ORDER_STATUS_COLORS[2] },
    { value: 3, label: ORDER_STATUS_NAMES[3], color: ORDER_STATUS_COLORS[3] },
    { value: 4, label: ORDER_STATUS_NAMES[4], color: ORDER_STATUS_COLORS[4] },
    { value: 5, label: ORDER_STATUS_NAMES[5], color: ORDER_STATUS_COLORS[5] },
    { value: 6, label: ORDER_STATUS_NAMES[6], color: ORDER_STATUS_COLORS[6] }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const companyId = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_ID);
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
        setError(result.message || 'Failed to analyze orders');
      }
    } catch (err) {
      console.error('Error in AI analysis:', err);
      setError('An unexpected error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on status filter
  const filterOrders = () => {
    if (statusFilter === 'all') {
      return orders;
    }
    
    const statusValue = parseInt(statusFilter);
    return orders.filter(order => {
      // Handle both numeric and string status values
      if (typeof order.status === 'number') {
        return order.status === statusValue;
      } else if (typeof order.status === 'string' && !isNaN(parseInt(order.status))) {
        return parseInt(order.status) === statusValue;
      } else if (typeof order.status === 'string') {
        const statusObj = orderStatuses.find(s => s.label === order.status);
        return statusObj?.value === statusValue;
      }
      return false;
    });
  };

  // Get the count of orders that match the current filters
  const getFilteredOrdersCount = () => {
    return filterOrders().length;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Surface style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={handleGoBack} 
          style={styles.backButton}
        />
        <Title style={styles.headerTitle}>Bulk AI Order Analysis</Title>
      </Surface>
      
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Filter Orders for Analysis</Title>
            
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Status:</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setMenuVisible(true)}
                    style={styles.filterButton}
                  >
                    {statusFilter === 'all' ? 'All Statuses' : 
                      orderStatuses.find(s => s.value === parseInt(statusFilter))?.label || 'All'}
                  </Button>
                }
              >
                <Menu.Item onPress={() => {
                  setStatusFilter('all');
                  setMenuVisible(false);
                }} title="All Statuses" />
                <Divider />
                {orderStatuses.map((status) => (
                  <Menu.Item 
                    key={status.value} 
                    onPress={() => {
                      setStatusFilter(status.value.toString());
                      setMenuVisible(false);
                    }} 
                    title={status.label}
                    leadingIcon="circle"
                    titleStyle={{ color: status.color }}
                  />
                ))}
              </Menu>
            </View>
            
            <View style={styles.orderCountContainer}>
              <Text style={styles.orderCountLabel}>Orders selected:</Text>
              <Chip mode="outlined" style={styles.orderCountChip}>
                {ordersLoading ? '...' : getFilteredOrdersCount()}
              </Chip>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {ordersLoading ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ marginTop: 10 }}>Loading orders...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>
                  No orders available for analysis. Please create some orders first.
                </Text>
              </View>
            ) : (
              !analysis && (
                <View style={styles.analysisPromptContainer}>
                  <MaterialCommunityIcons name="brain" size={60} color="#6366f1" style={styles.brainIcon} />
                  <Text style={styles.infoText}>
                    Click the button below to analyze {getFilteredOrdersCount()} orders. Our AI will identify patterns, trends, and provide business recommendations.
                  </Text>
                  <Button
                    mode="contained"
                    loading={loading}
                    onPress={handleAnalyzeAllOrders}
                    style={styles.analyzeButton}
                    color="#6366f1"
                    disabled={loading || getFilteredOrdersCount() === 0}
                  >
                    {loading ? 'Analyzing...' : `Analyze ${getFilteredOrdersCount()} Orders`}
                  </Button>
                </View>
              )
            )}
            
            {analysis && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <MaterialCommunityIcons name="lightbulb-on" size={24} color="#10b981" />
                  <Text style={styles.resultTitle}>Business Intelligence & Recommendations</Text>
                </View>
                <Divider style={styles.divider} />
                <Paragraph style={styles.analysisText}>
                  {analysis}
                </Paragraph>
                <View style={styles.actionsContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => setAnalysis(null)}
                    style={styles.resetButton}
                  >
                    Reset Analysis
                  </Button>
                  <Button
                    mode="contained"
                    icon="refresh"
                    loading={loading}
                    onPress={handleAnalyzeAllOrders}
                    style={styles.newAnalysisButton}
                    color="#6366f1"
                    disabled={loading}
                  >
                    Run New Analysis
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    marginRight: 12,
    color: '#4b5563',
  },
  filterButton: {
    flex: 1,
  },
  orderCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderCountLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#4b5563',
  },
  orderCountChip: {
    backgroundColor: '#e0f2fe',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    marginLeft: 8,
    flex: 1,
  },
  loadingSection: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#6b7280',
  },
  analysisPromptContainer: {
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resetButton: {
    marginRight: 12,
  },
  newAnalysisButton: {
    flex: 1,
  },
});

export default OrdersAIAnalysis; 