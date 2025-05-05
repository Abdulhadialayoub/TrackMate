import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, TextInput, Button, HelperText, ActivityIndicator, Snackbar, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { productService, categoryService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const productStatuses = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Inactive' },
  { value: 2, label: 'Discontinued' },
  { value: 3, label: 'OutOfStock' }
];

const NewProductScreen = ({ navigation, route }) => {
  // Check if we're editing an existing product
  const editMode = route.params?.product ? true : false;
  const existingProduct = route.params?.product?.data || route.params?.product || {};

  // Print the received product data for debugging
  useEffect(() => {
    if (route.params?.product) {
      console.log('Received product data:', JSON.stringify(route.params.product, null, 2));
    }
  }, [route]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    unitPrice: '',
    unit: '',
    weight: '',
    quantity: '',
    stockQuantity: '',
    categoryId: '',
    brand: '',
    model: '',
    currency: 'USD',
    status: 0,
    sku: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  // Load categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load existing product data if in edit mode
  useEffect(() => {
    if (editMode && existingProduct) {
      console.log('Loading existing product data:', existingProduct);
      // Handle nested data structure
      const productData = existingProduct.data || existingProduct;
      
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        code: productData.code || '',
        unitPrice: productData.unitPrice ? productData.unitPrice.toString() : '',
        unit: productData.unit || '',
        weight: productData.weight ? productData.weight.toString() : '',
        quantity: productData.quantity ? productData.quantity.toString() : '',
        stockQuantity: productData.stockQuantity ? productData.stockQuantity.toString() : '',
        categoryId: productData.categoryId ? productData.categoryId.toString() : '',
        brand: productData.brand || '',
        model: productData.model || '',
        currency: productData.currency || 'USD',
        status: productData.status !== undefined ? productData.status : 0,
        sku: productData.sku || '',
        isActive: productData.isActive !== undefined ? productData.isActive : true
      });
    }
  }, [editMode, existingProduct]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await categoryService.getAll();
      if (result && result.success) {
        setCategories(result.data);
      } else {
        showSnackbar('Failed to load categories', 'error');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Error loading categories', 'error');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Product code is required';
    }
    
    if (!formData.unitPrice.trim()) {
      newErrors.unitPrice = 'Price is required';
    } else if (isNaN(parseFloat(formData.unitPrice)) || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Price must be a valid number';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (formData.stockQuantity && isNaN(parseInt(formData.stockQuantity))) {
      newErrors.stockQuantity = 'Stock quantity must be a number';
    }
    
    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = 'Weight must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        unitPrice: parseFloat(formData.unitPrice),
        unit: formData.unit,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        categoryId: parseInt(formData.categoryId),
        brand: formData.brand,
        model: formData.model,
        currency: formData.currency,
        status: formData.status,
        sku: formData.sku,
        isActive: formData.isActive
      };

      // Get company ID and user ID from AsyncStorage to associate product
      const companyId = await AsyncStorage.getItem('company_id');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (companyId) {
        productData.companyId = parseInt(companyId);
      }
      
      if (userId) {
        productData.createdBy = userId;
        productData.updatedBy = userId;
      }
      
      let response;
      
      if (editMode) {
        // Update existing product
        const productId = existingProduct.id || existingProduct.data?.id;
        response = await productService.update(productId, productData);
      } else {
        // Create new product
        response = await productService.create(productData);
      }
      
      if (response && response.success) {
        showSnackbar(editMode ? 'Product updated successfully!' : 'Product created successfully!', 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        showSnackbar(response?.message || 'Failed to save product', 'error');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error saving product:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to save product. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{editMode ? 'Edit Product' : 'Add New Product'}</Title>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Divider style={styles.divider} />
        
        <TextInput
          label="Product Name *"
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          style={styles.input}
          error={!!errors.name}
          mode="outlined"
        />
        {errors.name && <HelperText type="error">{errors.name}</HelperText>}
        
        <TextInput
          label="Product Code *"
          value={formData.code}
          onChangeText={(text) => handleChange('code', text)}
          style={styles.input}
          error={!!errors.code}
          mode="outlined"
        />
        {errors.code && <HelperText type="error">{errors.code}</HelperText>}
        
        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => handleChange('description', text)}
          style={styles.input}
          multiline
          numberOfLines={3}
          mode="outlined"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classification</Text>
        <Divider style={styles.divider} />
        
        <Text style={styles.pickerLabel}>Category *</Text>
        <View style={[styles.pickerContainer, errors.categoryId ? styles.pickerError : null]}>
          <Picker
            selectedValue={formData.categoryId}
            onValueChange={(value) => handleChange('categoryId', value)}
            style={styles.picker}
            enabled={!loadingCategories}
          >
            <Picker.Item label="Select a category" value="" />
            {categories.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.id.toString()} />
            ))}
          </Picker>
        </View>
        {errors.categoryId && <HelperText type="error">{errors.categoryId}</HelperText>}
        
        <TextInput
          label="Brand"
          value={formData.brand}
          onChangeText={(text) => handleChange('brand', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Model"
          value={formData.model}
          onChangeText={(text) => handleChange('model', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="SKU"
          value={formData.sku}
          onChangeText={(text) => handleChange('sku', text)}
          style={styles.input}
          mode="outlined"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
        <Divider style={styles.divider} />
        
        <TextInput
          label="Unit Price *"
          value={formData.unitPrice}
          onChangeText={(text) => handleChange('unitPrice', text)}
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.unitPrice}
          mode="outlined"
          left={<TextInput.Affix text="$" />}
        />
        {errors.unitPrice && <HelperText type="error">{errors.unitPrice}</HelperText>}
        
        <Text style={styles.pickerLabel}>Currency</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.currency}
            onValueChange={(value) => handleChange('currency', value)}
            style={styles.picker}
          >
            <Picker.Item label="USD" value="USD" />
            <Picker.Item label="EUR" value="EUR" />
            <Picker.Item label="GBP" value="GBP" />
            <Picker.Item label="TRY" value="TRY" />
          </Picker>
        </View>
        
        <TextInput
          label="Stock Quantity"
          value={formData.stockQuantity}
          onChangeText={(text) => handleChange('stockQuantity', text)}
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.stockQuantity}
          mode="outlined"
        />
        {errors.stockQuantity && <HelperText type="error">{errors.stockQuantity}</HelperText>}
        
        <TextInput
          label="Unit (e.g., kg, pcs)"
          value={formData.unit}
          onChangeText={(text) => handleChange('unit', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Weight"
          value={formData.weight}
          onChangeText={(text) => handleChange('weight', text)}
          style={styles.input}
          keyboardType="numeric"
          error={!!errors.weight}
          mode="outlined"
        />
        {errors.weight && <HelperText type="error">{errors.weight}</HelperText>}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Divider style={styles.divider} />
        
        <Text style={styles.pickerLabel}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.status}
            onValueChange={(value) => handleChange('status', value)}
            style={styles.picker}
          >
            {productStatuses.map((status) => (
              <Picker.Item key={status.value} label={status.label} value={status.value} />
            ))}
          </Picker>
        </View>
      </View>
      
      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        style={styles.button}
        disabled={loading}
        icon={editMode ? "pencil" : "plus"}
        loading={loading}
      >
        {loading ? 'Saving...' : (editMode ? 'Update Product' : 'Create Product')}
      </Button>
      
      <Snackbar
        visible={snackbar.visible}
        onDismiss={onDismissSnackbar}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : (snackbar.type === 'success' ? '#4CAF50' : '#2196F3') }}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  pickerError: {
    borderColor: '#ef4444',
  },
  picker: {
    height: 50,
  },
  button: {
    marginTop: 8,
    marginBottom: 40,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
  },
});

export default NewProductScreen;