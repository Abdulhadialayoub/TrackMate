import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Title, TextInput, Button, HelperText, ActivityIndicator, List, Divider, Chip, Card, Menu, Portal, Dialog } from 'react-native-paper';
import { orderService, customerService, productService } from '../../services';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const orderStatuses = [
  { value: 0, label: 'Draft' },
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Confirmed' },
  { value: 3, label: 'Shipped' },
  { value: 4, label: 'Delivered' },
  { value: 5, label: 'Cancelled' },
  { value: 6, label: 'Completed' }
];

const NewOrderScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const isEditing = !!orderId;
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    items: [],
    notes: '',
    shippingAddress: '',
    status: 0, // Default to Draft
  });
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productQuantities, setProductQuantities] = useState({});
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  
  useEffect(() => {
    fetchInitialData();
    
    if (isEditing) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching order details for ID: ${orderId}`);
      
      const result = await orderService.getById(orderId);
      
      if (result.success && result.data) {
        console.log('Order details fetched:', result.data);
        const orderData = result.data;
        
        // Find customer from the list
        setFormData({
          id: orderData.id,
          orderNumber: orderData.orderNumber,
          customerId: orderData.customerId,
          customerName: orderData.customerName || (orderData.customer ? orderData.customer.name : ''),
          notes: orderData.notes || '',
          shippingAddress: orderData.shippingAddress || '',
          status: orderData.status || 0,
          dueDate: orderData.dueDate,
          orderDate: orderData.orderDate
        });
        
        // Setup order items
        if (orderData.items && orderData.items.length > 0) {
          setSelectedProducts(orderData.items.map(item => ({
            id: item.productId,
            name: item.productName || 'Unknown Product',
            price: item.unitPrice || 0,
            quantity: item.quantity || 1,
            total: item.total || (item.quantity * item.unitPrice) || 0,
            orderItemId: item.id
          })));
        }
      } else {
        console.error('Failed to fetch order details:', result.message);
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'An error occurred while loading the order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Get the company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      
      console.log('Fetching data with company ID:', companyId);
      
      // Fetch customers and products using our improved services
      let customersResult, productsResult;
      
      if (companyId) {
        // If we have a company ID, use it to filter data
        [customersResult, productsResult] = await Promise.all([
          customerService.getByCompanyId(companyId),
          productService.getByCompanyId(companyId)
        ]);
      } else {
        // Otherwise get all data
        [customersResult, productsResult] = await Promise.all([
          customerService.getAll(),
          productService.getAll()
        ]);
      }
      
      // Ensure we have arrays even if the API returns errors
      setCustomers(
        customersResult.success && Array.isArray(customersResult.data) 
          ? customersResult.data 
          : []
      );
      
      setProducts(
        productsResult.success && Array.isArray(productsResult.data) 
          ? productsResult.data 
          : []
      );
      
      if (!customersResult.success) {
        console.warn('Error fetching customers:', customersResult.message);
      }
      
      if (!productsResult.success) {
        console.warn('Error fetching products:', productsResult.message);
      }
      
      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setLoadingData(false);
      Alert.alert('Error', 'Failed to load customers and products');
    }
  };
  
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };
  
  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
      shippingAddress: customer.address || '',
    });
    setShowCustomerDropdown(false);
    if (errors.customerId) {
      setErrors({ ...errors, customerId: null });
    }
  };
  
  const findProduct = (productId) => {
    return products.find(p => p.id === productId);
  };
  
  const addProduct = (product) => {
    if (!productQuantities[product.id] || parseInt(productQuantities[product.id]) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    const quantity = parseInt(productQuantities[product.id]);
    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Update existing product quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += quantity;
      updatedProducts[existingProductIndex].total = updatedProducts[existingProductIndex].quantity * updatedProducts[existingProductIndex].price;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      const unitPrice = product.unitPrice || product.price || 0;
      setSelectedProducts([
        ...selectedProducts,
        {
          id: product.id,
          name: product.name,
          price: unitPrice,
          quantity: quantity,
          total: unitPrice * quantity
        }
      ]);
    }
    
    // Clear quantity for this product
    const updatedQuantities = { ...productQuantities };
    delete updatedQuantities[product.id];
    setProductQuantities(updatedQuantities);
    
    setShowProductDropdown(false);
  };
  
  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };
  
  const updateProductQuantity = (productId, value) => {
    setProductQuantities({
      ...productQuantities,
      [productId]: value
    });
  };
  
  const setOrderStatus = (status) => {
    setFormData({ ...formData, status });
    setStatusMenuVisible(false);
  };
  
  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : 'Unknown';
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (selectedProducts.length === 0) {
      newErrors.products = 'At least one product is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const companyId = await AsyncStorage.getItem('company_id');
      if (!companyId) {
        Alert.alert('Error', 'Company ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Format items data properly
      const orderItems = selectedProducts.map(p => ({
        productId: parseInt(p.id),
        quantity: parseInt(p.quantity),
        unitPrice: parseFloat(p.price),
        discount: 0,
        // Include the orderItemId if it exists (for updating)
        ...(p.orderItemId ? { id: p.orderItemId } : {})
      }));
      
      // Format the order data according to the API requirements
      const orderData = {
        customerId: parseInt(formData.customerId),
        companyId: parseInt(companyId),
        status: formData.status,
        orderDate: formData.orderDate || new Date().toISOString(),
        dueDate: formData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
        notes: formData.notes || '',
        shippingAddress: formData.shippingAddress || '',
        currency: 'USD',
        items: orderItems
      };
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} order with data:`, orderData);
      
      let result;
      if (isEditing) {
        result = await orderService.update(orderId, orderData);
      } else {
        result = await orderService.create(orderData);
      }
      
      setLoading(false);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Order ${isEditing ? 'updated' : 'created'} successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Error',
          result.message || `Failed to ${isEditing ? 'update' : 'create'} order.`
        );
      }
    } catch (error) {
      setLoading(false);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} order:`, error);
      Alert.alert(
        'Error',
        error.message || `Failed to ${isEditing ? 'update' : 'create'} order. Please try again.`
      );
    }
  };
  
  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };
  
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading data...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{isEditing ? 'Edit Order' : 'Create New Order'}</Title>
      
      {/* Order Number (for editing only) */}
      {isEditing && formData.orderNumber && (
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumberLabel}>Order Number:</Text>
          <Text style={styles.orderNumberValue}>#{formData.orderNumber}</Text>
          <TouchableOpacity onPress={() => setShowDebugDialog(true)}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status Selection */}
      <Text style={styles.sectionTitle}>Order Status</Text>
      <View style={styles.statusContainer}>
        <TouchableOpacity 
          style={styles.statusSelector}
          onPress={() => setStatusMenuVisible(true)}
        >
          <Text style={styles.statusLabel}>Status:</Text>
          <Chip 
            mode="outlined" 
            style={styles.statusChip}
          >
            {getStatusLabel(formData.status)}
          </Chip>
        </TouchableOpacity>
        
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button style={{ width: 0, height: 0 }} onPress={() => setStatusMenuVisible(true)} />
          }
        >
          {orderStatuses.map(status => (
            <Menu.Item 
              key={status.value}
              onPress={() => setOrderStatus(status.value)} 
              title={status.label} 
            />
          ))}
        </Menu>
      </View>
      
      {/* Customer Selection */}
      <Text style={styles.sectionTitle}>Customer Information</Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Select Customer *"
          value={formData.customerName}
          onFocus={() => setShowCustomerDropdown(true)}
          style={styles.input}
          error={!!errors.customerId}
          right={<TextInput.Icon name="chevron-down" onPress={() => setShowCustomerDropdown(!showCustomerDropdown)} />}
          disabled={isEditing} // Can't change customer when editing
        />
        {errors.customerId && <HelperText type="error">{errors.customerId}</HelperText>}
        
        {showCustomerDropdown && !isEditing && (
          <Card style={styles.dropdown}>
            {customers.length > 0 ? (
              customers.map(customer => (
                <TouchableOpacity key={customer.id} onPress={() => selectCustomer(customer)}>
                  <List.Item
                    title={customer.name}
                    description={customer.email}
                    left={props => <List.Icon {...props} icon="account" />}
                  />
                  <Divider />
                </TouchableOpacity>
              ))
            ) : (
              <List.Item
                title="No customers found"
                description="Please add a customer first"
                left={props => <List.Icon {...props} icon="alert-circle" />}
              />
            )}
          </Card>
        )}
      </View>
      
      <TextInput
        label="Shipping Address"
        value={formData.shippingAddress}
        onChangeText={(text) => handleChange('shippingAddress', text)}
        style={styles.input}
        multiline
        numberOfLines={3}
      />
      
      {/* Product Selection */}
      <Text style={styles.sectionTitle}>Order Items</Text>
      {errors.products && <HelperText type="error">{errors.products}</HelperText>}
      
      {selectedProducts.length > 0 && (
        <View style={styles.selectedProducts}>
          {selectedProducts.map((product, index) => (
            <Card key={`${product.id}-${index}`} style={styles.productCard}>
              <Card.Content>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <TouchableOpacity onPress={() => removeProduct(product.id)}>
                    <MaterialCommunityIcons name="close" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productQuantity}>{product.quantity} x ${parseFloat(product.price).toFixed(2)}</Text>
                  <Text style={styles.productTotal}>${(product.quantity * product.price).toFixed(2)}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Add Product"
          placeholder="Search for a product"
          onFocus={() => setShowProductDropdown(true)}
          style={styles.input}
          right={<TextInput.Icon name="plus" onPress={() => setShowProductDropdown(!showProductDropdown)} />}
        />
        
        {showProductDropdown && (
          <Card style={styles.dropdown}>
            {products.length > 0 ? (
              products.map(product => (
                <View key={product.id}>
                  <List.Item
                    title={product.name}
                    description={`Price: $${parseFloat(product.unitPrice).toFixed(2)}`}
                    left={props => <List.Icon {...props} icon="package-variant" />}
                    right={() => (
                      <View style={styles.quantityContainer}>
                        <TextInput
                          label="Qty"
                          value={productQuantities[product.id] || ''}
                          onChangeText={(text) => updateProductQuantity(product.id, text)}
                          keyboardType="numeric"
                          style={styles.quantityInput}
                        />
                        <Button
                          mode="contained"
                          onPress={() => addProduct(product)}
                          disabled={!productQuantities[product.id]}
                          compact
                          style={styles.addButton}
                        >
                          Add
                        </Button>
                      </View>
                    )}
                  />
                  <Divider />
                </View>
              ))
            ) : (
              <List.Item
                title="No products found"
                description="Please add a product first"
                left={props => <List.Icon {...props} icon="alert-circle" />}
              />
            )}
          </Card>
        )}
      </View>
      
      <TextInput
        label="Notes"
        value={formData.notes}
        onChangeText={(text) => handleChange('notes', text)}
        style={styles.input}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={loading}
        >
          {isEditing ? 'Update Order' : 'Create Order'}
        </Button>
      </View>
      
      <Portal>
        <Dialog
          visible={showDebugDialog}
          onDismiss={() => setShowDebugDialog(false)}
        >
          <Dialog.Title>Order Debug Info</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.debugText}>Order ID: {formData.id}</Text>
            <Text style={styles.debugText}>Order Number: {formData.orderNumber}</Text>
            <Text style={styles.debugText}>Customer ID: {formData.customerId}</Text>
            <Text style={styles.debugText}>Status: {formData.status} ({getStatusLabel(formData.status)})</Text>
            <Text style={styles.debugText}>Item Count: {selectedProducts.length}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDebugDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1f2937',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  orderNumberLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  orderNumberValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  statusChip: {
    height: 32,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 250,
    zIndex: 2,
    elevation: 3,
  },
  selectedProducts: {
    marginBottom: 16,
  },
  productCard: {
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontWeight: 'bold',
    flex: 1,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productQuantity: {
    color: '#6b7280',
  },
  productTotal: {
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  quantityInput: {
    flex: 1,
    height: 40,
    marginRight: 8,
  },
  addButton: {
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0284c7',
  },
  debugText: {
    marginBottom: 8,
  }
});

export default NewOrderScreen;