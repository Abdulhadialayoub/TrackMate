import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, FAB, Searchbar, Snackbar, Chip, Badge, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productService, categoryService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const productStatuses = [
  { value: 0, label: 'Active', color: '#4CAF50' },
  { value: 1, label: 'Inactive', color: '#F44336' },
  { value: 2, label: 'Discontinued', color: '#FF9800' },
  { value: 3, label: 'OutOfStock', color: '#9E9E9E' }
];

const ProductsScreen = ({ navigation }) => {
  const rootNavigation = useNavigation();
  const routes = useNavigationState(state => state.routes);
  
  console.log('Current navigation state:', JSON.stringify(routes, null, 2));
  console.log('Navigation prop type:', navigation ? typeof navigation : 'undefined');
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  const fetchData = useCallback(async () => {
    console.log('Fetching products and categories from API...');
    setLoading(true);
    try {
      // Get company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      const userRole = await AsyncStorage.getItem('user_role');
      
      let productsResult, categoriesResult;
      
      // If user is Dev, fetch all products, otherwise filter by company
      if (userRole === 'Dev') {
        productsResult = await productService.getAll();
      } else if (companyId) {
        productsResult = await productService.getByCompanyId(companyId);
      } else {
        productsResult = await productService.getAll();
      }
      
      // Fetch categories
      categoriesResult = await categoryService.getAll();
      
      // Extract data from results
      const productsData = productsResult && productsResult.success ? productsResult.data : [];
      const categoriesData = categoriesResult && categoriesResult.success ? categoriesResult.data : [];
      
      console.log(`Retrieved ${productsData?.length || 0} products and ${categoriesData?.length || 0} categories`);
      
      // Log the first product to debug structure
      if (productsData && productsData.length > 0) {
        console.log('Sample product data:', JSON.stringify(productsData[0], null, 2));
      }
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Show error if either request failed
      if (!productsResult || !productsResult.success) {
        showSnackbar(`Error loading products: ${productsResult?.message || 'Unknown error'}`, 'error');
      }
      
      if (!categoriesResult || !categoriesResult.success) {
        showSnackbar(`Error loading categories: ${categoriesResult?.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar(`Error loading data: ${error.message || 'Unknown error'}`, 'error');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button
            icon="shape-outline"
            mode="outlined"
            style={{ marginRight: 8 }}
            onPress={() => navigation.navigate('CategoriesScreen')}
          >
            Categories
          </Button>
          <Button 
            icon="refresh" 
            mode="text" 
            onPress={onRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </View>
      </View>
      
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <Card 
            style={styles.productCard} 
            onPress={() => {
              console.log('Navigating to product details...');
              navigation.navigate('ProductDetails', { productId: item.id });
            }}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.productName}>{item.name || 'Unnamed Product'}</Title>
                {getStatusChip(item.status)}
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Code:</Text>
                  <Text style={styles.detailValue}>{item.code || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{item.categoryName || 'Uncategorized'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SKU:</Text>
                  <Text style={styles.detailValue}>{item.sku || 'N/A'}</Text>
                </View>
                
                <View style={styles.priceStockContainer}>
                  <View style={styles.priceContainer}>
                    <MaterialCommunityIcons name="currency-usd" size={18} color="#0284c7" />
                    <Text style={styles.price}>
                      {(item.unitPrice !== undefined && item.unitPrice !== null) 
                        ? Number(item.unitPrice).toFixed(2) 
                        : (item.price !== undefined && item.price !== null)
                          ? Number(item.price).toFixed(2)
                          : '0.00'} {item.currency || 'USD'}
                    </Text>
                  </View>
                  
                  <View style={styles.stockContainer}>
                    <MaterialCommunityIcons 
                      name="package-variant" 
                      size={18} 
                      color={item.stockQuantity > 10 ? '#10b981' : '#f59e0b'} 
                    />
                    <Text style={[
                      styles.stockText,
                      item.stockQuantity > 10 ? styles.inStock : styles.lowStock
                    ]}>
                      {item.stockQuantity !== undefined ? item.stockQuantity : 0} in stock
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        color="#ffffff"
        onPress={() => {
          console.log('Attempting to navigate to AddProduct...');
          
          // Get the correct parent navigator
          const parent = navigation.getParent();
          console.log('Parent navigator:', parent ? 'exists' : 'undefined');
          
          if (parent) {
            // If we're in a nested navigator, navigate using the parent
            console.log('Using parent navigation');
            parent.navigate('NewProduct');
          } else if (rootNavigation) {
            // Use the hook-based navigation as fallback
            console.log('Using root navigation');
            rootNavigation.navigate('NewProduct');
          } else {
            // Last resort
            console.log('Using direct navigation');
            navigation.navigate('NewProduct');
          }
        }}
      />
      <Snackbar
        visible={snackbar.visible}
        onDismiss={onDismissSnackbar}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : (snackbar.type === 'success' ? '#4CAF50' : '#2196F3') }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
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
  searchBar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  divider: {
    marginBottom: 12,
  },
  productDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    color: '#64748b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
    marginLeft: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 4,
    fontSize: 14,
  },
  inStock: {
    color: '#10b981',
  },
  lowStock: {
    color: '#f59e0b',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0284c7',
  },
});

export default ProductsScreen;