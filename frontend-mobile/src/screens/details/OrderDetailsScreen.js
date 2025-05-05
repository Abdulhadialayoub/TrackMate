import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Divider, Chip, Badge, Menu, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService } from '../../services';
import { StatusBar } from 'expo-status-bar';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching order details for ID:', orderId);
      
      // Fetch real order data from API
      const result = await orderService.getById(orderId);
      
      if (result.success && result.data) {
        console.log('Order details retrieved:', result.data);
        
        // Set the order with valid data
        setOrder(result.data);
        
        // Calculate order total if needed
        if (result.data.total !== undefined) {
          setOrderTotal(result.data.total);
        } else if (result.data.items && result.data.items.length > 0) {
          const total = result.data.items.reduce(
            (sum, item) => sum + (item.total || (item.quantity * (item.unitPrice || 0)) || 0), 
            0
          );
          setOrderTotal(total);
        }
      } else {
        console.error('Error fetching order details:', result.message);
        setError(result.message || 'Failed to load order details');
        Alert.alert('Error', 'Failed to load order details');
      }
    } catch (error) {
      console.error('Exception fetching order details:', error);
      setError('Failed to load order details');
      Alert.alert('Error', 'An error occurred while loading the order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setMenuVisible(false);
      
      // Convert status label to numeric value if needed
      let statusValue = newStatus;
      if (typeof newStatus === 'string') {
        switch (newStatus.toLowerCase()) {
          case 'draft': statusValue = 0; break;
          case 'pending': statusValue = 1; break;
          case 'confirmed': statusValue = 2; break;
          case 'shipped': statusValue = 3; break;
          case 'delivered': statusValue = 4; break;
          case 'cancelled': statusValue = 5; break;
          case 'completed': statusValue = 6; break;
        }
      }
      
      const result = await orderService.updateStatus(orderId, statusValue);
      
      if (result.success) {
        setOrder(result.data);
        Alert.alert('Success', 'Order status updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    // Convert to number if it's a string
    const statusNum = typeof status === 'string' && !isNaN(parseInt(status))
      ? parseInt(status)
      : status;
      
    switch (statusNum) {
      case 0: // Draft
        return '#6b7280'; // gray-500
      case 1: // Pending
        return '#f59e0b'; // amber-500
      case 2: // Confirmed
        return '#3b82f6'; // blue-500
      case 3: // Shipped
        return '#8b5cf6'; // purple-500
      case 4: // Delivered
        return '#10b981'; // emerald-500
      case 5: // Cancelled
        return '#ef4444'; // red-500
      case 6: // Completed
        return '#059669'; // emerald-600
      default:
        return '#6b7280'; // gray-500
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchOrderDetails}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title style={styles.orderId}>
              {order.orderNumber ? `#${order.orderNumber}` : `Order #${order.id}`}
            </Title>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) + '20' }]}
                    textStyle={{ color: getStatusColor(order.status) }}
                  >
                    {getStatusLabel(order.status)}
                  </Chip>
                </TouchableOpacity>
              }
            >
              <Menu.Item onPress={() => handleStatusChange(0)} title="Mark as Draft" />
              <Menu.Item onPress={() => handleStatusChange(1)} title="Mark as Pending" />
              <Menu.Item onPress={() => handleStatusChange(2)} title="Mark as Confirmed" />
              <Menu.Item onPress={() => handleStatusChange(3)} title="Mark as Shipped" />
              <Menu.Item onPress={() => handleStatusChange(4)} title="Mark as Delivered" />
              <Menu.Item onPress={() => handleStatusChange(5)} title="Mark as Cancelled" />
              <Menu.Item onPress={() => handleStatusChange(6)} title="Mark as Completed" />
            </Menu>
          </View>
          <Paragraph style={styles.date}>
            <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
            {' '}Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Unknown'}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Customer Information</Title>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customerName || (order.customer ? order.customer.name : 'Unknown Customer')}</Text>
            {order.customer && (
              <>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
                  <Text style={styles.infoText}>{order.customer.email || 'No email'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                  <Text style={styles.infoText}>{order.customer.phone || 'No phone'}</Text>
                </View>
              </>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Shipping Address</Title>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              {order.shippingAddress || (order.customer ? order.customer.address : 'No shipping address')}
            </Text>
          </View>
          
          {order.notes && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Notes</Title>
              <Paragraph style={styles.notes}>{order.notes}</Paragraph>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionTitleRow}>
            <Title style={styles.sectionTitle}>Order Items</Title>
            <Badge size={24}>{order.items?.length || 0}</Badge>
          </View>
          
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <View key={item.id || index}>
                {index > 0 && <Divider style={styles.itemDivider} />}
                <View style={styles.orderItem}>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.productName || item.name || 'Unnamed Product'}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity || 0} x ${((item.unitPrice || item.price || 0).toFixed(2))}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    ${((item.total || ((item.quantity || 0) * (item.unitPrice || item.price || 0))) || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Paragraph style={styles.noItemsText}>No items in this order</Paragraph>
          )}
          
          <Divider style={[styles.divider, styles.totalDivider]} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>
              ${((order.subtotal || orderTotal) || 0).toFixed(2)}
            </Text>
          </View>
          
          {(order.taxRate > 0 || order.tax > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax {order.taxRate > 0 ? `(${order.taxRate}%)` : ''}
              </Text>
              <Text style={styles.totalAmount}>
                ${((order.tax || ((orderTotal * (order.taxRate || 0)) / 100)) || 0).toFixed(2)}
              </Text>
            </View>
          )}
          
          {(order.shippingCost > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalAmount}>${(order.shippingCost || 0).toFixed(2)}</Text>
            </View>
          )}
          
          {(order.discount > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalAmount}>-${(order.discount || 0).toFixed(2)}</Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>
              ${((order.total || orderTotal) || 0).toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Payment Information</Title>
          <View style={styles.paymentInfo}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="credit-card" size={16} color="#6b7280" />
              <Text style={styles.infoLabel}>Method:</Text>
              <Text style={styles.infoValue}>{order.paymentMethod || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cash-check" size={16} color="#6b7280" />
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { 
                  color: order.paymentStatus === 'Paid' || order.isPaid ? '#10b981' : 
                         order.paymentStatus === 'Overdue' ? '#ef4444' : '#f59e0b' 
                }
              ]}>
                {order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionButtons}>
        <Button 
          mode="contained" 
          icon="square-edit-outline" 
          onPress={() => navigation.navigate('NewOrder', { orderId: orderId })}
          style={styles.actionButton}
          color="#0284c7"
        >
          Edit Order
        </Button>
        <Button 
          mode="outlined" 
          icon="file-document-outline" 
          onPress={() => Alert.alert('Generate Invoice', 'Would you like to create an invoice for this order?', [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Create Invoice', 
              onPress: () => navigation.navigate('NewInvoice', { orderId: orderId })
            }
          ])}
          style={styles.actionButton}
          color="#0284c7"
        >
          Generate Invoice
        </Button>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 20,
  },
  statusChip: {
    height: 28,
  },
  date: {
    color: '#6b7280',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    color: '#4b5563',
    flex: 1,
  },
  infoLabel: {
    marginLeft: 8,
    color: '#6b7280',
    width: 60,
  },
  infoValue: {
    flex: 1,
    color: '#4b5563',
  },
  divider: {
    marginVertical: 16,
  },
  itemDivider: {
    marginVertical: 8,
  },
  notes: {
    color: '#4b5563',
    fontStyle: 'italic',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  itemTotal: {
    fontWeight: 'bold',
  },
  totalDivider: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtotalDivider: {
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: '#6b7280',
  },
  totalAmount: {
    fontWeight: '500',
  },
  discountText: {
    color: '#10b981',
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  grandTotalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0284c7',
  },
  grandTotalRow: {
    marginTop: 8,
  },
  paymentInfo: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'column',
    padding: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  noItemsText: {
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
});

export default OrderDetailsScreen;