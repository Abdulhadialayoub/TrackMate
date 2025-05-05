import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, FAB, Searchbar, Snackbar, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { customerService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  const fetchCustomers = useCallback(async () => {
    console.log('Fetching customers from API...');
    setLoading(true);
    try {
      // Get company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      
      // If we have a company ID, use it to filter customers
      let result;
      if (companyId) {
        result = await customerService.getByCompanyId(companyId);
      } else {
        // Otherwise fetch all customers
        result = await customerService.getAll();
      }
      
      // Extract data from result
      const customersData = result.success ? result.data : [];
      
      console.log(`Retrieved ${customersData?.length || 0} customers`);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      
      // Show error if request failed
      if (!result.success) {
        showSnackbar(`Error fetching customers: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar(`Error fetching customers: ${error.message || 'Unknown error'}`, 'error');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search customers"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={filteredCustomers}
        renderItem={({ item }) => (
          <Card 
            style={styles.customerCard} 
            onPress={() => navigation.navigate('CustomerDetails', { customerId: item.id })}
          >
            <Card.Content>
              <Title style={styles.customerName}>{item.name}</Title>
              <View style={styles.customerDetails}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
                  <Paragraph style={styles.detailText}>{item.email}</Paragraph>
                </View>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                  <Paragraph style={styles.detailText}>{item.phone}</Paragraph>
                </View>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                  <Paragraph style={styles.detailText}>{item.address}</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <FAB
        style={styles.fab}
        icon="account-plus"
        color="#ffffff"
        onPress={() => navigation.navigate('NewCustomer')}
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
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  customerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#4b5563',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0284c7',
  },
});

export default CustomersScreen;