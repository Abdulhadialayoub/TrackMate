import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, FAB, Snackbar, Chip, Menu, Divider, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'completed'
  const [debugDialogVisible, setDebugDialogVisible] = useState(false);
  const [debugData, setDebugData] = useState(null);

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });
  
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const fetchOrders = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    
    try {
      // Get company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      
      console.log('Fetching orders with company ID:', companyId);
      
      // If we have a company ID, use it to filter orders
      let result;
      if (companyId) {
        result = await orderService.getByCompanyId(companyId);
      } else {
        // Otherwise fetch all orders
        result = await orderService.getAll();
      }
      
      if (result.success) {
        console.log(`Retrieved ${result.data?.length || 0} orders`);
        
        // Process orders to ensure customer names are properly displayed
        const processedOrders = result.data.map(order => {
          return {
            ...order,
            // Ensure we have a customer name with multiple fallbacks
            customerName: order.customerName || 
                        (order.customer && typeof order.customer === 'object' ? order.customer.name : null) || 
                        (order.customerId ? `Customer #${order.customerId}` : 'Unknown Customer'),
            // Ensure we have proper total calculated
            total: parseFloat(order.totalAmount || order.total || 0)
          };
        });
        
        // Web approach: Simply use all orders without filtering
        console.log(`Showing all ${processedOrders.length} orders - using web version approach`);
        setOrders(processedOrders || []);
      } else {
        console.error('Error fetching orders:', result.message);
        showSnackbar(`Error: ${result.message}`, 'error');
        setOrders([]);
      }
    } catch (error) {
      console.error('Exception fetching orders:', error);
      showSnackbar(`Error fetching orders: ${error.message || 'Unknown error'}`, 'error');
      setOrders([]);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    
    // Also refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    
    // Clean up the listener when the component is unmounted
    return unsubscribe;
  }, [navigation, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(false);
    setRefreshing(false);
  }, [fetchOrders]);

  const handleRefresh = () => {
    showSnackbar('Refreshing orders...', 'info');
    fetchOrders();
  };
  
  const handleFilterChange = (newFilter) => {
    setFilterMode(newFilter);
    closeMenu();
  };
  
  const cleanupDuplicateOrders = async () => {
    showSnackbar('Refreshing orders...', 'info');
    
    // Simply refresh the orders without removing any duplicates
    // to match the web version's behavior
    console.log(`Processing all ${orders.length} orders without removing duplicates`);
    
    // Fetch fresh data instead of filtering
    fetchOrders();
  };
  
  const toggleDebugMode = async () => {
    const currentMode = await AsyncStorage.getItem('debug_mode');
    const newMode = currentMode === 'true' ? 'false' : 'true';
    await AsyncStorage.setItem('debug_mode', newMode);
    showSnackbar(`Debug mode ${newMode === 'true' ? 'enabled' : 'disabled'}`, 'info');
    fetchOrders();
  };
  
  const showDebugInfo = (order) => {
    setDebugData(order);
    setDebugDialogVisible(true);
  };

  // Helper function to determine the status badge style
  const getStatusStyle = (status) => {
    // Check if status is a number or string
    const statusValue = typeof status === 'number' 
      ? status 
      : typeof status === 'string' && !isNaN(Number(status))
        ? Number(status)
        : null;
    
    if (statusValue === 4 || statusValue === 6 || status === 'Delivered' || status === 'Completed') {
      return styles.statusCompleted;
    } else if (statusValue === 2 || statusValue === 3 || status === 'Confirmed' || status === 'Shipped' || status === 'Processing') {
      return styles.statusProcessing;
    } else if (statusValue === 5 || status === 'Cancelled') {
      return styles.statusCancelled;
    } else {
      return styles.statusPending;
    }
  };
  
  // Helper function to get status label
  const getStatusLabel = (status) => {
    // Convert numeric status to string label
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Draft';
        case 1: return 'Pending';
        case 2: return 'Confirmed';
        case 3: return 'Shipped';
        case 4: return 'Delivered';
        case 5: return 'Cancelled';
        case 6: return 'Completed';
        default: return 'Unknown';
      }
    }
    
    // If it's a string that looks like a number, convert it
    if (typeof status === 'string' && !isNaN(Number(status))) {
      return getStatusLabel(Number(status));
    }
    
    // Otherwise, return the string status
    return status || 'Unknown';
  };
  
  // Filter orders based on selected mode - web version approach
  const filteredOrders = React.useMemo(() => {
    // First make a copy of all orders to prevent mutations
    let visibleOrders = [...orders];
    
    // Web version approach: Only filter by status and search, not by order type
    switch (filterMode) {
      case 'active':
        return visibleOrders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum < 4; // Draft, Pending, Confirmed, Shipped
        });
      case 'completed':
        return visibleOrders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum === 4 || statusNum === 6; // Delivered or Completed
        });
      case 'cancelled':
        return visibleOrders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum === 5; // Cancelled
        });
      case 'all':
      default:
        // Return all orders without any filtering
        return visibleOrders;
    }
  }, [orders, filterMode]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Text style={styles.filterText}>
          {filteredOrders.length} {filterMode !== 'all' ? `${filterMode} ` : ''}orders
        </Text>
        <View style={styles.filterActions}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <Button 
                onPress={openMenu} 
                mode="outlined" 
                icon="filter-variant" 
                compact 
                style={styles.filterButton}
              >
                Filter: {filterMode.charAt(0).toUpperCase() + filterMode.slice(1)}
              </Button>
            }
          >
            <Menu.Item onPress={() => handleFilterChange('all')} title="All Orders" />
            <Menu.Item onPress={() => handleFilterChange('active')} title="Active Orders" />
            <Menu.Item onPress={() => handleFilterChange('completed')} title="Completed Orders" />
            <Menu.Item onPress={() => handleFilterChange('cancelled')} title="Cancelled Orders" />
            <Divider />
            <Menu.Item onPress={cleanupDuplicateOrders} title="Refresh All" />
            <Menu.Item onPress={toggleDebugMode} title="Toggle Debug Mode" />
          </Menu>
          <Button 
            icon="refresh" 
            mode="text" 
            compact 
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>
      </View>
      
      <FlatList
        data={filteredOrders}
        renderItem={({ item, index }) => (
          <Card 
            style={[
              styles.orderCard, 
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
              item.status === 5 || item.status === 'Cancelled' ? styles.cancelledOrder : null
            ]} 
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            onLongPress={() => showDebugInfo(item)}
          >
            <Card.Content>
              <View style={styles.orderHeader}>
                <Title style={styles.orderNumber}>
                  {/* Display order number like web version */}
                  {item.orderNumber || `Order ${item.id}`}
                </Title>
                <View style={[
                  styles.statusBadge, 
                  getStatusStyle(item.status)
                ]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>Customer:</Text>
                <Text style={styles.customerName}>
                  {/* Use comprehensive customer name fallbacks like web version */}
                  {item.customerName || 
                   (item.customer?.name) || 
                   (item.customerId ? `Customer #${item.customerId}` : 'Unknown Customer')}
                </Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.orderFooter}>
                <View style={styles.orderDate}>
                  <Text style={styles.dateLabel}>Date:</Text>
                  <Text style={styles.dateValue}>
                    {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                <View style={styles.orderTotal}>
                  <Text style={styles.totalAmount}>
                    {parseFloat(item.total || 0).toFixed(2)} {item.currency || 'USD'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={(item, index) => {
          // Web version approach: First try to use ID
          if (item.id) {
            return `order-id-${String(item.id)}`;
          }
          // Then try to use the order number
          if (item.orderNumber) {
            return `order-num-${String(item.orderNumber)}`;
          }
          // Last resort: use index with timestamp for uniqueness
          return `order-index-${index}-${Date.now()}`;
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0284c7']}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No orders found</Text>
              <Button 
                mode="contained"
                style={styles.emptyButton}
                onPress={onRefresh}
              >
                Refresh
              </Button>
            </View>
          )
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        color="#ffffff"
        onPress={() => navigation.navigate('NewOrder')}
      />
      <Snackbar
        visible={snackbar.visible}
        onDismiss={onDismissSnackbar}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : (snackbar.type === 'success' ? '#4CAF50' : '#2196F3') }}
      >
        {snackbar.message}
      </Snackbar>
      
      <Portal>
        <Dialog
          visible={debugDialogVisible}
          onDismiss={() => setDebugDialogVisible(false)}
          style={styles.debugDialog}
        >
          <Dialog.Title>Order Debug Info</Dialog.Title>
          <Dialog.Content>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>ID:</Text>
              <Text style={styles.debugValue}>{debugData?.id}</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Order #:</Text>
              <Text style={styles.debugValue}>{debugData?.orderNumber}</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Status:</Text>
              <Text style={styles.debugValue}>{debugData?.status} ({getStatusLabel(debugData?.status)})</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Customer:</Text>
              <Text style={styles.debugValue}>{debugData?.customerName}</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Customer ID:</Text>
              <Text style={styles.debugValue}>{debugData?.customerId}</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Total:</Text>
              <Text style={styles.debugValue}>${debugData?.total?.toFixed(2)}</Text>
            </View>
            <View style={styles.debugContent}>
              <Text style={styles.debugLabel}>Items:</Text>
              <Text style={styles.debugValue}>{debugData?.items?.length || 0}</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDebugDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterText: {
    fontSize: 14,
    color: '#4b5563',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    marginRight: 8,
  },
  refreshButton: {
    minWidth: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 8,
    paddingTop: 8,
    backgroundColor: '#f3f4f6',
  },
  orderCard: {
    marginBottom: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 4,
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#f9fafb',
  },
  cancelledOrder: {
    opacity: 0.8,
    borderLeftColor: '#ef4444',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#1f2937',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    fontWeight: '500',
  },
  customerName: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    backgroundColor: '#e5e7eb',
    height: 1,
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusProcessing: {
    backgroundColor: '#e0f2fe',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#4b5563',
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0284c7',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    color: '#6b7280',
  },
  emptyButton: {
    marginTop: 8,
  },
  debugDialog: {
    maxWidth: '90%',
    alignSelf: 'center',
  },
  debugContent: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  debugLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  debugValue: {
    flex: 1,
  },
});

export default OrdersScreen;