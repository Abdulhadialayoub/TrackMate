import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Grid,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Email as EmailIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

// API setup
const apiBaseUrl = 'http://trackmate.runasp.net/api';

const api = axios.create({
  baseURL: apiBaseUrl
});

// Add authorization interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Define status colors
const getStatusColor = (status) => {
  const statusMap = {
    'Sent': 'success',
    'Failed': 'error',
    'Pending': 'warning',
    'Scheduled': 'info'
  };
  return statusMap[status] || 'default';
};

// Ana bileşen
const CompanyLogs = () => {
  const navigate = useNavigate();
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Check user permissions
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Parse JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const { role } = JSON.parse(jsonPayload);
        
        // Only Admin or Dev roles can access
        if (role !== 'Admin' && role !== 'Dev') {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch email logs
  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      // Fetch email logs
      const response = await api.get('/Email/logs');
      if (response.data && response.data.data) {
        setEmailLogs(response.data.data);
      } else {
        setEmailLogs([]);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      showAlert('error', 'Failed to load email logs');
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchEmailLogs();
  };

  const showAlert = (severity, message) => {
    setAlert({
      open: true,
      severity,
      message
    });
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                Company Logs
              </Typography>
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Box>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Email Logs" />
              <Tab label="System Activities" disabled />
              <Tab label="User Activities" disabled />
            </Tabs>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {tabValue === 0 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Recipient</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {emailLogs.length > 0 ? (
                          emailLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{formatDate(log.sentAt || log.createdAt)}</TableCell>
                              <TableCell>{log.to}</TableCell>
                              <TableCell>{log.subject}</TableCell>
                              <TableCell>
                                <Chip 
                                  icon={<EmailIcon />} 
                                  label={log.status} 
                                  color={getStatusColor(log.status)} 
                                  size="small" 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No logs to display.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Alertler */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CompanyLogs; 