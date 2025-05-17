import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Share, Linking, Platform } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Divider, Chip, IconButton, Dialog, TextInput, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { invoiceService, messageService } from '../../services';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as MediaLibrary from 'expo-media-library';

const InvoiceDetailsScreen = ({ route, navigation }) => {
  // Extract invoice data from route params
  const extractInvoiceData = () => {
    if (!route.params) return { id: null, directInvoice: null };
    
    // Case 1: Direct invoice object provided
    if (route.params.invoice) {
      const invoice = route.params.invoice;
      
      // Add id field if it doesn't exist but $id does (like in web implementation)
      if (!invoice.id && invoice.$id) {
        invoice.id = invoice.$id;
      }
      
      console.log('Invoice from params:', invoice);
      console.log('Invoice items:', invoice.invoiceItems || invoice.items);
      
      // If the invoice has an id, return both the id and the invoice
      if (invoice.id) {
        return { id: invoice.id, directInvoice: invoice };
      }
      
      // For the case where API returns invoice without explicit id field
      // Web implementation uses the invoice number as a fallback identifier
      if (invoice.invoiceNumber) {
        console.log('Using invoiceNumber as identifier:', invoice.invoiceNumber);
        return { id: invoice.invoiceNumber, directInvoice: invoice };
      }
      
      // We'll use the invoice directly without an id
      return { id: null, directInvoice: invoice };
    }
    
    // Case 2: Only invoiceId provided
    if (route.params.invoiceId) {
      return { id: route.params.invoiceId, directInvoice: null };
    }
    
    return { id: null, directInvoice: null };
  };
  
  const { id: invoiceId, directInvoice } = extractInvoiceData();
  const [invoice, setInvoice] = useState(directInvoice || null);
  const [loading, setLoading] = useState(!directInvoice);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [error, setError] = useState(null);
  const [emailDialogVisible, setEmailDialogVisible] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  useEffect(() => {
    // If we already have the invoice data directly, no need to fetch
    if (directInvoice) {
      console.log('Using direct invoice data, skipping API fetch');
      setInvoice(directInvoice);
      setLoading(false);
      return;
    }
    
    // Otherwise fetch invoice by ID
    if (invoiceId) {
      fetchInvoiceDetails();
    } else {
      setError('No invoice ID provided');
      setLoading(false);
    }
  }, [invoiceId, directInvoice]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      
      if (!invoiceId) {
        console.error('No invoice ID provided');
        setError('No invoice ID provided');
        return;
      }
      
      console.log('Fetching invoice details for ID/Number:', invoiceId);
      
      let result;
      
      // Check if invoiceId is numeric (an actual ID) or a string (invoice number)
      if (!isNaN(invoiceId) && String(invoiceId).trim() !== '') {
        // It's a numeric ID
        result = await invoiceService.getById(invoiceId);
      } else if (typeof invoiceId === 'string' && invoiceId.trim() !== '') {
        // It might be an invoice number
        result = await invoiceService.getByNumber(invoiceId);
      } else {
        throw new Error('Invalid invoice identifier');
      }
      
      if (result.success && result.data) {
        console.log('Invoice details retrieved successfully');
        // Handle different response structures
        let invoiceData = result.data;
        
        // If the response has a $id but no id, add it like in web
        if (invoiceData.$id && !invoiceData.id) {
          invoiceData.id = invoiceData.$id;
        }
        
        // If the response is in .NET format with $values
        if (invoiceData.$values) {
          if (Array.isArray(invoiceData.$values) && invoiceData.$values.length > 0) {
            invoiceData = invoiceData.$values[0];
            
            // Add id field if missing but $id is available
            if (invoiceData.$id && !invoiceData.id) {
              invoiceData.id = invoiceData.$id;
            }
          }
        }
        
        setInvoice(invoiceData);
      } else {
        console.error('Failed to get invoice details:', result.message);
        setError(result.message || 'Failed to load invoice');
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Error loading invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async () => {
    try {
      setDownloading(true);
      
      // Get the PDF directly from the API endpoint
      const result = await invoiceService.getInvoicePdf(invoice?.id);
      
      if (result && result.success) {
        console.log('Successfully retrieved PDF from API');
        
        // Create a temporary file path for the PDF
        const pdfFile = FileSystem.documentDirectory + `invoice_${invoice.id || invoice.invoiceNumber}_${Date.now()}.pdf`;
        
        // Write the blob to the file
        await FileSystem.writeAsStringAsync(pdfFile, result.blob, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        
        // For Android, we need to use a sharing method that doesn't expose the file directly
        if (Platform.OS === 'android') {
          // Check if sharing is available
          const isSharingAvailable = await Sharing.isAvailableAsync();
          
          if (isSharingAvailable) {
            await Sharing.shareAsync(pdfFile, {
              dialogTitle: `View Invoice ${invoice.invoiceNumber || invoice.id}`,
              UTI: '.pdf',
              mimeType: 'application/pdf'
            });
          } else {
            // Fallback to basic share if sharing is not available
            await Share.share({
              url: pdfFile,
              title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
              message: `Invoice ${invoice.invoiceNumber || invoice.id} PDF`
            });
          }
        } else {
          // On iOS, we can open directly
          await Linking.openURL(pdfFile);
        }
      } else {
        console.log('API PDF retrieval failed, falling back to local generation');
        // Fall back to local PDF generation
        await generateAndShowPdf();
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      Alert.alert('Error', 'Failed to view PDF: ' + error.message);
      
      // Fall back to local generation
      try {
        await generateAndShowPdf();
      } catch (fallbackError) {
        console.error('Fallback PDF generation failed:', fallbackError);
        Alert.alert('Error', 'Failed to generate PDF');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      
      // Get the PDF directly from the API endpoint
      const result = await invoiceService.getInvoicePdf(invoice?.id);
      
      if (result && result.success) {
        console.log('Successfully retrieved PDF from API for download');
        
        // Create a temporary file path for the PDF
        const pdfFile = FileSystem.documentDirectory + `invoice_${invoice.id || invoice.invoiceNumber}_${Date.now()}.pdf`;
        
        // Write the blob to the file
        await FileSystem.writeAsStringAsync(pdfFile, result.blob, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        
        // In Expo Go on newer Android versions, MediaLibrary has limited permissions
        // So we'll use sharing directly instead of trying to save to media library
        const isSharingAvailable = await Sharing.isAvailableAsync();
        
        if (isSharingAvailable) {
          await Sharing.shareAsync(pdfFile, {
            dialogTitle: `Save Invoice ${invoice.invoiceNumber || invoice.id}`,
            UTI: '.pdf',
            mimeType: 'application/pdf'
          });
          Alert.alert('Info', 'Please use the "Save to Files" or similar option in the share menu to save the PDF');
        } else {
          // If sharing is not available, try basic Share API
          await Share.share({
            url: pdfFile,
            title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
            message: `Invoice ${invoice.invoiceNumber || invoice.id} PDF`
          });
        }
      } else {
        console.log('API PDF download failed, falling back to local generation');
        // Fall back to local PDF generation
        await generateAndDownloadPdf();
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download PDF: ' + error.message);
      
      // Fall back to local generation
      try {
        await generateAndDownloadPdf();
      } catch (fallbackError) {
        console.error('Fallback PDF generation failed:', fallbackError);
        Alert.alert('Error', 'Failed to generate PDF');
      }
    } finally {
      setDownloading(false);
    }
  };
  
  // Helper function for local PDF generation as fallback
  const generateAndShowPdf = async () => {
    // For a real implementation, download the PDF from the API
    // For demo purposes, generate a simple PDF
    const htmlContent = generateInvoiceHtml(invoice);
    
    // Convert HTML to PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    // For Android, we need to use a sharing method that doesn't expose the file directly
    if (Platform.OS === 'android') {
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Use expo-sharing which handles permissions properly
        await Sharing.shareAsync(uri, {
          dialogTitle: `Invoice ${invoice.invoiceNumber || invoice.id}`,
          UTI: '.pdf',
          mimeType: 'application/pdf'
        });
      } else {
        // Fallback to basic share if sharing is not available
        await Share.share({
          url: uri,
          title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
          message: `Invoice ${invoice.invoiceNumber || invoice.id} PDF`
        });
      }
    } else {
      // On iOS, we can open directly
      await Linking.openURL(uri);
    }
  };
  
  // Helper function for local PDF generation as fallback
  const generateAndDownloadPdf = async () => {
    // For a real implementation, download the PDF from the API
    // For demo purposes, generate a simple PDF
    const htmlContent = generateInvoiceHtml(invoice);
    
    // Convert HTML to PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    // In Expo Go on newer Android versions, MediaLibrary has limited permissions
    // So we'll use sharing directly instead of trying to save to media library
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Save Invoice ${invoice.invoiceNumber || invoice.id}`,
        UTI: '.pdf',
        mimeType: 'application/pdf'
      });
      Alert.alert('Info', 'Please use the "Save to Files" or similar option in the share menu to save the PDF');
    } else {
      // If sharing is not available, try basic Share API
      await Share.share({
        url: uri,
        title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
        message: `Invoice ${invoice.invoiceNumber || invoice.id} PDF`
      });
    }
  };

  const handleEmailInvoice = () => {
    setEmailAddress(invoice.customer?.email || '');
    setEmailDialogVisible(true);
  };

  const sendEmail = async () => {
    if (!emailAddress.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setEmailing(true);
      setEmailDialogVisible(false);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress)) {
        Alert.alert('Error', 'Please enter a valid email address');
        setEmailing(false);
        return;
      }
      
      // Format invoice number for subject line
      const invoiceRef = invoice.invoiceNumber || `Invoice #${invoice.id}`;
      
      // Prepare email data
      const subject = `Invoice: ${invoiceRef}`;
      const body = `Dear ${invoice.customerName || 'Customer'},

Please find attached your invoice ${invoiceRef}.

Due date: ${new Date(invoice.dueDate).toLocaleDateString()}

Thank you for your business.

Best regards,
${invoice.companyName || 'Our Company'}`;
      
      // Send invoice via email using messageService (matching web implementation)
      const result = await messageService.sendInvoiceEmail(
        invoice.id,
        emailAddress,
        subject,
        body
      );
      
      if (result && result.success) {
        Alert.alert('Success', 'Invoice has been sent by email');
        
        // Update invoice status to "Sent" if it was in Draft (status === 0)
        if (invoice.status === 0) {
          try {
            // Call service to update invoice status
            const statusUpdateResult = await invoiceService.updateStatus(invoice.id, 1);
            if (statusUpdateResult && statusUpdateResult.success) {
              // Update local state to reflect new status
              setInvoice({...invoice, status: 1});
            }
          } catch (statusUpdateError) {
            console.error('Failed to update invoice status:', statusUpdateError);
          }
        }
      } else {
        // If server email failed, generate and share PDF directly from the device
        Alert.alert(
          'Server Email Failed',
          'Would you like to share the invoice PDF instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Share PDF', 
              onPress: async () => {
                try {
                  // Generate the PDF
                  const htmlContent = generateInvoiceHtml(invoice);
                  const { uri } = await Print.printToFileAsync({ html: htmlContent });
                  
                  // Share the PDF
                  const isSharingAvailable = await Sharing.isAvailableAsync();
                  
                  if (isSharingAvailable) {
                    await Sharing.shareAsync(uri, {
                      dialogTitle: `Share Invoice ${invoiceRef} PDF`,
                      UTI: '.pdf',
                      mimeType: 'application/pdf'
                    });
                  }
                } catch (pdfError) {
                  console.error('Error generating PDF for sharing:', pdfError);
                  Alert.alert('Error', 'Failed to generate PDF for sharing');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email: ' + error.message);
    } finally {
      setEmailing(false);
    }
  };

  const generateInvoiceHtml = (invoice) => {
    if (!invoice) return '<html><body>No invoice data</body></html>';
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    // Get invoice items from different possible sources (match web implementation)
    let invoiceItems = [];
    
    // Case 1: Check for invoiceItems (primary property used in web version)
    if (invoice.invoiceItems) {
      // Handle case where it's an array
      if (Array.isArray(invoice.invoiceItems) && invoice.invoiceItems.length > 0) {
        invoiceItems = invoice.invoiceItems;
        console.log('Found invoiceItems array with', invoiceItems.length, 'items');
      } 
      // Handle .NET serialization with $values
      else if (invoice.invoiceItems.$values && Array.isArray(invoice.invoiceItems.$values)) {
        invoiceItems = invoice.invoiceItems.$values;
        console.log('Found invoiceItems.$values array with', invoiceItems.length, 'items');
      }
    }
    // Case 2: Fallback to items property
    else if (invoice.items) {
      // Handle case where it's an array
      if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        invoiceItems = invoice.items;
        console.log('Falling back to items array with', invoiceItems.length, 'items');
      } 
      // Handle .NET serialization with $values
      else if (invoice.items.$values && Array.isArray(invoice.items.$values)) {
        invoiceItems = invoice.items.$values;
        console.log('Falling back to items.$values array with', invoiceItems.length, 'items');
      }
    }
    // Case 3: If there's no items array, we'll create a placeholder item from invoice total
    else if (invoice.total || invoice.totalAmount) {
      invoiceItems = [{
        description: 'Invoice total',
        productName: 'Invoice total',
        quantity: 1,
        unitPrice: invoice.total || invoice.totalAmount || 0,
        total: invoice.total || invoice.totalAmount || 0
      }];
      console.log('Created placeholder item from invoice total');
    }
    
    console.log('Invoice items for PDF:', JSON.stringify(invoiceItems));
    
    // Calculate totals based on invoice data or recalculate from items
    const subtotal = invoice.subtotal || invoiceItems.reduce((sum, item) => {
      const price = item.unitPrice || item.price || 0;
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
    
    const taxAmount = invoice.taxAmount || (invoice.taxRate ? (subtotal * (invoice.taxRate / 100)) : 0);
    const total = invoice.total || invoice.totalAmount || (subtotal + taxAmount + (invoice.shippingCost || 0));

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #0284c7; }
            .section-title { font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
            .customer-info, .company-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f3f4f6; text-align: left; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .totals { margin-top: 30px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-label { font-weight: bold; }
            .grand-total { font-size: 18px; font-weight: bold; color: #0284c7; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div>
              <div class="invoice-title">Invoice ${invoice.invoiceNumber || `#${invoice.id}`}</div>
              <div>Date: ${formatDate(invoice.invoiceDate)}</div>
              <div>Due Date: ${formatDate(invoice.dueDate)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 18px;">${invoice.companyName || 'Your Company'}</div>
              <div>Status: ${invoice.status || 'Draft'}</div>
            </div>
          </div>
          
          <div class="section-title">Bill To</div>
          <div class="customer-info">
            <div><strong>${invoice.customerName || 'Customer'}</strong></div>
            <div>${invoice.customer?.email || 'No email'}</div>
            <div>${invoice.customer?.phone || 'No phone'}</div>
            <div>${invoice.customer?.address || 'No address'}</div>
          </div>
          
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.length > 0 ? 
                invoiceItems.map(item => `
                  <tr>
                    <td>${item.description || item.productName || item.name || (item.product ? item.product.name : 'Item')}</td>
                    <td>${item.quantity || 1}</td>
                    <td>$${(item.unitPrice || item.price || 0).toFixed(2)}</td>
                    <td>$${((item.quantity || 1) * (item.unitPrice || item.price || 0)).toFixed(2)}</td>
                  </tr>
                `).join('') 
                : '<tr><td colspan="4">No items</td></tr>'
              }
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div>$${subtotal.toFixed(2)}</div>
            </div>
            ${invoice.taxRate ? `
              <div class="total-row">
                <div class="total-label">Tax (${invoice.taxRate}%):</div>
                <div>$${taxAmount.toFixed(2)}</div>
              </div>
            ` : ''}
            ${invoice.shippingCost ? `
              <div class="total-row">
                <div class="total-label">Shipping:</div>
                <div>$${invoice.shippingCost.toFixed(2)}</div>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <div>Total:</div>
              <div>$${total.toFixed(2)} ${invoice.currency || 'USD'}</div>
            </div>
          </div>
          
          ${invoice.notes ? `
            <div class="section-title">Notes</div>
            <div>${invoice.notes}</div>
          ` : ''}
        </body>
      </html>
    `;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Loading invoice details...</Text>
      </View>
    );
  }

  if (downloading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Generating PDF...</Text>
      </View>
    );
  }

  if (emailing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={{ marginTop: 10 }}>Sending email...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchInvoiceDetails}
          style={{ marginTop: 16, backgroundColor: '#0284c7' }}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Invoice not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16, backgroundColor: '#0284c7' }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title style={styles.invoiceId}>
              {invoice.invoiceNumber || `Invoice #${invoice.id}`}
            </Title>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(invoice.status) + '20' }]}
              textStyle={{ color: getStatusColor(invoice.status) }}
            >
              {getStatusLabel(invoice.status)}
            </Chip>
          </View>
          <View style={styles.dates}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.dateLabel}>Invoice Date:</Text>
              <Text style={styles.dateValue}>
                {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'Not set'}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color="#6b7280" />
              <Text style={styles.dateLabel}>Due Date:</Text>
              <Text style={styles.dateValue}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Customer Information</Title>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{invoice.customerName || 'Unknown Customer'}</Text>
            {invoice.customer && (
              <>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
                  <Text style={styles.infoText}>{invoice.customer.email || 'No email'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                  <Text style={styles.infoText}>{invoice.customer.phone || 'No phone'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                  <Text style={styles.infoText}>{invoice.customer.address || 'No address'}</Text>
                </View>
              </>
            )}
          </View>
          
          {invoice.notes && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Notes</Title>
              <Paragraph style={styles.notes}>{invoice.notes}</Paragraph>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Invoice Items</Title>
          
          {(() => {
            // Get invoice items from different possible sources (match web implementation)
            console.log('Rendering invoice items, raw invoice data:', invoice);
            let items = null;
            
            // Case 1: Check for invoiceItems (primary property used in web version)
            if (invoice.invoiceItems) {
              console.log('Found invoiceItems property:', invoice.invoiceItems);
              // Handle case where it's an array
              if (Array.isArray(invoice.invoiceItems) && invoice.invoiceItems.length > 0) {
                items = invoice.invoiceItems;
                console.log('Using invoiceItems array with', items.length, 'items');
              } 
              // Handle .NET serialization with $values
              else if (invoice.invoiceItems.$values && Array.isArray(invoice.invoiceItems.$values)) {
                items = invoice.invoiceItems.$values;
                console.log('Using invoiceItems.$values array with', items.length, 'items');
              }
            }
            // Case 2: Fallback to items property
            else if (invoice.items) {
              console.log('Found items property:', invoice.items);
              // Handle case where it's an array
              if (Array.isArray(invoice.items) && invoice.items.length > 0) {
                items = invoice.items;
                console.log('Falling back to items array with', items.length, 'items');
              } 
              // Handle .NET serialization with $values
              else if (invoice.items.$values && Array.isArray(invoice.items.$values)) {
                items = invoice.items.$values;
                console.log('Falling back to items.$values array with', items.length, 'items');
              }
            }
            
            // Log the final items array we're using
            console.log('Final items array for rendering:', items);
            
            if (items && items.length > 0) {
              return (
                <>
                  <View style={styles.itemsHeaderRow}>
                    <Text style={[styles.itemHeader, { flex: 2 }]}>Item</Text>
                    <Text style={[styles.itemHeader, { flex: 0.5 }]}>Qty</Text>
                    <Text style={[styles.itemHeader, { flex: 1, textAlign: 'right' }]}>Price</Text>
                    <Text style={[styles.itemHeader, { flex: 1, textAlign: 'right' }]}>Total</Text>
                  </View>
                  {items.map((item, index) => (
                    <View key={item.id || index}>
                      {index > 0 && <Divider style={styles.itemDivider} />}
                      <View style={styles.orderItem}>
                        <Text style={[styles.itemCell, { flex: 2 }]}>
                          {item.description || item.productName || item.name || (item.product ? item.product.name : 'Unnamed Item')}
                        </Text>
                        <Text style={[styles.itemCell, { flex: 0.5 }]}>{item.quantity || 1}</Text>
                        <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>
                          ${(item.unitPrice || item.price || 0).toFixed(2)}
                        </Text>
                        <Text style={[styles.itemCell, { flex: 1, textAlign: 'right', fontWeight: '500' }]}>
                          ${((item.quantity || 1) * (item.unitPrice || item.price || 0)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  <Divider style={[styles.divider, styles.totalDivider]} />
                  
                  <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal:</Text>
                      <Text style={styles.totalValue}>
                        ${invoice.subtotal?.toFixed(2) || items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitPrice || item.price || 0)), 0).toFixed(2)}
                      </Text>
                    </View>
                    {
                      (invoice.taxRate > 0 || invoice.taxAmount > 0) && (
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Tax {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}:</Text>
                          <Text style={styles.totalValue}>
                            ${invoice.taxAmount?.toFixed(2) || '0.00'}
                          </Text>
                        </View>
                      )
                    }
                    {
                      invoice.shippingCost > 0 && (
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Shipping:</Text>
                          <Text style={styles.totalValue}>${invoice.shippingCost?.toFixed(2) || '0.00'}</Text>
                        </View>
                      )
                    }
                    <View style={styles.totalRow}>
                      <Text style={styles.grandTotalLabel}>Total:</Text>
                      <Text style={styles.grandTotalValue}>
                        ${invoice.total?.toFixed(2) || invoice.totalAmount?.toFixed(2) || '0.00'} {invoice.currency || 'USD'}
                      </Text>
                    </View>
                  </View>
                </>
              );
            } else {
              return <Paragraph style={styles.noItemsText}>No items found in this invoice</Paragraph>;
            }
          })()}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Actions</Title>
          <View style={styles.actionButtons}>
            
            <Button 
              mode="contained" 
              icon="download" 
              onPress={handleDownloadPdf}
              style={[styles.actionButton, { backgroundColor: '#059669' }]}
            >
              Download PDF
            </Button>
            
            <Button 
              mode="contained" 
              icon="email" 
              onPress={handleEmailInvoice}
              style={[styles.actionButton, { backgroundColor: '#6366f1' }]}
            >
              Email Invoice
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpace} />
      
      <Portal>
        <Dialog visible={emailDialogVisible} onDismiss={() => setEmailDialogVisible(false)}>
          <Dialog.Title>Send Invoice by Email</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email Address"
              value={emailAddress}
              onChangeText={setEmailAddress}
              mode="outlined"
              style={{ marginBottom: 10 }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEmailDialogVisible(false)}>Cancel</Button>
            <Button onPress={sendEmail}>Send</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceId: {
    fontSize: 20,
  },
  statusChip: {
    height: 28,
  },
  dates: {
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    marginLeft: 8,
    color: '#6b7280',
    width: 80,
  },
  dateValue: {
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  customerInfo: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 8,
    color: '#4b5563',
  },
  divider: {
    marginVertical: 16,
  },
  notes: {
    color: '#4b5563',
    fontStyle: 'italic',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemHeader: {
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  itemCell: {
    fontSize: 14,
  },
  itemDivider: {
    backgroundColor: '#f3f4f6',
  },
  totalDivider: {
    marginTop: 16,
    backgroundColor: '#d1d5db',
    height: 1.5,
  },
  totalsSection: {
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#6b7280',
  },
  totalValue: {
    color: '#1f2937',
  },
  grandTotalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  grandTotalValue: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'column',
  },
  actionButton: {
    marginBottom: 8,
  },
  bottomSpace: {
    height: 24,
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
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  noItemsText: {
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default InvoiceDetailsScreen; 