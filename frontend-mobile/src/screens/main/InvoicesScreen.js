import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Searchbar, Chip, ActivityIndicator, FAB, Menu, Divider, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { invoiceService } from '../../services';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerService } from '../../services';

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  // Reload data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [])
  );

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // companyId'yi AsyncStorage'dan al
      const companyId = await AsyncStorage.getItem('companyId') || await AsyncStorage.getItem('COMPANY_ID') || await AsyncStorage.getItem('companyID') || await AsyncStorage.getItem('company_id') || await AsyncStorage.getItem('COMPANY_ID');
      let result;
      if (companyId) {
        result = await invoiceService.getByCompanyId(companyId);
      } else {
        result = await invoiceService.getAll();
      }
      
      // Müşteri listesini çek
      let customers = [];
      if (companyId) {
        const customerResult = await customerService.getByCompanyId(companyId);
        if (customerResult.success && Array.isArray(customerResult.data)) {
          customers = customerResult.data;
        }
      } else {
        const customerResult = await customerService.getAll();
        if (customerResult.success && Array.isArray(customerResult.data)) {
          customers = customerResult.data;
        }
      }
      // customerId -> customerName eşlemesi için map oluştur
      const customerMap = {};
      customers.forEach(c => {
        if (c && c.id) {
          customerMap[c.id] = c.name || c.fullName || c.companyName || c.customerName || `Customer #${c.id}`;
        }
      });
      // Faturalara müşteri adını ekle
      let invoicesWithCustomer = Array.isArray(result.data) ? result.data.map(inv => ({
        ...inv,
        customerName: inv.customerName || customerMap[inv.customerId] || (inv.customerId ? `Customer #${inv.customerId}` : 'Unknown')
      })) : [];
      if (result.success && Array.isArray(invoicesWithCustomer)) {
        setInvoices(invoicesWithCustomer);
        applyFiltersAndSort(invoicesWithCustomer, searchQuery, activeFilter, sortOrder);
      } else {
        console.error('Failed to fetch invoices:', result.message);
        setError(result.message || 'Failed to load invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Error loading invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFiltersAndSort(invoices, query, activeFilter, sortOrder);
  };

  const handleFilterSelect = (filter) => {
    setActiveFilter(filter);
    setFilterMenuVisible(false);
    applyFiltersAndSort(invoices, searchQuery, filter, sortOrder);
  };

  const handleSortSelect = (sort) => {
    setSortOrder(sort);
    setSortMenuVisible(false);
    applyFiltersAndSort(invoices, searchQuery, activeFilter, sort);
  };

  const applyFiltersAndSort = (data, query, filter, sort) => {
    if (!Array.isArray(data)) {
      console.warn('applyFiltersAndSort received non-array data:', data);
      return;
    }
    
    // First apply filters
    let result = [...data];
    
    // Apply search query filter
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      result = result.filter(invoice => 
        (invoice.invoiceNumber || '').toLowerCase().includes(lowercasedQuery) ||
        (invoice.customerName || '').toLowerCase().includes(lowercasedQuery) ||
        (invoice.notes || '').toLowerCase().includes(lowercasedQuery)
      );
    }
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(invoice => {
        const status = typeof invoice.status === 'string' 
          ? invoice.status.toLowerCase() 
          : getStatusLabel(invoice.status).toLowerCase();
          
        return status === filter.toLowerCase();
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0);
        case 'oldest':
          return new Date(a.invoiceDate || a.createdAt || 0) - new Date(b.invoiceDate || b.createdAt || 0);
        case 'highest':
          return (b.total || 0) - (a.total || 0);
        case 'lowest':
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });
    
    setFilteredInvoices(result);
  };

  const handleInvoicePress = (invoiceId) => {
    navigation.navigate('InvoiceDetails', { invoiceId });
  };

  const createInvoiceFromOrder = () => {
    navigation.navigate('Orders', { selectForInvoice: true });
  };

  const getStatusColor = (status) => {
    // Convert to number if it's a string that contains a number
    const statusNum = typeof status === 'string' && !isNaN(parseInt(status))
      ? parseInt(status)
      : status;
      
    if (typeof statusNum === 'number') {
      switch (statusNum) {
        case 0: // Draft
          return '#6b7280'; // gray-500
        case 1: // Pending
          return '#f59e0b'; // amber-500
        case 2: // Paid
          return '#10b981'; // emerald-500
        case 3: // Overdue
          return '#ef4444'; // red-500
        case 4: // Cancelled
          return '#9ca3af'; // gray-400
        default:
          return '#6b7280'; // gray-500
      }
    }
    
    // Handle string status values
    if (typeof status === 'string') {
      const lowercasedStatus = status.toLowerCase();
      
      if (lowercasedStatus.includes('draft')) return '#6b7280';
      if (lowercasedStatus.includes('pending')) return '#f59e0b';
      if (lowercasedStatus.includes('paid')) return '#10b981';
      if (lowercasedStatus.includes('overdue')) return '#ef4444';
      if (lowercasedStatus.includes('cancel')) return '#9ca3af';
    }
    
    return '#6b7280'; // Default gray
  };

  const getStatusLabel = (status) => {
    // Convert numeric status to string label
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Draft';
        case 1: return 'Pending';
        case 2: return 'Paid';
        case 3: return 'Overdue';
        case 4: return 'Cancelled';
        default: return 'Unknown';
      }
    }
    
    // If it's a string that looks like a number, convert it
    if (typeof status === 'string' && !isNaN(Number(status))) {
      return getStatusLabel(Number(status));
    }
    
    // Otherwise, return the string status or Unknown
    return status || 'Unknown';
  };

  const renderInvoiceItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleInvoicePress(item.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceNumberContainer}>
              <Title style={styles.invoiceNumber}>
                {item.invoiceNumber || `INV-${item.id}`}
              </Title>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
                textStyle={{ color: getStatusColor(item.status) }}
              >
                {getStatusLabel(item.status)}
              </Chip>
            </View>
            <Text style={styles.date}>
              {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : 'No date'}
            </Text>
          </View>
          
          <View style={styles.invoiceRow}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>{item.customerName || 'Unknown'}</Text>
            </View>
            <View style={styles.invoiceInfo}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>
                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.invoiceFooter}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.totalValue}>
              ${item.total ? item.total.toFixed(2) : '0.00'} {item.currency || 'USD'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.searchFilterContainer}>
        <Searchbar
          placeholder="Search invoices..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filterButtons}>
          <View>
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              icon="filter-variant"
              style={styles.filterButton}
            >
              Filter
            </Button>
            <Menu
              visible={filterMenuVisible}
              onDismiss={() => setFilterMenuVisible(false)}
              anchor={{ x: 10, y: 10 }}
            >
              <Menu.Item onPress={() => handleFilterSelect('all')} title="All Invoices" />
              <Menu.Item onPress={() => handleFilterSelect('draft')} title="Draft" />
              <Menu.Item onPress={() => handleFilterSelect('pending')} title="Pending" />
              <Menu.Item onPress={() => handleFilterSelect('paid')} title="Paid" />
              <Menu.Item onPress={() => handleFilterSelect('overdue')} title="Overdue" />
              <Menu.Item onPress={() => handleFilterSelect('cancelled')} title="Cancelled" />
            </Menu>
          </View>
          
          <View>
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              icon="sort"
              style={styles.filterButton}
            >
              Sort
            </Button>
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={{ x: 10, y: 10 }}
            >
              <Menu.Item onPress={() => handleSortSelect('newest')} title="Newest First" />
              <Menu.Item onPress={() => handleSortSelect('oldest')} title="Oldest First" />
              <Menu.Item onPress={() => handleSortSelect('highest')} title="Highest Amount" />
              <Menu.Item onPress={() => handleSortSelect('lowest')} title="Lowest Amount" />
            </Menu>
          </View>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={{ marginTop: 10 }}>Loading invoices...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={fetchInvoices}
            style={{ marginTop: 16, backgroundColor: '#0284c7' }}
          >
            Retry
          </Button>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyText}>No invoices found</Text>
          <Button 
            mode="contained" 
            onPress={createInvoiceFromOrder}
            style={{ marginTop: 16, backgroundColor: '#0284c7' }}
          >
            Create Invoice
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoiceItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284c7']}
            />
          }
        />
      )}
      
      
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
  listContent: {
    padding: 16,
    paddingBottom: 88, // Extra space for FAB
  },
  searchFilterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchbar: {
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    borderColor: '#d1d5db',
  },
  card: {
    marginBottom: 12,
  },
  invoiceHeader: {
    marginBottom: 8,
  },
  invoiceNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 18,
  },
  statusChip: {
    height: 28,
  },
  date: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invoiceInfo: {
    flex: 1,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    color: '#1f2937',
    fontSize: 14,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: {
    color: '#0284c7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0284c7',
  },
});

export default InvoicesScreen; 