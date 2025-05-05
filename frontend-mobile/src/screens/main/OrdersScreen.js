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
        setOrders(result.data || []);
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
    showSnackbar('Cleaning up duplicate temporary orders...', 'info');
    
    // Create a map to track seen order numbers
    const seenOrderNumbers = new Map();
    const validOrders = [];
    const duplicates = [];
    
    orders.forEach(order => {
      // If this is a real order with a real ID, always keep it
      if (order.id && !order.id.toString().startsWith('temp-') && !order.orderNumber?.startsWith('TMP-')) {
        seenOrderNumbers.set(order.orderNumber, true);
        validOrders.push(order);
        return;
      }
      
      // For temporary orders, check if we've seen this order number
      if (seenOrderNumbers.has(order.orderNumber)) {
        duplicates.push(order);
      } else {
        // If we haven't seen it, mark it as seen and keep it
        seenOrderNumbers.set(order.orderNumber, true);
        validOrders.push(order);
      }
    });
    
    setOrders(validOrders);
    showSnackbar(`Removed ${duplicates.length} duplicate orders`, 'success');
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
  
  // Filter orders based on selected mode
  const filteredOrders = React.useMemo(() => {
    switch (filterMode) {
      case 'active':
        return orders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum < 4; // Draft, Pending, Confirmed, Shipped
        });
      case 'completed':
        return orders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum === 4 || statusNum === 6; // Delivered or Completed
        });
      case 'cancelled':
        return orders.filter(order => {
          const statusNum = typeof order.status === 'number' ? 
            order.status : 
            parseInt(order.status);
          return statusNum === 5; // Cancelled
        });
      case 'all':
      default:
        return orders;
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
            <Menu.Item onPress={cleanupDuplicateOrders} title="Clean Duplicates" />
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
        renderItem={({ item }) => (
          <Card 
            style={styles.orderCard} 
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            onLongPress={() => showDebugInfo(item)}
          >
            <Card.Content>
              <View style={styles.orderHeader}>
                <Title style={styles.orderCustomer}>{item.customerName || 'Unknown Customer'}</Title>
                <View style={[
                  styles.statusBadge, 
                  getStatusStyle(item.status)
                ]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Paragraph style={styles.orderNumber}>
                  #{item.orderNumber || `Order ${item.id}`}
                </Paragraph>
                <Paragraph style={styles.orderDate}>
                  Date: {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'Unknown'}
                </Paragraph>
                <Paragraph style={styles.orderTotal}>
                  ${(item.total || 0).toFixed(2)}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Button 
              mode="contained"
              onPress={() => navigation.navigate('NewOrder')}
              style={styles.emptyButton}
              color="#0284c7"
            >
              Create New Order
            </Button>
          </View>
        )}
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
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1, // Allow long customer names to shrink
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
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  orderNumber: {
    color: '#6b7280',
    fontSize: 12,
  },
  orderDate: {
    color: '#6b7280',
    flex: 1,
    marginLeft: 8,
  },
  orderTotal: {
    fontWeight: 'bold',
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