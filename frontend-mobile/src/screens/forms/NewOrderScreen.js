import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { Text, Title, TextInput, Button, HelperText, ActivityIndicator, List, Divider, Chip, Card, Menu, Portal, Dialog } from 'react-native-paper';
import { orderService, customerService, productService } from '../../services';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFullUsernameFromStorage } from '../../utils/tokenUtils';

const orderStatuses = [
  { value: 0, label: 'Draft' },
  { value: 1, label: 'Pending' },
  { value: 2, label: 'Confirmed' },
  { value: 3, label: 'Shipped' },
  { value: 4, label: 'Delivered' },
  { value: 5, label: 'Cancelled' },
  { value: 6, label: 'Completed' }
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'TRY', label: 'TRY (₺)' }
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
    orderDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default due date: 7 days from now
    shippingCost: '0',
    taxRate: '0',
    currency: 'USD',
    shippingMethod: '',
    trackingNumber: ''
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
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  useEffect(() => {
    fetchInitialData();
    
    if (isEditing) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  const fetchOrderDetails = async () => {
    try {
      setLoadingData(true);
      
      const result = await orderService.getById(orderId);
      
      if (result.success && result.data) {
        console.log('Order details retrieved:', result.data);
        
        // Sipariş bilgilerinden company_id'yi kaydet
        if (result.data.companyId) {
          const companyIdStr = String(result.data.companyId);
          await AsyncStorage.setItem('company_id', companyIdStr);
          console.log('Saved company_id from order details:', companyIdStr);
        }
        
        // Format order data for the form
        setFormData({
          customerId: result.data.customerId,
          customerName: result.data.customerName || 
                        (result.data.customer ? result.data.customer.name : null) || 
                        'Unknown Customer',
          shippingAddress: result.data.shippingAddress || '',
          orderDate: result.data.orderDate,
          dueDate: result.data.dueDate,
          status: typeof result.data.status === 'number' ? result.data.status : 0,
          notes: result.data.notes || '',
          shippingCost: result.data.shippingCost || '0',
          taxRate: result.data.taxRate || '0',
          currency: result.data.currency || 'USD',
          shippingMethod: result.data.shippingMethod || '',
          trackingNumber: result.data.trackingNumber || ''
        });
        
        // Format products data
        if (result.data.items && Array.isArray(result.data.items)) {
          const products = result.data.items.map(item => ({
            id: item.productId,
            name: item.productName || item.description || `Product #${item.productId}`,
            price: item.unitPrice,
            quantity: item.quantity,
            total: item.total || (item.quantity * item.unitPrice),
            orderItemId: item.id // Keep track of the order item ID for updates
          }));
          
          setSelectedProducts(products);
        }
      } else {
        console.error('Failed to get order details:', result.message);
        Alert.alert('Error', result.message || 'Failed to load order details');
        navigation.goBack();
      }
      
      setLoadingData(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
      setLoadingData(false);
      navigation.goBack();
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
    // Handle numeric status
    if (typeof status === 'number') {
      const statusObj = orderStatuses.find(s => s.value === status);
      return statusObj ? statusObj.label : 'Draft';
    }
    
    // Handle string status that might be a number
    if (typeof status === 'string' && !isNaN(parseInt(status))) {
      const numStatus = parseInt(status);
      const statusObj = orderStatuses.find(s => s.value === numStatus);
      return statusObj ? statusObj.label : 'Draft';
    }
    
    // Handle string status that is already a label
    if (typeof status === 'string') {
      // Check if the string matches any label
      const statusObj = orderStatuses.find(s => 
        s.label.toLowerCase() === status.toLowerCase());
      if (statusObj) {
        return statusObj.label;
      }
      return status; // Return the string as is
    }
    
    // Default fallback
    return 'Draft';
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
      
      // Get company ID with fallback value
      let companyId = await AsyncStorage.getItem('company_id');
      
      // Provide fallback values if company ID is missing
      if (!companyId) {
        console.warn('Company ID not found in AsyncStorage, using default company ID from form data');
        
        // Try to get it from user data
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          companyId = userData.companyId?.toString() || '2'; // Varsayılan değer
          
          // Save it for future use
          await AsyncStorage.setItem('company_id', companyId);
          console.log('Saved company ID from user data:', companyId);
        } else {
          // Default fallback value
          companyId = '2'; // Varsayılan değer
          await AsyncStorage.setItem('company_id', companyId);
          console.log('Using default company ID:', companyId);
        }
      }
      
      // Get a valid username that exists in the database
      const username = await getFullUsernameFromStorage();
      console.log('Using username for order:', username);
      
      // Format items data properly
      const orderItems = selectedProducts.map(p => ({
        productId: parseInt(p.id),
        quantity: parseInt(p.quantity),
        unitPrice: parseFloat(p.price),
        discount: 0,
        // Add required description field from name
        description: p.name || `Product #${p.id}`,
        // Add required taxRate field
        taxRate: parseFloat(formData.taxRate || 0),
        // Include the orderItemId if it exists (for updating)
        ...(p.orderItemId ? { id: p.orderItemId } : {})
      }));
      
      // Today's date in ISO format
      const today = new Date().toISOString();
      
      // Default due date (7 days from now) in ISO format
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      const dueDateDefault = defaultDueDate.toISOString();
      
      // Ensure dates are valid ISO strings
      const ensureValidDate = (dateString, defaultValue) => {
        try {
          if (!dateString) return defaultValue;
          
          // If it's already a valid ISO string, use it
          if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(dateString)) {
            return dateString;
          }
          
          // Try to create a valid date
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
          
          // If parsing fails, return the default
          return defaultValue;
        } catch (error) {
          console.error(`Error ensuring valid date for ${dateString}:`, error);
          return defaultValue;
        }
      };
      
      // Format the order data according to the API requirements
      const orderData = {
        customerId: parseInt(formData.customerId),
        companyId: parseInt(companyId),
        // Send numeric status value to API for proper enum handling
        status: typeof formData.status === 'number' ? formData.status : 
               (typeof formData.status === 'string' && !isNaN(parseInt(formData.status))) ? 
               parseInt(formData.status) : 0,
        orderDate: ensureValidDate(formData.orderDate, today),
        dueDate: ensureValidDate(formData.dueDate, dueDateDefault),
        notes: formData.notes || '',
        shippingAddress: formData.shippingAddress || '',
        currency: formData.currency || 'USD',
        items: orderItems,
        shippingCost: parseFloat(formData.shippingCost || 0),
        taxRate: parseFloat(formData.taxRate || 0),
        shippingMethod: formData.shippingMethod || '',
        trackingNumber: formData.trackingNumber || '',
        // Use the validated username as createdBy
        createdBy: username
      };
      
      console.log(`${isEditing ? 'Updating' : 'Creating'} order with data:`, JSON.stringify(orderData, null, 2));
      
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
        // Handle specific error types
        if (result.error?.type === 'FOREIGN_KEY_CONSTRAINT' && result.error?.field === 'createdBy') {
          // Handle the case where the username doesn't exist in the database
          Alert.alert(
            'Authentication Error',
            'Your user account could not be verified. Please log out and log in again.',
            [
              { 
                text: 'OK', 
                onPress: async () => {
                  // Clear the token and navigate to login
                  await AsyncStorage.removeItem('token');
                  await AsyncStorage.removeItem('username');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } 
              }
            ]
          );
        } else {
          // Show standard error message for other errors
          Alert.alert(
            'Error',
            `Failed to ${isEditing ? 'update' : 'create'} order: ${result.message}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} order:`, error);
      
      // Check if this is a JWT decoding error
      if (error.name === 'InvalidCharacterError' && error.message.includes('atob')) {
        Alert.alert(
          'Authentication Error',
          'Your session appears to be invalid. Please log out and log in again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to ${isEditing ? 'update' : 'create'} order: ${error.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };
  
  // Format date for display and input
  const formatDateForDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Parse date from input string (format: MM/DD/YYYY) to ISO string
  const parseDateInput = (dateString) => {
    try {
      if (!dateString) return new Date().toISOString();
      
      // Try to parse various date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // If direct parsing fails, try to parse MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
      
      return new Date().toISOString();
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date().toISOString();
    }
  };
  
  // Handle date input changes
  const handleDateChange = (field, value) => {
    const isoDate = parseDateInput(value);
    handleChange(field, isoDate);
  };
  
  // Select currency
  const selectCurrency = (currency) => {
    handleChange('currency', currency.value);
    setShowCurrencyDropdown(false);
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
          style={styles.enhancedStatusSelector}
          onPress={() => setStatusMenuVisible(true)}
        >
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusDisplay, { backgroundColor: getStatusColor(formData.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(formData.status) }]}>
                {getStatusLabel(formData.status)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Status Selection Modal */}
      <Modal
        visible={statusMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Select Order Status</Text>
              <TouchableOpacity onPress={() => setStatusMenuVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {orderStatuses.map(status => (
                <TouchableOpacity 
                  key={status.value}
                  style={[
                    styles.statusOption,
                    formData.status === status.value && styles.selectedStatusOption
                  ]}
                  onPress={() => {
                    setOrderStatus(status.value);
                    setStatusMenuVisible(false);
                  }}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status.value) }]} />
                  <Text style={styles.statusOptionText}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Date Selections */}
      <View style={styles.dateRow}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Order Date:</Text>
          <TextInput
            label="Order Date"
            value={formatDateForDisplay(formData.orderDate)}
            onChangeText={(text) => handleDateChange('orderDate', text)}
            style={styles.input}
            placeholder="MM/DD/YYYY"
            right={<TextInput.Icon name="calendar" />}
          />
        </View>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Due Date:</Text>
          <TextInput
            label="Due Date" 
            value={formatDateForDisplay(formData.dueDate)}
            onChangeText={(text) => handleDateChange('dueDate', text)}
            style={styles.input}
            placeholder="MM/DD/YYYY"
            right={<TextInput.Icon name="calendar" />}
          />
        </View>
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
      
      {/* Financial Information */}
      <Text style={styles.sectionTitle}>Financial Information</Text>
      <View style={styles.financialRow}>
        <View style={styles.financialField}>
          <TextInput
            label="Shipping Cost"
            value={formData.shippingCost}
            onChangeText={(text) => handleChange('shippingCost', text)}
            style={styles.input}
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
          />
        </View>
        
        <View style={styles.financialField}>
          <TextInput
            label="Tax Rate (%)"
            value={formData.taxRate}
            onChangeText={(text) => handleChange('taxRate', text)}
            style={styles.input}
            keyboardType="numeric"
            right={<TextInput.Affix text="%" />}
          />
        </View>
      </View>
      
      {/* Currency Selection */}
      <View style={styles.dropdownContainer}>
        <TextInput
          label="Currency"
          value={currencies.find(c => c.value === formData.currency)?.label || 'USD ($)'}
          onFocus={() => setShowCurrencyDropdown(true)}
          style={styles.input}
          right={<TextInput.Icon name="chevron-down" onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)} />}
        />
        
        {showCurrencyDropdown && (
          <Card style={styles.dropdown}>
            {currencies.map(currency => (
              <TouchableOpacity key={currency.value} onPress={() => selectCurrency(currency)}>
                <List.Item
                  title={currency.label}
                  left={props => <List.Icon {...props} icon="currency-usd" />}
                />
                <Divider />
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </View>
      
      {/* Shipping Details */}
      <Text style={styles.sectionTitle}>Shipping Information</Text>
      <TextInput
        label="Shipping Method"
        value={formData.shippingMethod}
        onChangeText={(text) => handleChange('shippingMethod', text)}
        style={styles.input}
      />
      
      <TextInput
        label="Tracking Number"
        value={formData.trackingNumber}
        onChangeText={(text) => handleChange('trackingNumber', text)}
        style={styles.input}
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
  enhancedStatusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  statusDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusMenuContent: {
    maxHeight: 250,
  },
  selectedStatusItem: {
    backgroundColor: '#e0f2fe',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusMenuItem: {
    fontSize: 16,
    fontWeight: '500',
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
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  dateContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#1f2937',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financialField: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  selectedStatusOption: {
    backgroundColor: '#e0f2fe',
  },
  statusOptionText: {
    fontSize: 16,
    marginLeft: 10,
  },
});

export default NewOrderScreen;