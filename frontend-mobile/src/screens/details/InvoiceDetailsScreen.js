import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Divider, List, ActivityIndicator, Chip } from 'react-native-paper';
import { invoiceService } from '../../services';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const InvoiceDetailsScreen = ({ route, navigation }) => {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getById(invoiceId);
      console.log('Invoice data:', data);
      setInvoice(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async () => {
    try {
      setPdfLoading(true);
      const result = await invoiceService.getInvoicePdf(invoiceId);
      
      if (result && result.url) {
        // For Android & iOS, we can open the URL in the browser
        await Linking.openURL(result.url);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Failed to generate PDF. Please try again later.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setLoading(true);
      await invoiceService.updateStatus(invoiceId, newStatus);
      await fetchInvoice(); // Refresh the invoice data
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get status color and text
  const getStatusInfo = (status) => {
    const statusMap = {
      0: { label: 'Draft', color: '#e5e7eb', textColor: '#4b5563' },
      1: { label: 'Sent', color: '#e0f2fe', textColor: '#0284c7' },
      2: { label: 'Paid', color: '#d1fae5', textColor: '#047857' },
      3: { label: 'Overdue', color: '#fee2e2', textColor: '#dc2626' },
      4: { label: 'Cancelled', color: '#fef3c7', textColor: '#92400e' }
    };
    
    // Handle numeric status
    if (typeof status === 'number' && statusMap[status]) {
      return statusMap[status];
    }
    
    // Handle string status that is a number
    if (typeof status === 'string' && !isNaN(parseInt(status))) {
      const numericStatus = parseInt(status);
      if (statusMap[numericStatus]) {
        return statusMap[numericStatus];
      }
    }
    
    // Handle string status
    switch(status) {
      case 'Draft': return statusMap[0];
      case 'Sent': return statusMap[1];
      case 'Paid': return statusMap[2];
      case 'Overdue': return statusMap[3];
      case 'Cancelled': return statusMap[4];
      default: return { label: status || 'Unknown', color: '#e5e7eb', textColor: '#4b5563' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading invoice details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchInvoice}
          style={styles.retryButton}
          color="#0284c7"
        >
          Retry
        </Button>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invoice not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
          color="#0284c7"
        >
          Go Back
        </Button>
      </View>
    );
  }

  const { label: statusLabel, color: statusColor, textColor: statusTextColor } = getStatusInfo(invoice.status);
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Title style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Title>
              <Paragraph style={styles.dateText}>
                Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
              </Paragraph>
            </View>
            <Chip 
              style={{ backgroundColor: statusColor }}
              textStyle={{ color: statusTextColor }}
            >
              {statusLabel}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Customer</Title>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            {invoice.customerEmail && (
              <Text style={styles.customerDetail}>{invoice.customerEmail}</Text>
            )}
            {invoice.customerPhone && (
              <Text style={styles.customerDetail}>{invoice.customerPhone}</Text>
            )}
            {invoice.billingAddress && (
              <Text style={styles.customerDetail}>{invoice.billingAddress}</Text>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Payment Details</Title>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Status:</Text>
              <Text style={[styles.paymentValue, { color: statusTextColor }]}>{statusLabel}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Due Date:</Text>
              <Text style={[
                styles.paymentValue, 
                invoice.status === 3 || invoice.status === 'Overdue' ? styles.overdue : {}
              ]}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            </View>
            {invoice.paymentMethod && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Method:</Text>
                <Text style={styles.paymentValue}>{invoice.paymentMethod}</Text>
              </View>
            )}
            {invoice.paymentDate && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid On:</Text>
                <Text style={styles.paymentValue}>
                  {new Date(invoice.paymentDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Items</Title>
            {invoice.invoiceItems && invoice.invoiceItems.length > 0 ? (
              invoice.invoiceItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemDescription}>
                      {item.quantity} x ${item.unitPrice.toFixed(2)} 
                      {item.discount > 0 ? ` (-${item.discount}% discount)` : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItems}>No items found</Text>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${(invoice.subtotal || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate || 0}%):</Text>
              <Text style={styles.totalValue}>${(invoice.taxAmount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>${(invoice.total || 0).toFixed(2)}</Text>
            </View>
          </View>
          
          {invoice.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Notes</Title>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
      
      <View style={styles.actions}>
        <Button 
          mode="contained" 
          icon="file-pdf-box" 
          onPress={handleViewPdf}
          loading={pdfLoading}
          disabled={pdfLoading}
          style={styles.actionButton}
        >
          View PDF
        </Button>
        
        {invoice.status === 1 && (
          <Button 
            mode="contained" 
            icon="check-circle" 
            onPress={() => handleUpdateStatus(2)}
            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
          >
            Mark as Paid
          </Button>
        )}
        
        {invoice.status === 0 && (
          <Button 
            mode="contained" 
            icon="email-send" 
            onPress={() => handleUpdateStatus(1)}
            style={[styles.actionButton, { backgroundColor: '#0284c7' }]}
          >
            Mark as Sent
          </Button>
        )}
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
  },
  errorText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  card: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4b5563',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  overdue: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
  },
  noItems: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  totalsSection: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    padding: 16,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default InvoiceDetailsScreen; 