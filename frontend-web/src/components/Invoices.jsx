import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Payment as PaymentIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { invoiceService } from '../services/invoiceService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { messageService } from '../services/messageService';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const invoiceStatuses = [
  { value: 0, label: 'Draft', color: 'default' },
  { value: 1, label: 'Sent', color: 'info' },
  { value: 2, label: 'Paid', color: 'success' },
  { value: 3, label: 'Overdue', color: 'error' },
  { value: 4, label: 'Cancelled', color: 'warning' }
];

const Invoices = () => {
  const { t } = useTranslation();
  const { addNotification, companyInfo } = useAppContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: '',
    body: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Add a new effect to check for selected invoice in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const selectedInvoiceId = searchParams.get('selected');
    
    // If there's a selected invoice ID in the URL, fetch and select that invoice
    if (selectedInvoiceId && invoices.length > 0) {
      console.log('Selected invoice ID found in URL:', selectedInvoiceId);
      const invoice = invoices.find(inv => inv.id.toString() === selectedInvoiceId.toString());
      
      if (invoice) {
        console.log('Found matching invoice, selecting it');
        handleInvoiceSelect(invoice);
      } else {
        console.log('Invoice not found in current list, fetching it directly');
        // Invoice not found in current list, fetch it directly
        const fetchSelectedInvoice = async () => {
          try {
            const result = await invoiceService.getById(selectedInvoiceId);
            if (result.success && result.data) {
              handleInvoiceSelect(result.data);
            } else {
              showSnackbar('Failed to load selected invoice', 'error');
            }
          } catch (err) {
            console.error('Error fetching selected invoice:', err);
            showSnackbar('Error loading selected invoice', 'error');
          }
        };
        
        fetchSelectedInvoice();
      }
      
      // Clear the selected parameter from URL
      const clearedParams = new URLSearchParams(location.search);
      clearedParams.delete('selected');
      window.history.replaceState(
        {},
        '',
        clearedParams.toString() ? `?${clearedParams.toString()}` : window.location.pathname
      );
    }
  }, [location.search, invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let currentCompanyId = companyInfo?.id;
      
      if (!currentCompanyId) {
        const companyIdFromStorage = localStorage.getItem('company_id');
        if (companyIdFromStorage) {
          currentCompanyId = parseInt(companyIdFromStorage, 10);
          console.log('Got company ID from localStorage:', currentCompanyId);
        }
      }
      
      console.log('Current company ID for filtering invoices:', currentCompanyId);
      
      let result;
      
      if (currentCompanyId) {
        console.log(`Fetching invoices for company ID: ${currentCompanyId}`);
        result = await invoiceService.getByCompanyId(currentCompanyId);
      } else {
        console.warn('No company ID available, fetching all invoices');
        result = await invoiceService.getAll();
      }
      
      if (result.success) {
        const invoiceData = Array.isArray(result.data) ? result.data : [];
        console.log(`Received ${invoiceData.length} invoices from API`);
        console.log('Full invoice data structure:', JSON.stringify(invoiceData, null, 2));
        
        if (invoiceData.length > 0 && 
            (!invoiceData[0].customer || !invoiceData[0].invoiceItems || 
             !invoiceData[0].customerName || invoiceData[0].invoiceItems?.length === 0)) {
          
          console.log('Invoice data is missing details, fetching individual invoices...');
          
          const detailedInvoices = await Promise.all(
            invoiceData.map(async (invoice) => {
              try {
                const detailResult = await invoiceService.getById(invoice.id);
                if (detailResult.success) {
                  console.log(`Got detailed info for invoice #${invoice.invoiceNumber}`);
                  return detailResult.data;
                }
                return invoice;
              } catch (err) {
                console.error(`Error fetching details for invoice ${invoice.id}:`, err);
                return invoice;
              }
            })
          );
          
          console.log('Fetched detailed invoices:', detailedInvoices.length);
          
          const enhancedInvoices = detailedInvoices.map(invoice => {
            if (!invoice.customerName && invoice.customer?.name) {
              invoice.customerName = invoice.customer.name;
            }
            
            if (!invoice.customerName && invoice.customerId) {
              invoice.customerName = t('customerPlaceholder', 'Customer #{{id}}', { id: invoice.customerId });
            }
            
            return invoice;
          });
          
          setInvoices(enhancedInvoices);
        } else {
          setInvoices(invoiceData);
        }
        
        setError(null);
      } else {
        setInvoices([]);
        setError(result.message);
        showSnackbar(t('fetchInvoicesError', 'Failed to fetch invoices'), 'error');
      }
    } catch (err) {
      setInvoices([]);
      setError(t('fetchInvoicesError', 'Failed to fetch invoices'));
      showSnackbar(t('fetchInvoicesError', 'Failed to fetch invoices'), 'error');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleInvoiceSelect = (invoice) => {
    console.log('Selected invoice full data:', JSON.stringify(invoice, null, 2));
    console.log('Invoice items array:', invoice.invoiceItems);
    console.log('Invoice items length:', invoice.invoiceItems?.length);
    setSelectedInvoice(invoice);
  };

  // Add a new useEffect to monitor selectedInvoice changes
  useEffect(() => {
    if (selectedInvoice) {
      console.log('selectedInvoice state updated:', selectedInvoice);
      console.log('selectedInvoice.invoiceItems:', selectedInvoice.invoiceItems);
    }
  }, [selectedInvoice]);

  const handleCloseDetails = () => {
    setSelectedInvoice(null);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      const result = await invoiceService.delete(invoiceToDelete.id);
      if (result.success) {
        showSnackbar('Invoice deleted successfully', 'success');
        fetchInvoices();
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      showSnackbar('Failed to delete invoice', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setInvoiceToDelete(null);
    }
  };

  const handleGeneratePdf = async (invoiceId, forceDownload = false) => {
    try {
      setLoading(true);
      console.log('Generating PDF for invoice ID:', invoiceId);
      
      // Include debug mode for additional info
      const result = await invoiceService.getInvoicePdf(invoiceId, true);
      console.log('PDF generation result:', result);
      
      if (result.success && result.url && result.blob) {
        // Check if blob has content
        if (result.blob.size === 0) {
          console.error('PDF blob is empty');
          showSnackbar('Generated PDF is empty', 'error');
          return;
        }
        
        console.log(`Using ${result.method} method to handle PDF`);
        
        if (forceDownload) {
          // Force download instead of opening in new tab
          const link = document.createElement('a');
          link.href = result.url;
          link.download = result.filename || `Invoice_${invoiceId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showSnackbar('PDF download started', 'success');
        } else {
          // Try to open in new tab first
          try {
            const newWindow = window.open(result.url, '_blank');
            
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              console.warn('Popup blocked or failed to open. Trying alternative download method.');
              
              // Alternative: Try embedding PDF in iframe
              try {
                // Create modal with iframe
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                modal.style.zIndex = '10000';
                modal.style.display = 'flex';
                modal.style.flexDirection = 'column';
                
                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '&times; Close';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '10px';
                closeBtn.style.right = '10px';
                closeBtn.style.padding = '5px 10px';
                closeBtn.style.backgroundColor = '#f44336';
                closeBtn.style.color = 'white';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '4px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.zIndex = '10001';
                closeBtn.onclick = () => {
                  document.body.removeChild(modal);
                };
                
                // Create iframe
                const iframe = document.createElement('iframe');
                iframe.src = result.url;
                iframe.style.width = '90%';
                iframe.style.height = '90%';
                iframe.style.margin = 'auto';
                iframe.style.border = 'none';
                iframe.style.backgroundColor = 'white';
                
                modal.appendChild(closeBtn);
                modal.appendChild(iframe);
                document.body.appendChild(modal);
                
                showSnackbar('PDF opened in viewer', 'success');
              } catch (iframeError) {
                console.error('Error showing PDF in iframe:', iframeError);
                
                // Fallback to download if iframe fails
                const link = document.createElement('a');
                link.href = result.url;
                link.download = result.filename || `Invoice_${invoiceId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            } else {
              showSnackbar('PDF opened in new tab', 'success');
            }
          } catch (windowError) {
            console.error('Error opening PDF in new window:', windowError);
            
            // Fallback to download
            const link = document.createElement('a');
            link.href = result.url;
            link.download = result.filename || `Invoice_${invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSnackbar('PDF downloaded (fallback method)', 'info');
          }
        }
      } else {
        console.error('Failed to generate PDF:', result.message);
        showSnackbar(result.message || 'Failed to generate PDF', 'error');
      }
    } catch (error) {
      console.error('Error in PDF generation:', error);
      showSnackbar('Error generating PDF: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const result = await invoiceService.updateStatus(id, { status: newStatus });
      if (result.success) {
        showSnackbar('Invoice status updated successfully', 'success');
        fetchInvoices();
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice({...selectedInvoice, status: newStatus});
        }
      } else {
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      showSnackbar('Failed to update invoice status', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    if (addNotification) {
      addNotification({
        message,
        type: severity
      });
    } else {
      setSnackbar({ open: true, message, severity });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoiceStatuses.find(s => s.value === invoice.status)?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status) => {
    const statusInfo = invoiceStatuses.find(s => s.value === status) || 
                      { label: 'Unknown', color: 'default' };
    
    return (
      <Chip 
        label={statusInfo.label} 
        color={statusInfo.color} 
        size="small" 
        variant="outlined"
      />
    );
  };

  const isOverdue = (invoice) => {
    if (invoice.status !== 1) return false; // Only sent invoices can be overdue
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  // Function to open the email dialog
  const handleEmailInvoice = () => {
    if (!selectedInvoice) return;
    
    const customerEmail = selectedInvoice.customerEmail || '';
    
    const formattedAmount = selectedInvoice.total 
      ? selectedInvoice.total.toFixed(2) 
      : (selectedInvoice.totalAmount 
          ? selectedInvoice.totalAmount.toFixed(2) 
          : '0.00');
    
    const companyName = companyInfo?.name || localStorage.getItem('company_name') || t('ourCompany', 'Our Company');
    
    setEmailData({
      recipient: customerEmail,
      subject: t('invoiceEmailSubject', 'Invoice #{{number}} from {{company}}', {
        number: selectedInvoice.invoiceNumber,
        company: companyName
      }),
      body: t('invoiceEmailBody', `Dear {{customer}},

Please find attached your invoice #{{number}} for the amount of {{amount}} {{currency}}.

Due date: {{dueDate}}

Thank you for your business.

Best regards,
{{company}}`, {
        customer: selectedInvoice.customerName,
        number: selectedInvoice.invoiceNumber,
        amount: formattedAmount,
        currency: selectedInvoice.currency || 'USD',
        dueDate: new Date(selectedInvoice.dueDate).toLocaleDateString(),
        company: companyName
      })
    });
    
    setOpenEmailDialog(true);
  };

  // Function to send the email with invoice
  const handleSendEmail = async () => {
    if (!selectedInvoice || !emailData.recipient) return;
    
    try {
      setSendingEmail(true);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.recipient)) {
        showSnackbar(t('invalidEmail', 'Please enter a valid email address'), 'error');
        setSendingEmail(false);
        return;
      }
      
      const result = await messageService.sendInvoiceEmail(
        selectedInvoice.id,
        emailData.recipient,
        emailData.subject,
        emailData.body
      );
      
      if (result.success) {
        showSnackbar(t('emailSentSuccess', 'Invoice sent successfully via email'), 'success');
        setOpenEmailDialog(false);
        
        if (selectedInvoice.status === 0) {
          await handleUpdateStatus(selectedInvoice.id, 1);
        }
      } else {
        showSnackbar(result.message || t('emailSendFailed', 'Failed to send invoice email'), 'error');
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      showSnackbar(t('emailSendError', 'Error sending invoice: {{error}}', {
        error: error.message || t('unknownError', 'Unknown error')
      }), 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {selectedInvoice ? (
        // Invoice details view
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('invoiceNumber', 'Invoice #{{number}}', { number: selectedInvoice.invoiceNumber })}
              {companyInfo?.name && (
                <Typography variant="subtitle1" color="text.secondary">
                  {companyInfo.name}
                </Typography>
              )}
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => handleGeneratePdf(selectedInvoice.id)}
                sx={{ mr: 1 }}
              >
                {t('viewPdf', 'View PDF')}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => handleGeneratePdf(selectedInvoice.id, true)}
                sx={{ mr: 1 }}
              >
                {t('downloadPdf', 'Download PDF')}
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<EmailIcon />}
                onClick={handleEmailInvoice}
                sx={{ mr: 1 }}
              >
                {t('emailInvoice', 'Email Invoice')}
              </Button>
              {selectedInvoice.status === 1 && (
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<PaymentIcon />}
                  onClick={() => handleUpdateStatus(selectedInvoice.id, 2)}
                  sx={{ mr: 1 }}
                >
                  {t('markAsPaid', 'Mark as Paid')}
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={handleCloseDetails}
              >
                {t('backToInvoices', 'Back to Invoices')}
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 3, p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>{t('invoiceInformation', 'Invoice Information')}</Typography>
                {companyInfo?.name && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">{t('from', 'From')}:</Typography>
                    <Typography>{companyInfo.name}</Typography>
                  </Box>
                )}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('customer', 'Customer')}:</Typography>
                  <Typography>{selectedInvoice.customerName}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('invoiceDate', 'Invoice Date')}:</Typography>
                  <Typography>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('dueDate', 'Due Date')}:</Typography>
                  <Typography 
                    sx={{ 
                      color: isOverdue(selectedInvoice) ? 'error.main' : 'inherit',
                      fontWeight: isOverdue(selectedInvoice) ? 'bold' : 'inherit'
                    }}
                  >
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    {isOverdue(selectedInvoice) && ` (${t('overdue', 'OVERDUE')})`}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('status', 'Status')}:</Typography>
                  {getStatusChip(selectedInvoice.status)}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>{t('paymentInformation', 'Payment Information')}</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('paymentMethod', 'Payment Method')}:</Typography>
                  <Typography>{selectedInvoice.paymentMethod || t('notSpecified', 'Not specified')}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('paymentDate', 'Payment Date')}:</Typography>
                  <Typography>
                    {selectedInvoice.paymentDate 
                      ? new Date(selectedInvoice.paymentDate).toLocaleDateString() 
                      : t('notPaidYet', 'Not paid yet')}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{t('referenceNumber', 'Reference Number')}:</Typography>
                  <Typography>{selectedInvoice.referenceNumber || t('na', 'N/A')}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ p: 2 }}>{t('invoiceItems', 'Invoice Items')}</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('product', 'Product')}</TableCell>
                    <TableCell>{t('quantity', 'Quantity')}</TableCell>
                    <TableCell>{t('unitPrice', 'Unit Price')}</TableCell>
                    <TableCell>{t('taxRate', 'Tax Rate')}</TableCell>
                    <TableCell>{t('taxAmount', 'Tax Amount')}</TableCell>
                    <TableCell align="right">{t('total', 'Total')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const items = selectedInvoice?.invoiceItems?.$values || selectedInvoice?.invoiceItems;
                    console.log('Processed items array:', items);
                    
                    if (Array.isArray(items) && items.length > 0) {
                      return items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName || item.product?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice?.toFixed(2)} {selectedInvoice?.currency || 'USD'}</TableCell>
                          <TableCell>{item.taxRate}%</TableCell>
                          <TableCell>{item.taxAmount?.toFixed(2)} {selectedInvoice?.currency || 'USD'}</TableCell>
                          <TableCell align="right">{item.total?.toFixed(2)} {selectedInvoice?.currency || 'USD'}</TableCell>
                        </TableRow>
                      ));
                    } else {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} align="center">{t('noItemsFound', 'No items found')}</TableCell>
                        </TableRow>
                      );
                    }
                  })()}
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>{t('subtotal', 'Subtotal')}:</TableCell>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice?.subtotal?.toFixed(2) || '0.00'} {selectedInvoice?.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                      {t('taxWithRate', 'Tax ({{rate}}%)', { rate: selectedInvoice?.taxRate || 0 })}:
                    </TableCell>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice?.taxAmount?.toFixed(2) || '0.00'} {selectedInvoice?.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>{t('total', 'Total')}:</TableCell>
                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice?.total?.toFixed(2) || '0.00'} {selectedInvoice?.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {selectedInvoice.notes && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>{t('notes', 'Notes')}</Typography>
              <Typography>{selectedInvoice.notes}</Typography>
            </Paper>
          )}
        </Box>
      ) : (
        // Invoices list view
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('invoicesManagement', 'Invoices Management')}
              </Typography>
              {companyInfo?.name && (
                <Typography variant="subtitle1" color="text.secondary">
                  {companyInfo.name}
                </Typography>
              )}
            </Box>
          </Box>

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                variant="outlined"
                placeholder={t('searchInvoices', 'Search invoices...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ mr: 2, flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title={t('refresh', 'Refresh')}>
                <IconButton onClick={fetchInvoices}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('invoiceNumber', 'Invoice #')}</TableCell>
                  <TableCell>{t('customer', 'Customer')}</TableCell>
                  <TableCell>{t('date', 'Date')}</TableCell>
                  <TableCell>{t('dueDate', 'Due Date')}</TableCell>
                  <TableCell>{t('total', 'Total')}</TableCell>
                  <TableCell>{t('status', 'Status')}</TableCell>
                  <TableCell align="right">{t('actions', 'Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('noInvoicesFound', 'No invoices found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((invoice) => {
                      const isInvoiceOverdue = isOverdue(invoice);
                      return (
                        <TableRow 
                          key={invoice.id}
                          hover
                          onClick={() => handleInvoiceSelect(invoice)}
                          sx={{ 
                            cursor: 'pointer',
                            ...(isInvoiceOverdue && { 
                              backgroundColor: 'error.lighter',
                              '&:hover': { backgroundColor: 'error.light' }
                            })
                          }}
                        >
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.customerName || t('unknownCustomer', 'Unknown Customer')}</TableCell>
                          <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                              {isInvoiceOverdue && (
                                <Chip 
                                  label={t('overdue', 'OVERDUE')} 
                                  color="error" 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{invoice.total?.toFixed(2) || '0.00'} {invoice.currency || 'USD'}</TableCell>
                          <TableCell>{getStatusChip(invoice.status)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title={t('generatePdf', 'Generate PDF')}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGeneratePdf(invoice.id);
                                }}
                                color="primary"
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            {invoice.status === 1 && (
                              <Tooltip title={t('markAsPaid', 'Mark as Paid')}>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(invoice.id, 2);
                                  }}
                                  color="success"
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={t('delete', 'Delete')}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(invoice);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('rowsPerPage', 'Rows per page:')}
              labelDisplayedRows={({ from, to, count }) => 
                t('paginationDisplayedRows', '{{from}}-{{to}} of {{count}}', { from, to, count })
              }
            />
          </TableContainer>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>{t('confirmDelete', 'Confirm Delete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('deleteInvoiceConfirm', 'Are you sure you want to delete invoice #{{number}}? This action cannot be undone.', {
              number: invoiceToDelete?.invoiceNumber
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>{t('cancel', 'Cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {t('delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications (fallback if context not available) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Email Invoice Dialog */}
      <Dialog open={openEmailDialog} onClose={() => !sendingEmail && setOpenEmailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('emailInvoice', 'Email Invoice')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('recipientEmail', 'Recipient Email')}
                name="recipient"
                value={emailData.recipient}
                onChange={(e) => setEmailData({...emailData, recipient: e.target.value})}
                required
                disabled={sendingEmail}
                helperText={t('enterEmailHelp', 'Enter the email address to send the invoice to')}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('subject', 'Subject')}
                name="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                disabled={sendingEmail}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('message', 'Message')}
                name="body"
                value={emailData.body}
                onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                multiline
                rows={6}
                disabled={sendingEmail}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenEmailDialog(false)} 
            disabled={sendingEmail}
          >
            {t('cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleSendEmail} 
            variant="contained" 
            color="primary"
            disabled={!emailData.recipient || !emailData.subject || !emailData.body || sendingEmail}
            startIcon={sendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sendingEmail ? t('sending', 'Sending...') : t('sendInvoice', 'Send Invoice')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;
