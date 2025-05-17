import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Divider, Chip, Badge, Menu, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { orderService, invoiceService } from '../../services';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatusName, getStatusColor as getOrderStatusColor, ORDER_STATUS } from '../../utils/orderUtils';

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching order details for ID:', orderId);
      
      const result = await orderService.getById(orderId);
      
      if (result.success && result.data) {
        console.log('Order details retrieved successfully');
        setOrder(result.data);
        
        // Yüklenen sipariş verisinden company_id'yi saklayalım
        if (result.data.companyId) {
          const companyIdStr = String(result.data.companyId);
          await AsyncStorage.setItem('company_id', companyIdStr);
          console.log('Updated company_id from order details:', companyIdStr);
        }
        
        // Calculate order total
        if (result.data.total !== undefined) {
          setOrderTotal(result.data.total);
        } else if (result.data.items && Array.isArray(result.data.items) && result.data.items.length > 0) {
          const total = result.data.items.reduce(
            (sum, item) => sum + (item.total || (item.quantity * (item.unitPrice || 0)) || 0), 
            0
          );
          setOrderTotal(total);
        }
      } else {
        console.error('Failed to get order details:', result.message);
        setError(result.message || 'Failed to load order');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setMenuVisible(false);
      
      // Ensure numeric status value
      let statusValue = newStatus;
      if (typeof newStatus === 'string' && !isNaN(parseInt(newStatus))) {
        statusValue = parseInt(newStatus);
      } else if (typeof newStatus === 'string') {
        // Use the ORDER_STATUS values
        switch (newStatus.toLowerCase()) {
          case 'draft': statusValue = ORDER_STATUS.DRAFT; break;
          case 'pending': statusValue = ORDER_STATUS.PENDING; break;
          case 'confirmed': statusValue = ORDER_STATUS.CONFIRMED; break;
          case 'shipped': statusValue = ORDER_STATUS.SHIPPED; break;
          case 'delivered': statusValue = ORDER_STATUS.DELIVERED; break;
          case 'cancelled': statusValue = ORDER_STATUS.CANCELLED; break;
          case 'completed': statusValue = ORDER_STATUS.COMPLETED; break;
        }
      }

      // Create proper updateOrderDto structure
      const updateOrderDto = {
        id: orderId,
        customerId: order.customerId,
        orderDate: order.orderDate,
        dueDate: order.dueDate,
        status: statusValue, // Use numeric value
        notes: order.notes,
        shippingAddress: order.shippingAddress,
        shippingMethod: order.shippingMethod,
        shippingCost: order.shippingCost,
        trackingNumber: order.trackingNumber,
        currency: order.currency,
        updatedBy: order.updatedBy,
        items: order.items
      };

      const result = await orderService.update(orderId, updateOrderDto);
      
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

  const handleDeleteOrder = () => {
    Alert.alert(
      'Siparişi Sil',
      'Bu siparişi silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: confirmDeleteOrder
        }
      ]
    );
  };

  const confirmDeleteOrder = async () => {
    try {
      setIsDeleting(true);
      const result = await orderService.delete(orderId);
      
      if (result.success) {
        Alert.alert('Başarılı', 'Sipariş başarıyla silindi', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Hata', result.message || 'Sipariş silinemedi');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      Alert.alert('Hata', 'Sipariş silinirken bir hata oluştu');
      setIsDeleting(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      setCreatingInvoice(true);
      
      const result = await invoiceService.createFromOrder(orderId);
      
      if (result.success && result.data) {
        Alert.alert(
          'Success', 
          'Invoice created successfully', 
          [
            { 
              text: 'View Invoice', 
              onPress: () => navigation.navigate('InvoiceDetails', { invoiceId: result.data.id }) 
            },
            { 
              text: 'OK' 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'An error occurred while creating the invoice');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const getStatusColor = (status) => {
    return getOrderStatusColor(status);
  };

  const getStatusLabel = (status) => {
    return getStatusName(status);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading order details...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ marginTop: 10 }}>Sipariş siliniyor...</Text>
      </View>
    );
  }

  if (creatingInvoice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Creating invoice...</Text>
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
            <>
              <View style={styles.itemsHeaderRow}>
                <Text style={styles.itemHeader}>Product</Text>
                <Text style={styles.itemHeader}>Quantity</Text>
                <Text style={styles.itemHeader}>Price</Text>
                <Text style={styles.itemHeader}>Total</Text>
              </View>
              {order.items.map((item, index) => (
                <View key={item.id || index}>
                  {index > 0 && <Divider style={styles.itemDivider} />}
                  <View style={styles.orderItem}>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.productName || item.name || 'Unnamed Product'}</Text>
                      <Text style={styles.itemQuantity}>{item.quantity || 0}</Text>
                      <Text style={styles.itemPrice}>${(item.unitPrice || item.price || 0).toFixed(2)}</Text>
                      <Text style={styles.itemTotal}>
                        ${((item.total || ((item.quantity || 0) * (item.unitPrice || item.price || 0))) || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            }
            </>
          ) : (
            <Paragraph style={styles.noItemsText}>No items in this order</Paragraph>
          )}
          
          <Divider style={[styles.divider, styles.totalDivider]} />
          
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${order.subTotal?.toFixed(2) || orderTotal.toFixed(2)}</Text>
            </View>
            {
              order.taxRate > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax ({order.taxRate}%):</Text>
                  <Text style={styles.totalValue}>${order.taxAmount?.toFixed(2) || (orderTotal * (order.taxRate / 100)).toFixed(2)}</Text>
                </View>
              )
            }
            {
              order.shippingCost > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Shipping:</Text>
                  <Text style={styles.totalValue}>${order.shippingCost?.toFixed(2) || '0.00'}</Text>
                </View>
              )
            }
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>
                ${order.total?.toFixed(2) || (orderTotal + (order.shippingCost || 0)).toFixed(2)} {order.currency}
              </Text>
            </View>
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

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              icon="pencil" 
              onPress={() => navigation.navigate('NewOrder', { isEditing: true, orderId: order.id })}
              style={styles.editButton}
            >
              Edit
            </Button>
            
            <Button 
              mode="outlined" 
              icon="delete" 
              onPress={handleDeleteOrder}
              style={styles.deleteButton}
              color="#ef4444"
            >
              Delete
            </Button>

            <Button 
              mode="contained" 
              icon="file-document-outline" 
              onPress={handleCreateInvoice}
              style={styles.invoiceButton}
              color="#0284c7"
            >
              Create Invoice
            </Button>
            
            <Button 
              mode="contained" 
              icon="brain" 
              onPress={() => navigation.navigate('OrderAIAnalysis', { orderId: order.id })}
              style={styles.aiAnalysisButton}
              color="#6366f1"
            >
              AI Analysis
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpace} />
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
    flexDirection: 'column',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 2,
    fontWeight: '500',
    fontSize: 14,
  },
  itemQuantity: {
    flex: 0.5,
    fontSize: 14,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 0.8,
    fontSize: 14,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 0.8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemHeader: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  noItemsText: {
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  totalDivider: {
    backgroundColor: '#d1d5db',
    height: 1.5,
  },
  totalsSection: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalLabel: {
    color: '#6b7280',
  },
  totalValue: {
    color: '#4b5563',
    fontWeight: '500',
  },
  grandTotalLabel: {
    color: '#1f2937',
    fontWeight: 'bold',
    fontSize: 16,
  },
  grandTotalValue: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomSpace: {
    height: 24,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  editButton: {
    marginBottom: 8,
  },
  deleteButton: {
    marginBottom: 8,
    borderColor: '#ef4444',
  },
  invoiceButton: {
    marginBottom: 8,
  },
  aiAnalysisButton: {
    marginBottom: 8,
  },
  paymentInfo: {
    marginTop: 8,
  },
});

export default OrderDetailsScreen;