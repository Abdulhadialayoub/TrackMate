import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Title, Card, Paragraph, Button, ActivityIndicator, Divider, List, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { customerService } from '../../services/api';

const CustomerDetailsScreen = ({ route, navigation }) => {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await customerService.getCustomerById(customerId);
      
      if (result && result.success === false) {
        // Handle API error response
        console.error('API returned error:', result.message);
        setError(result.message || 'Failed to load customer details');
        setCustomer(null);
      } else {
        // Handle successful response (both direct data and API wrapper format)
        let customerData = result;
        
        // Check if result has success property (API wrapper format)
        if (result && typeof result === 'object' && 'success' in result) {
          customerData = result.data;
        }
        
        console.log('Customer data retrieved:', customerData);
        setCustomer(customerData);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Failed to load customer details');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit customer screen with the customer data
    navigation.navigate('EditCustomer', { customer });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await customerService.deleteCustomer(customerId);
              
              if (result && result.success === false) {
                console.error('API returned error:', result.message);
                Alert.alert('Error', result.message || 'Failed to delete customer');
              } else {
                Alert.alert('Success', 'Customer deleted successfully');
                navigation.goBack();
              }
            } catch (err) {
              console.error('Error deleting customer:', err);
              Alert.alert('Error', 'Failed to delete customer');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const getStatusColor = (status, type) => {
    if (type === 'order') {
      switch (status) {
        case 0: return '#6b7280'; // Draft - gray
        case 1: return '#f59e0b'; // Pending - amber
        case 2: return '#3b82f6'; // Confirmed - blue
        case 3: return '#8b5cf6'; // Shipped - purple
        case 4: return '#10b981'; // Delivered - green
        case 5: return '#ef4444'; // Cancelled - red
        case 6: return '#10b981'; // Completed - green
        default: return '#6b7280';
      }
    } else { // invoice
      switch (status) {
        case 0: return '#6b7280'; // Draft - gray
        case 1: return '#3b82f6'; // Sent - blue
        case 2: return '#10b981'; // Paid - green
        case 3: return '#ef4444'; // Overdue - red
        case 4: return '#9ca3af'; // Cancelled - gray
        default: return '#6b7280';
      }
    }
  };

  const getStatusLabel = (status, type) => {
    if (type === 'order') {
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
    } else { // invoice
      switch (status) {
        case 0: return 'Draft';
        case 1: return 'Sent';
        case 2: return 'Paid';
        case 3: return 'Overdue';
        case 4: return 'Cancelled';
        default: return 'Unknown';
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading customer details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchCustomerDetails} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <Text>Customer not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  // Extract orders from customer data
  const orders = customer?.orders?.$values || [];
  
  // Extract invoices from customer data
  const invoices = customer?.invoices?.$values || [];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account-circle" size={60} color="#0284c7" />
            </View>
            <View style={styles.headerInfo}>
              <Title style={styles.customerName}>{customer.name}</Title>
              {customer.company && (
                <Text style={styles.companyName}>{customer.company}</Text>
              )}
            </View>
          </View>

          <View style={styles.contactActions}>
            {customer.phone && (
              <Button 
                mode="outlined" 
                icon="phone" 
                onPress={handleCall}
                style={styles.contactButton}
              >
                Call
              </Button>
            )}
            
            {customer.email && (
              <Button 
                mode="outlined" 
                icon="email" 
                onPress={handleEmail}
                style={styles.contactButton}
              >
                Email
              </Button>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <List.Section>
            <List.Subheader style={styles.sectionTitle}>Contact Information</List.Subheader>
            
            {customer.email && (
              <List.Item
                title="Email"
                description={customer.email}
                left={props => <List.Icon {...props} icon="email" />}
              />
            )}
            
            {customer.phone && (
              <List.Item
                title="Phone"
                description={customer.phone}
                left={props => <List.Icon {...props} icon="phone" />}
              />
            )}
            
            {customer.address && (
              <List.Item
                title="Address"
                description={customer.address}
                left={props => <List.Icon {...props} icon="map-marker" />}
              />
            )}
          </List.Section>
          
          {customer.notes && (
            <>
              <Divider style={styles.divider} />
              <List.Section>
                <List.Subheader style={styles.sectionTitle}>Notes</List.Subheader>
                <Paragraph style={styles.notes}>{customer.notes}</Paragraph>
              </List.Section>
            </>
          )}
          
          <Divider style={styles.divider} />
          
          <List.Section>
            <List.Subheader style={styles.sectionTitle}>Customer Activity</List.Subheader>
            
            {orders.length > 0 || invoices.length > 0 ? (
              <>
                {orders.length > 0 && (
                  <>
                    <Text style={styles.activitySubtitle}>Orders ({orders.length})</Text>
                    {orders.map((order, index) => (
                      <List.Item
                        key={`order-${order.id || index}`}
                        title={order.orderNumber || `Order #${order.id}`}
                        description={`Date: ${new Date(order.orderDate).toLocaleDateString()}`}
                        left={props => <List.Icon {...props} icon="package-variant" />}
                        right={props => (
                          <Chip 
                            mode="outlined" 
                            style={[styles.statusChip, {borderColor: getStatusColor(order.status, 'order')}]}
                            textStyle={{color: getStatusColor(order.status, 'order')}}
                          >
                            {getStatusLabel(order.status, 'order')}
                          </Chip>
                        )}
                        onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                      />
                    ))}
                  </>
                )}
                
                {invoices.length > 0 && (
                  <>
                    <Text style={styles.activitySubtitle}>Invoices ({invoices.length})</Text>
                    {invoices.map((invoice, index) => (
                      <List.Item
                        key={`invoice-${invoice.id || index}`}
                        title={invoice.invoiceNumber || `Invoice #${invoice.id}`}
                        description={`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`}
                        left={props => <List.Icon {...props} icon="file-document-outline" />}
                        right={props => (
                          <Chip 
                            mode="outlined" 
                            style={[styles.statusChip, {borderColor: getStatusColor(invoice.status, 'invoice')}]}
                            textStyle={{color: getStatusColor(invoice.status, 'invoice')}}
                          >
                            {getStatusLabel(invoice.status, 'invoice')}
                          </Chip>
                        )}
                        onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: invoice.id })}
                      />
                    ))}
                  </>
                )}
                
                <View style={styles.activityButtonsContainer}>
                  <Button 
                    mode="text" 
                    icon="history" 
                    onPress={() => navigation.navigate('CustomerOrders', { customerId })}
                  >
                    All Orders
                  </Button>
                  <Button 
                    mode="text" 
                    icon="receipt" 
                    onPress={() => navigation.navigate('InvoicesScreen', { customerId })}
                  >
                    All Invoices
                  </Button>
                </View>
              </>
            ) : (
              <Text style={styles.activityPlaceholder}>
                No activity found for this customer.
              </Text>
            )}
          </List.Section>
        </Card.Content>
      </Card>
      
      <View style={styles.actionButtons}>
        <Button 
          mode="contained" 
          icon="pencil" 
          onPress={handleEdit}
          style={[styles.actionButton, styles.editButton]}
          color="#0284c7"
        >
          Edit
        </Button>
        <Button 
          mode="outlined" 
          icon="delete" 
          onPress={handleDelete}
          style={[styles.actionButton, styles.deleteButton]}
          color="#ef4444"
        >
          Delete
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
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  errorText: {
    marginVertical: 10,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 22,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#6b7280',
  },
  contactActions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactButton: {
    marginRight: 8,
    borderColor: '#0284c7',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    paddingHorizontal: 0,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    paddingHorizontal: 16,
  },
  activityPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  activitySubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  statusChip: {
    height: 28,
    alignSelf: 'center',
  },
  activityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#0284c7',
  },
  deleteButton: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
});

export default CustomerDetailsScreen;