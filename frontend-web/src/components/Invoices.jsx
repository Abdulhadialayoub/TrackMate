import React, { useState, useEffect } from 'react';
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
  Payment as PaymentIcon
} from '@mui/icons-material';
import { invoiceService } from '../services/invoiceService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { useAppContext } from '../context/AppContext';

const invoiceStatuses = [
  { value: 0, label: 'Draft', color: 'default' },
  { value: 1, label: 'Sent', color: 'info' },
  { value: 2, label: 'Paid', color: 'success' },
  { value: 3, label: 'Overdue', color: 'error' },
  { value: 4, label: 'Cancelled', color: 'warning' }
];

const Invoices = () => {
  const { addNotification } = useAppContext();
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const result = await invoiceService.getAll();
      if (result.success) {
        // Ensure invoices is always an array
        const invoiceData = Array.isArray(result.data) ? result.data : [];
        console.log('Invoice data from API:', invoiceData);
        setInvoices(invoiceData);
        setError(null);
      } else {
        setInvoices([]);
        setError(result.message);
        showSnackbar(result.message, 'error');
      }
    } catch (err) {
      setInvoices([]);
      setError('Failed to fetch invoices');
      showSnackbar('Failed to fetch invoices', 'error');
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
    console.log('Selected invoice:', invoice);
    setSelectedInvoice(invoice);
  };

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

  return (
    <Box sx={{ p: 3 }}>
      {selectedInvoice ? (
        // Invoice details view
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Invoice #{selectedInvoice.invoiceNumber}
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
                onClick={() => handleGeneratePdf(selectedInvoice.id)}
                sx={{ mr: 1 }}
              >
                View PDF
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={() => handleGeneratePdf(selectedInvoice.id, true)}
                sx={{ mr: 1 }}
              >
                Download PDF
              </Button>
              {selectedInvoice.status === 1 && (
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<PaymentIcon />}
                  onClick={() => handleUpdateStatus(selectedInvoice.id, 2)}
                  sx={{ mr: 1 }}
                >
                  Mark as Paid
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={handleCloseDetails}
              >
                Back to Invoices
              </Button>
            </Box>
          </Box>

          <Paper sx={{ mb: 3, p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Invoice Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography>{selectedInvoice.customerName}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Invoice Date:</Typography>
                  <Typography>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Due Date:</Typography>
                  <Typography 
                    sx={{ 
                      color: isOverdue(selectedInvoice) ? 'error.main' : 'inherit',
                      fontWeight: isOverdue(selectedInvoice) ? 'bold' : 'inherit'
                    }}
                  >
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    {isOverdue(selectedInvoice) && ' (OVERDUE)'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Status:</Typography>
                  {getStatusChip(selectedInvoice.status)}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Payment Information</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Payment Method:</Typography>
                  <Typography>{selectedInvoice.paymentMethod || 'Not specified'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Payment Date:</Typography>
                  <Typography>
                    {selectedInvoice.paymentDate 
                      ? new Date(selectedInvoice.paymentDate).toLocaleDateString() 
                      : 'Not paid yet'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Reference Number:</Typography>
                  <Typography>{selectedInvoice.referenceNumber || 'N/A'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ p: 2 }}>Invoice Items</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.invoiceItems && selectedInvoice.invoiceItems.length > 0 ? (
                    selectedInvoice.invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.discount || 0}%</TableCell>
                        <TableCell align="right">{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No items found</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Subtotal:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice.subtotal?.toFixed(2) || '0.00'} {selectedInvoice.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Tax ({selectedInvoice.taxRate || 0}%):</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice.taxAmount?.toFixed(2) || '0.00'} {selectedInvoice.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {selectedInvoice.total?.toFixed(2) || '0.00'} {selectedInvoice.currency || 'USD'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {selectedInvoice.notes && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Notes</Typography>
              <Typography>{selectedInvoice.notes}</Typography>
            </Paper>
          )}
        </Box>
      ) : (
        // Invoices list view
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Invoices Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => addNotification({
                message: 'Invoice creation is coming soon!',
                type: 'info'
              })}
            >
              New Invoice
            </Button>
          </Box>

          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                variant="outlined"
                placeholder="Search invoices..."
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
              <Tooltip title="Refresh">
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
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
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
                      No invoices found
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
                          <TableCell>{invoice.customerName || 'Unknown Customer'}</TableCell>
                          <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                              {isInvoiceOverdue && (
                                <Chip 
                                  label="OVERDUE" 
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
                            <Tooltip title="Generate PDF">
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
                              <Tooltip title="Mark as Paid">
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
                            <Tooltip title="Delete">
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
            />
          </TableContainer>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice #{invoiceToDelete?.invoiceNumber}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
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
    </Box>
  );
};

export default Invoices;
