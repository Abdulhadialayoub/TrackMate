import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, Card, Paragraph, Button, ActivityIndicator, Divider, Chip, IconButton, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productService } from '../../services';
import ErrorView from '../../components/ErrorView';
import logger from '../../utils/logger';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const productStatuses = [
  { value: 0, label: 'Active', color: '#4CAF50' },
  { value: 1, label: 'Inactive', color: '#F44336' },
  { value: 2, label: 'Discontinued', color: '#FF9800' },
  { value: 3, label: 'OutOfStock', color: '#9E9E9E' }
];

const ProductDetailsScreen = ({ route, navigation }) => {
  const rootNavigation = useNavigation();
  const routes = useNavigationState(state => state.routes);
  
  console.log('ProductDetailsScreen - Current navigation state:', JSON.stringify(routes, null, 2));
  console.log('ProductDetailsScreen - Navigation prop type:', navigation ? typeof navigation : 'undefined');
  
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStockMode, setUpdateStockMode] = useState(false);
  const [newStockQuantity, setNewStockQuantity] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('ProductDetailsScreen', `Fetching product with id: ${productId}`);
      
      // Check if we have a valid product ID
      if (!productId) {
        logger.error('ProductDetailsScreen', 'Invalid product ID');
        setError('Invalid product ID');
        setLoading(false);
        return;
      }
      
      // Log request details
      logger.debug('ProductDetailsScreen', `Making API request to get product ${productId}`);
      
      const result = await productService.getById(productId);
      
      // Log response
      logger.debug('ProductDetailsScreen', 'API response received', result);
      
      if (!result || !result.success) {
        logger.error('ProductDetailsScreen', 'Received error from API', result);
        setError('Product data not found');
        setLoading(false);
        return;
      }
      
      // Extract the product data from the response
      const productData = result.data;
      
      setProduct(productData);
      if (productData.stockQuantity !== undefined) {
        setNewStockQuantity(productData.stockQuantity.toString());
      }
      setLoading(false);
    } catch (err) {
      // Use our logger utility for detailed error logging
      logger.error('ProductDetailsScreen', 'Error fetching product details', err);
      
      // Set a user-friendly error message
      setError(logger.getUserFriendlyErrorMessage(err, 'Failed to load product details'));
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Log navigation attempt
    console.log('Attempting to navigate to EditProduct...');
    
    // Try different navigation approaches
    try {
      if (rootNavigation) {
        console.log('Using rootNavigation');
        rootNavigation.navigate('EditProduct', { product: { data: product } });
      } else {
        console.log('Using navigation prop');
        navigation.navigate('EditProduct', { product: { data: product } });
      }
    } catch (err) {
      console.error('Navigation error:', err);
      // Fallback approach - try navigating directly to the parent navigator
      try {
        console.log('Trying fallback navigation approach');
        navigation.getParent()?.navigate('EditProduct', { product: { data: product } });
      } catch (fallbackErr) {
        console.error('Fallback navigation error:', fallbackErr);
        Alert.alert('Navigation Error', 'Could not navigate to edit screen');
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await productService.delete(productId);
              if (result && result.success) {
                Alert.alert('Success', 'Product deleted successfully');
                navigation.goBack();
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete product');
                setLoading(false);
              }
            } catch (err) {
              console.error('Error deleting product:', err);
              Alert.alert('Error', 'Failed to delete product');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateStock = async () => {
    if (!newStockQuantity || isNaN(parseInt(newStockQuantity))) {
      Alert.alert('Error', 'Please enter a valid number for stock quantity');
      return;
    }

    try {
      setLoading(true);
      const result = await productService.updateStock(productId, parseInt(newStockQuantity));
      
      if (result && result.success) {
        Alert.alert('Success', 'Stock updated successfully');
        fetchProductDetails();
      } else {
        Alert.alert('Error', result?.message || 'Failed to update stock');
        setLoading(false);
      }
      setUpdateStockMode(false);
    } catch (err) {
      console.error('Error updating stock:', err);
      Alert.alert('Error', 'Failed to update stock quantity');
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusInfo = productStatuses.find(s => s.value === status) || 
                      { label: 'Unknown', color: '#9E9E9E' };
    
    return (
      <Chip 
        style={{ backgroundColor: statusInfo.color + '20' }}
        textStyle={{ color: statusInfo.color }}
      >
        {statusInfo.label}
      </Chip>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading product details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorView 
        message={error}
        onRetry={fetchProductDetails}
      />
    );
  }

  if (!product) {
    return (
      <ErrorView 
        message="Product not found"
        onRetry={() => navigation.goBack()}
        retryButtonText="Go Back"
        icon="package-variant-removed"
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.titleRow}>
            <Title style={styles.productName}>{product?.name || 'Unnamed Product'}</Title>
            {getStatusChip(product?.status)}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.mainDetails}>
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <MaterialCommunityIcons name="currency-usd" size={24} color="#0284c7" />
                <Text style={styles.price}>
                  {(product?.unitPrice !== undefined && product?.unitPrice !== null) 
                    ? Number(product.unitPrice).toFixed(2) 
                    : (product?.price !== undefined && product?.price !== null)
                      ? Number(product.price).toFixed(2)
                      : '0.00'} {product?.currency || 'USD'}
                </Text>
              </View>
            </View>
          
            <View style={styles.stockRow}>
              <View style={styles.stockHeader}>
                <MaterialCommunityIcons 
                  name="package-variant" 
                  size={20} 
                  color={(product?.stockQuantity > 10) ? '#10b981' : '#f59e0b'} 
                />
                <Text style={[
                  styles.stockText,
                  (product?.stockQuantity > 0) ? styles.inStock : styles.outOfStock
                ]}>
                  {(product?.stockQuantity > 0)
                    ? `In Stock (${product.stockQuantity})` 
                    : 'Out of Stock'}
                </Text>
              </View>
              
              {!updateStockMode ? (
                <Button 
                  icon="pencil" 
                  mode="outlined" 
                  onPress={() => setUpdateStockMode(true)}
                >
                  Update Stock
                </Button>
              ) : (
                <View style={styles.updateStockRow}>
                  <TextInput
                    label="New Quantity"
                    value={newStockQuantity}
                    onChangeText={setNewStockQuantity}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.stockInput}
                  />
                  <IconButton
                    icon="check"
                    color="#10b981"
                    size={24}
                    onPress={handleUpdateStock}
                    style={styles.stockButton}
                  />
                  <IconButton
                    icon="close"
                    color="#ef4444"
                    size={24}
                    onPress={() => setUpdateStockMode(false)}
                    style={styles.stockButton}
                  />
                </View>
              )}
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Product Details</Title>
          
          {/* Product Details Section */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Code:</Text>
              <Text style={styles.detailValue}>{product?.code || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product?.categoryName || 'Uncategorized'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SKU:</Text>
              <Text style={styles.detailValue}>{product?.sku || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand:</Text>
              <Text style={styles.detailValue}>{product?.brand || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model:</Text>
              <Text style={styles.detailValue}>{product?.model || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit:</Text>
              <Text style={styles.detailValue}>{product?.unit || 'Not specified'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}>
                {product?.weight ? `${product.weight} kg` : 'Not specified'}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.description}>
            {product?.description || 'No description available.'}
          </Paragraph>
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
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 22,
    flex: 1,
    marginRight: 8,
  },
  divider: {
    marginVertical: 16,
  },
  mainDetails: {
    marginBottom: 8,
  },
  priceRow: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
    marginLeft: 4,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inStock: {
    color: '#10b981',
  },
  outOfStock: {
    color: '#ef4444',
  },
  updateStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockInput: {
    width: 100,
    height: 40,
  },
  stockButton: {
    margin: 0,
  },
  detailsGrid: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  detailValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
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

export default ProductDetailsScreen;