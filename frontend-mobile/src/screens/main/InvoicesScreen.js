import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, FAB, Snackbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { invoiceService } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });

  const showSnackbar = (message, type = 'info') => {
    setSnackbar({ visible: true, message, type });
  };
  
  const onDismissSnackbar = () => setSnackbar({ ...snackbar, visible: false });

  const fetchInvoices = useCallback(async () => {
    console.log('Fetching invoices from API...');
    setLoading(true);
    try {
      // Get company ID from AsyncStorage
      const companyId = await AsyncStorage.getItem('company_id');
      
      // If we have a company ID, use it to filter invoices
      let data;
      if (companyId) {
        data = await invoiceService.getByCompanyId(companyId);
      } else {
        // Otherwise fetch all invoices
        data = await invoiceService.getAll();
      }
      
      console.log(`Retrieved ${data?.length || 0} invoices`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showSnackbar(`Error fetching invoices: ${error.message || 'Unknown error'}`, 'error');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    
    // Also refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });
    
    // Clean up the listener when the component is unmounted
    return unsubscribe;
  }, [navigation, fetchInvoices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  }, [fetchInvoices]);

  // Helper function to determine the status badge style
  const getStatusStyle = (status) => {
    // Check if status is a number or string
    const statusValue = typeof status === 'number' 
      ? status 
      : typeof status === 'string' && !isNaN(Number(status))
        ? Number(status)
        : null;
    
    if (statusValue === 2 || status === 'Paid') {
      return styles.statusPaid;
    } else if (statusValue === 1 || status === 'Sent') {
      return styles.statusSent;
    } else if (statusValue === 3 || status === 'Overdue') {
      return styles.statusOverdue;
    } else if (statusValue === 4 || status === 'Cancelled') {
      return styles.statusCancelled;
    } else {
      return styles.statusDraft;
    }
  };
  
  // Helper function to get status label
  const getStatusLabel = (status) => {
    // Convert numeric status to string label
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'Draft';
        case 1: return 'Sent';
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
    
    // Otherwise, return the string status
    return status || 'Unknown';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading invoices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        renderItem={({ item }) => (
          <Card 
            style={styles.invoiceCard} 
            onPress={() => navigation.navigate('InvoiceDetails', { invoiceId: item.id })}
          >
            <Card.Content>
              <View style={styles.invoiceHeader}>
                <Title style={styles.invoiceNumber}>#{item.invoiceNumber}</Title>
                <View style={[
                  styles.statusBadge, 
                  getStatusStyle(item.status)
                ]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <Paragraph style={styles.customerName}>{item.customerName || 'Unknown Customer'}</Paragraph>
              <View style={styles.invoiceDetails}>
                <View>
                  <Text style={styles.dateLabel}>Date:</Text>
                  <Text style={styles.date}>
                    {item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.dateLabel}>Due Date:</Text>
                  <Text style={[
                    styles.date,
                    item.status === 3 || item.status === 'Overdue' ? styles.overdueText : null
                  ]}>
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.total}>${(item.total || 0).toFixed(2)}</Text>
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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No invoices found</Text>
            <Button 
              mode="contained"
              onPress={() => navigation.navigate('Orders')}
              style={styles.emptyButton}
              color="#0284c7"
            >
              View Orders
            </Button>
          </View>
        )}
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
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    marginBottom: 12,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerName: {
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
  },
  statusSent: {
    backgroundColor: '#e0f2fe',
  },
  statusDraft: {
    backgroundColor: '#e5e7eb',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
  },
  statusCancelled: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  total: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    marginTop: 10,
  },
});

export default InvoicesScreen; 