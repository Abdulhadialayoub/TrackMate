import React, { useState, useEffect } from 'react';
import { 
  Box, 
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
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Divider,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Sms as SmsIcon, 
  Delete as DeleteIcon, 
  Send as SendIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Notifications as NotificationsIcon,
  PhoneAndroid as PhoneIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { messageService } from '../services/messageService';
import { customerService } from '../services/customerService';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [messageData, setMessageData] = useState({
    recipient: '',
    subject: '',
    content: '',
    messageType: 0, // Email by default
    customerId: '',
    companyId: parseInt(localStorage.getItem('company_id')) || 0,
    relatedEntityId: null,
    relatedEntityType: 'None', // Add a default value for the required field
    errorMessage: '', // Add a non-null value for ErrorMessage
    status: 0
  });

  useEffect(() => {
    fetchMessages();
    fetchCustomers();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      console.log('Fetching message logs...');
      const result = await messageService.getMessageLogs();
      console.log('Fetched messages result:', result);
      
      // If there's no explicit success, try to determine it from the data
      const isSuccess = result.success !== false && (result.data !== undefined || Array.isArray(result.data));
      
      if (isSuccess) {
        // Check different ways the data might be structured
        let messagesData = [];
        
        if (Array.isArray(result.data)) {
          console.log('Message data is an array with', result.data.length, 'items');
          messagesData = result.data;
        } else if (result.data && result.data.$values && Array.isArray(result.data.$values)) {
          // Handle the case where data is wrapped in a $values property (common in .NET responses)
          console.log('Message data has $values array with', result.data.$values.length, 'items');
          messagesData = result.data.$values;
        } else if (result.data && typeof result.data === 'object') {
          // If the data is an object but not null, try to use it
          console.log('Message data is an object, attempting to use as is');
          messagesData = [result.data];
        }
        
        // Check if we actually have data
        if (messagesData && messagesData.length > 0) {
          console.log('Setting messages state with data:', messagesData);
          setMessages(messagesData);
        } else {
          console.log('No messages found in the response or messages array is empty');
          
          // Try direct DB method as fallback if API returned empty results
          console.log('Trying direct database query as fallback...');
          const dbResult = await messageService.getMessageLogsDirectFromDb();
          
          if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
            console.log('Direct DB query returned', dbResult.data.length, 'messages');
            setMessages(dbResult.data);
            showSnackbar('Retrieved messages directly from database', 'success');
          } else {
            setMessages([]);
            // Show a message only if this isn't the initial load
            if (!loading) {
              showSnackbar('No messages found in database', 'info');
            }
          }
        }
      } else {
        console.error('API reported failure or returned no data');
        
        // Try direct DB method as fallback if API failed
        console.log('Trying direct database query as fallback after API failure...');
        const dbResult = await messageService.getMessageLogsDirectFromDb();
        
        if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
          console.log('Direct DB query returned', dbResult.data.length, 'messages');
          setMessages(dbResult.data);
          showSnackbar('Retrieved messages directly from database', 'success');
        } else {
          if (result.message) {
            showSnackbar(result.message, 'error');
          } else {
            showSnackbar('Failed to fetch messages: No data returned', 'error');
          }
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      // Try direct DB method as fallback if exception occurred
      try {
        console.log('Trying direct database query as fallback after exception...');
        const dbResult = await messageService.getMessageLogsDirectFromDb();
        
        if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
          console.log('Direct DB query returned', dbResult.data.length, 'messages');
          setMessages(dbResult.data);
          showSnackbar('Retrieved messages directly from database after API error', 'warning');
        } else {
          showSnackbar('An error occurred while fetching messages: ' + (error.message || 'Unknown error'), 'error');
          setMessages([]);
        }
      } catch (dbError) {
        console.error('Error with direct DB fallback:', dbError);
        showSnackbar('An error occurred while fetching messages: ' + (error.message || 'Unknown error'), 'error');
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      const result = await customerService.getByCompanyId(companyId);
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenSendDialog = () => {
    setMessageData({
      recipient: '',
      subject: '',
      content: '',
      messageType: 0,
      customerId: '',
      companyId: parseInt(localStorage.getItem('company_id')) || 0,
      relatedEntityId: null,
      relatedEntityType: 'None', // Add a default value for the required field
      errorMessage: '', // Add a non-null value for ErrorMessage
      status: 0
    });
    setOpenSendDialog(true);
  };

  const handleCloseSendDialog = () => {
    setOpenSendDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If selecting a customer, prefill their email or phone based on message type
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id.toString() === value);
      if (selectedCustomer) {
        // Determine which contact info to use based on message type
        let recipient;
        switch (messageData.messageType) {
          case 0: // Email
            recipient = selectedCustomer.email || '';
            break;
          case 1: // SMS
          case 3: // WhatsApp
            recipient = selectedCustomer.phone || '';
            break;
          default:
            recipient = selectedCustomer.id.toString();
            break;
        }
        
        setMessageData(prev => ({
          ...prev,
          [name]: value,
          recipient: recipient
        }));
        return;
      }
    }
    
    // For message type changes, update recipient if a customer is selected
    if (name === 'messageType' && messageData.customerId) {
      const selectedCustomer = customers.find(c => c.id.toString() === messageData.customerId);
      if (selectedCustomer) {
        let recipient;
        switch (parseInt(value)) {
          case 0: // Email
            recipient = selectedCustomer.email || '';
            break;
          case 1: // SMS
          case 3: // WhatsApp
            recipient = selectedCustomer.phone || '';
            break;
          default:
            recipient = selectedCustomer.id.toString();
            break;
        }
        
        setMessageData(prev => ({
          ...prev,
          [name]: value,
          recipient: recipient
        }));
        return;
      }
    }
    
    // Default handling for other fields
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!messageData.recipient) {
        showSnackbar('Recipient is required', 'error');
        setLoading(false);
        return;
      }
      
      if (!messageData.subject) {
        showSnackbar('Subject is required', 'error');
        setLoading(false);
        return;
      }
      
      if (!messageData.content) {
        showSnackbar('Message content is required', 'error');
        setLoading(false);
        return;
      }
      
      // Get company ID from localStorage - ensure it's a number
      const companyId = parseInt(localStorage.getItem('company_id')) || 0;
      if (!companyId) {
        showSnackbar('Company ID is missing or invalid', 'error');
        setLoading(false);
        return;
      }
      
      console.log('Sending message using direct email approach');
      
      // Use the simplified direct email approach which is more reliable
      const result = await messageService.sendDirectEmail(
        messageData.recipient.trim(),
        messageData.subject.trim(),
        messageData.content.trim(),
        companyId,
        messageData.customerId || null
      );
      
      if (result.success) {
        showSnackbar('Message sent successfully', 'success');
        handleCloseSendDialog();
        // Try to fetch messages, but don't worry if it fails
        try {
          await fetchMessages();
        } catch (e) {
          console.log('Could not refresh messages but email was sent');
        }
      } else {
        showSnackbar(result.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('An error occurred while sending the message: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;
    
    setLoading(true);
    try {
      const result = await messageService.deleteMessageLog(messageToDelete.id);
      
      if (result.success) {
        showSnackbar('Message deleted successfully', 'success');
        fetchMessages(); // Refresh message list
      } else {
        showSnackbar(result.message || 'Failed to delete message', 'error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showSnackbar('An error occurred while deleting the message', 'error');
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setMessageToDelete(null);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    
    // Change the filter type based on the selected tab
    const filterMap = ['all', '0', '1', '3', '2'];
    setFilterType(filterMap[newValue]);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getMessageTypeIcon = (type) => {
    // Convert type to number if it's a string
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    
    switch (typeNum) {
      case 0:
        return <EmailIcon color="primary" />;
      case 1:
        return <SmsIcon color="secondary" />;
      case 2:
        return <NotificationsIcon style={{ color: '#ff9800' }} />;
      case 3:
        return <WhatsAppIcon style={{ color: '#25D366' }} />;
      case 4:
        return <PhoneIcon color="action" />;
      default:
        return <EmailIcon color="disabled" />;
    }
  };

  const getMessageTypeText = (type) => {
    // Convert type to number if it's a string
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    
    switch (typeNum) {
      case 0:
        return 'Email';
      case 1:
        return 'SMS';
      case 2:
        return 'In-App';
      case 3:
        return 'WhatsApp';
      case 4:
        return 'Push';
      default:
        return 'Unknown';
    }
  };

  const getStatusChip = (status) => {
    // Convert status to number if it's a string
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    
    switch (statusNum) {
      case 0:
        return <Chip label="Pending" color="warning" size="small" />;
      case 1:
        return <Chip label="Sent" color="success" size="small" />;
      case 2:
        return <Chip label="Failed" color="error" size="small" />;
      case 3:
        return <Chip label="Retrying" color="info" size="small" />;
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };

  const filteredMessages = (messages || []).filter(message => {
    // Safely access properties that might be in different formats
    const messageType = message.messageType?.toString() || '0';
    const subject = message.subject || '';
    const recipient = message.recipient || '';
    const customerName = message.customerName || '';
    const content = message.content || '';
    
    // Filter by type
    if (filterType !== 'all') {
      if (messageType !== filterType) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        subject.toLowerCase().includes(searchLower) ||
        recipient.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        content.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const testDirectApiCall = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('company_id')) || 0;
      
      console.log('Testing direct email sending');
      
      // Use the direct email approach which is more reliable
      const result = await messageService.sendDirectEmail(
        "test@example.com",
        "API Test Email",
        "This is a test email from the direct email API",
        companyId
      );
      
      if (result.success) {
        showSnackbar('Direct email test successful', 'success');
      } else {
        showSnackbar(`Direct email test failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Direct email test error:', error);
      showSnackbar('Direct email test error: ' + error.message, 'error');
    }
  };

  const viewRawMessageLogs = async () => {
    try {
      setLoading(true);
      showSnackbar('Fetching raw message logs data...', 'info');
      
      // Make a direct API request using fetch to get raw data
      const token = localStorage.getItem('token');
      const response = await fetch('http://trackmate.runasp.net/api/message/logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Log the raw response
      console.log('Raw message logs response status:', response.status);
      
      if (response.ok) {
        const rawData = await response.json();
        console.log('Raw message logs data:', rawData);
        
        // Display success message with the count
        const count = rawData.data ? 
          (Array.isArray(rawData.data) ? rawData.data.length : 
           (rawData.data.$values ? rawData.data.$values.length : 0)) : 0;
        
        showSnackbar(`Raw data fetched successfully. Found ${count} message logs. Check console for details.`, 'success');
        
        // If we got data but the messages array is empty, update it
        if (count > 0 && (!messages || messages.length === 0)) {
          const messageData = Array.isArray(rawData.data) ? rawData.data : 
                            (rawData.data.$values ? rawData.data.$values : []);
          setMessages(messageData);
        }
      } else {
        console.error('Failed to fetch raw message logs data:', response.statusText);
        showSnackbar(`Failed to fetch raw data: ${response.status} ${response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Error fetching raw message logs:', error);
      showSnackbar('Error fetching raw message logs: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectFromDatabase = async () => {
    try {
      setLoading(true);
      showSnackbar('Fetching message logs directly from database...', 'info');
      
      const result = await messageService.getMessageLogsDirectFromDb();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('Direct DB query returned', result.data.length, 'messages');
        setMessages(result.data);
        showSnackbar(`Retrieved ${result.data.length} messages directly from database`, 'success');
      } else {
        console.log('No messages found in direct database query');
        showSnackbar('No messages found in database', 'info');
      }
    } catch (error) {
      console.error('Error fetching from database:', error);
      showSnackbar('Error fetching from database: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Communication Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all your communications with customers across different channels
          </Typography>
        </div>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SendIcon />} 
          onClick={handleOpenSendDialog}
        >
          New Message
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ mr: 2, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchMessages}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          {/* Add test button for debugging */}
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={testDirectApiCall}
            sx={{ mr: 1 }}
          >
            Test API
          </Button>

          {/* Add view raw data button */}
          <Button 
            variant="outlined" 
            color="info"
            onClick={viewRawMessageLogs}
            sx={{ mr: 1 }}
          >
            View Raw Data
          </Button>
          
          {/* Add direct database query button */}
          <Button 
            variant="outlined" 
            color="warning"
            onClick={fetchDirectFromDatabase}
            sx={{ mr: 1 }}
          >
            DB Query
          </Button>
        </Box>

        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Messages" icon={<FilterIcon />} iconPosition="start" />
          <Tab label="Emails" icon={<EmailIcon />} iconPosition="start" />
          <Tab label="SMS" icon={<SmsIcon />} iconPosition="start" />
          <Tab label="WhatsApp" icon={<WhatsAppIcon />} iconPosition="start" />
          <Tab label="In-App" icon={<NotificationsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table aria-label="messages table">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1">No messages found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchTerm ? 'Try a different search term or clear the search' : 'Send a new message to get started'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((message) => (
                  <TableRow key={message.id || Math.random().toString()} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getMessageTypeIcon(message.messageType)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {getMessageTypeText(message.messageType)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {message.recipient ? (
                        <Tooltip title={message.customerName || (message.customerId ? `Customer ID: ${message.customerId}` : 'Unknown Customer')}>
                          <Typography>{message.recipient}</Typography>
                        </Tooltip>
                      ) : (
                        <Typography color="text.secondary">No Recipient</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {message.subject ? (
                        <Tooltip title={message.content || 'No content'}>
                          <Typography>{message.subject}</Typography>
                        </Tooltip>
                      ) : (
                        <Typography color="text.secondary">No Subject</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {message.sentDate || message.sentAt ? 
                        (() => {
                          try {
                            return new Date(message.sentDate || message.sentAt).toLocaleString();
                          } catch (e) {
                            console.error('Invalid date format:', message.sentDate || message.sentAt);
                            return 'Invalid Date';
                          }
                        })() : 
                        'Not sent yet'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(message.status)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteClick(message)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMessages.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Send Message Dialog */}
      <Dialog open={openSendDialog} onClose={handleCloseSendDialog} maxWidth="md" fullWidth>
        <DialogTitle>Send New Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="message-type-label">Message Type</InputLabel>
                <Select
                  labelId="message-type-label"
                  id="messageType"
                  name="messageType"
                  value={messageData.messageType}
                  onChange={handleInputChange}
                  label="Message Type"
                >
                  <MenuItem value={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1 }} color="primary" />
                      Email
                    </Box>
                  </MenuItem>
                  <MenuItem value={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmsIcon sx={{ mr: 1 }} color="secondary" />
                      SMS
                    </Box>
                  </MenuItem>
                  <MenuItem value={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WhatsAppIcon sx={{ mr: 1 }} style={{ color: '#25D366' }} />
                      WhatsApp
                    </Box>
                  </MenuItem>
                  <MenuItem value={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationsIcon sx={{ mr: 1 }} style={{ color: '#ff9800' }} />
                      In-App Notification
                    </Box>
                  </MenuItem>
                  <MenuItem value={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1 }} color="action" />
                      Push Notification
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="customer-label">Customer</InputLabel>
                <Select
                  labelId="customer-label"
                  id="customerId"
                  name="customerId"
                  value={messageData.customerId}
                  onChange={handleInputChange}
                  label="Customer"
                >
                  <MenuItem value="">
                    <em>None (Manual Recipient)</em>
                  </MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipient"
                name="recipient"
                value={messageData.recipient}
                onChange={handleInputChange}
                placeholder={messageData.messageType === '0' || messageData.messageType === 0 ? 'Email address' : 'Phone number or ID'}
                helperText={
                  messageData.messageType === '0' || messageData.messageType === 0
                    ? 'Enter email address'
                    : messageData.messageType === '1' || messageData.messageType === 1 || messageData.messageType === '3' || messageData.messageType === 3
                    ? 'Enter phone number with country code (e.g., +1234567890)'
                    : 'User ID or device token'
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={messageData.subject}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Content"
                name="content"
                value={messageData.content}
                onChange={handleInputChange}
                multiline
                rows={5}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog}>Cancel</Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default Messages; 