import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const { darkMode, toggleDarkMode, addNotification } = useAppContext();
  const [tabValue, setTabValue] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    baseUrl: localStorage.getItem('api_base_url') || 'https://wren-integral-lionfish.ngrok-free.app/api',
    timeout: localStorage.getItem('api_timeout') || '10000'
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApiSettingsChange = (e) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveApiSettings = () => {
    setSaving(true);
    try {
      localStorage.setItem('api_base_url', apiSettings.baseUrl);
      localStorage.setItem('api_timeout', apiSettings.timeout);
      
      addNotification({
        message: 'API settings saved successfully. Please refresh the application.',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        message: 'Failed to save API settings',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    // In a real app, this would update the app's language
    addNotification({
      message: `Language changed to ${event.target.value === 'en' ? 'English' : event.target.value === 'tr' ? 'Turkish' : 'Spanish'}`,
      type: 'info'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<StorageIcon />} label="API Configuration" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <List>
            <ListItem>
              <ListItemIcon>
                {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              <ListItemText 
                primary="Dark Mode" 
                secondary="Toggle between light and dark theme"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Language" 
                secondary="Select your preferred language"
              />
              <ListItemSecondaryAction>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="tr">Turkish</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Enable Notifications" 
                secondary="Show system notifications"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Email Notifications" 
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  disabled={!notificationsEnabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Changing these settings may affect application connectivity. Only modify if you know what you're doing.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="baseUrl"
                    label="API Base URL"
                    value={apiSettings.baseUrl}
                    onChange={handleApiSettingsChange}
                    fullWidth
                    margin="normal"
                    helperText="The base URL for API requests"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="timeout"
                    label="Request Timeout (ms)"
                    value={apiSettings.timeout}
                    onChange={handleApiSettingsChange}
                    type="number"
                    fullWidth
                    margin="normal"
                    helperText="Maximum time to wait for API responses (in milliseconds)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                    onClick={saveApiSettings}
                    disabled={saving}
                  >
                    Save API Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Security settings are managed by your administrator. Please contact them for any changes.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Session Timeout
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your session will automatically expire after 120 minutes of inactivity.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Two-factor authentication is currently not enabled for your account.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 1 }}
                disabled
              >
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
