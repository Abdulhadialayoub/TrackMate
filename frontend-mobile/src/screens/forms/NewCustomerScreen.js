import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Title, TextInput, Button, HelperText, ActivityIndicator, Divider, Snackbar } from 'react-native-paper';
import { customerService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NewCustomerScreen = ({ navigation, route }) => {
  // Check if we're editing an existing customer
  const editMode = route.params?.customer ? true : false;
  const existingCustomer = route.params?.customer || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    taxOffice: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  // Load existing customer data if in edit mode
  useEffect(() => {
    if (editMode && existingCustomer) {
      setFormData({
        name: existingCustomer.name || '',
        email: existingCustomer.email || '',
        phone: existingCustomer.phone || '',
        address: existingCustomer.address || '',
        taxNumber: existingCustomer.taxNumber || '',
        taxOffice: existingCustomer.taxOffice || '',
        notes: existingCustomer.notes || ''
      });
    }
  }, [editMode, existingCustomer]);

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
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Only include fields that have values
      const customerData = {
        name: formData.name.trim(),
        email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        phone: formData.phone && formData.phone.trim() ? formData.phone.trim() : null,
        address: formData.address && formData.address.trim() ? formData.address.trim() : null,
        taxNumber: formData.taxNumber && formData.taxNumber.trim() ? formData.taxNumber.trim() : null,
        taxOffice: formData.taxOffice && formData.taxOffice.trim() ? formData.taxOffice.trim() : null,
        notes: formData.notes && formData.notes.trim() ? formData.notes.trim() : null
      };

      // Get company ID from AsyncStorage to associate customer with company
      const companyIdFromStorage = await AsyncStorage.getItem('company_id');
      console.log('Retrieved company_id from storage:', companyIdFromStorage);
      
      // Validate companyId is present and convert to integer
      if (!companyIdFromStorage) {
        showSnackbar('Error: Company ID not found in storage', 'error');
        console.error('Company ID not found in AsyncStorage');
        setLoading(false);
        return;
      }
      
      const companyId = parseInt(companyIdFromStorage, 10);
      
      // Additional validation to ensure companyId is a valid positive integer
      if (isNaN(companyId) || companyId <= 0) {
        showSnackbar('Error: Invalid company ID', 'error');
        console.error('Invalid company ID value:', companyIdFromStorage);
        setLoading(false);
        return;
      }
      
      // Set the validated companyId
      customerData.companyId = companyId;
      
      // Set a default status if not provided
      customerData.status = 0; // Assuming 0 is a valid default status value
      
      console.log(`${editMode ? 'Updating' : 'Creating'} customer data:`, JSON.stringify(customerData, null, 2));
      
      let response;
      if (editMode) {
        // Update existing customer
        response = await customerService.update(existingCustomer.id, customerData);
      } else {
        // Create new customer
        response = await customerService.create(customerData);
      }
      
      if (response.success) {
        showSnackbar(`Customer ${editMode ? 'updated' : 'created'} successfully!`, 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        // API returned an error
        const errorMsg = response.message || `Failed to ${editMode ? 'update' : 'create'} customer`;
        showSnackbar(errorMsg, 'error');
        console.error('API error response:', response);
      }
    } catch (error) {
      setLoading(false);
      console.error(`Error ${editMode ? 'updating' : 'creating'} customer:`, error);
      
      // Show more detailed error message
      let errorMessage = `Failed to ${editMode ? 'update' : 'create'} customer. Please try again.`;
      if (error.response) {
        const responseData = error.response.data;
        console.log('Error response data:', responseData);
        
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please check if all fields are valid.';
        } else if (responseData) {
          if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
            errorMessage = responseData.errors[0];
          } else if (typeof responseData.errors === 'object') {
            // Entity Framework validation errors come as an object
            const firstError = Object.values(responseData.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>{editMode ? 'Edit Customer' : 'Add New Customer'}</Title>
      
      <TextInput
        label="Name *"
        value={formData.name}
        onChangeText={(text) => handleChange('name', text)}
        style={styles.input}
        error={!!errors.name}
      />
      {errors.name && <HelperText type="error">{errors.name}</HelperText>}
      
      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        style={styles.input}
        keyboardType="email-address"
        error={!!errors.email}
      />
      {errors.email && <HelperText type="error">{errors.email}</HelperText>}
      
      <TextInput
        label="Phone"
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
        style={styles.input}
        keyboardType="phone-pad"
        error={!!errors.phone}
      />
      {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
      
      <TextInput
        label="Address"
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
        style={styles.input}
        multiline
        numberOfLines={2}
      />
      
      <Divider style={styles.divider} />
      <Text style={styles.sectionTitle}>Tax Information</Text>
      
      <TextInput
        label="Tax Number"
        value={formData.taxNumber}
        onChangeText={(text) => handleChange('taxNumber', text)}
        style={styles.input}
      />
      
      <TextInput
        label="Tax Office"
        value={formData.taxOffice}
        onChangeText={(text) => handleChange('taxOffice', text)}
        style={styles.input}
      />
      
      <Divider style={styles.divider} />
      
      <TextInput
        label="Notes"
        value={formData.notes}
        onChangeText={(text) => handleChange('notes', text)}
        style={styles.input}
        multiline
        numberOfLines={3}
      />
      
      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        style={styles.button}
        disabled={loading}
        icon={editMode ? "pencil" : "account-plus"}
      >
        {loading ? 'Saving...' : (editMode ? 'Update Customer' : 'Create Customer')}
      </Button>
      
      {loading && <ActivityIndicator style={styles.loader} />}

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
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#555',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 15,
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#0284c7',
    paddingVertical: 6,
  },
  loader: {
    marginTop: 20,
  }
});

export default NewCustomerScreen;