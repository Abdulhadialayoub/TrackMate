import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Badge as BadgeIcon,
  Key as KeyIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  AccountCircle as AccountCircleIcon,
  Work as WorkIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { userService } from '../services/api';
import { useAppContext } from '../context/AppContext';

const UserProfile = () => {
  const theme = useTheme();
  const { user, addNotification } = useAppContext();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [avatarColor, setAvatarColor] = useState('#1976d2');

  useEffect(() => {
    fetchUserProfile();
    // Generate a consistent avatar color based on user email
    if (user?.email) {
      const hash = Array.from(user.email).reduce((acc, char) => char.charCodeAt(0) + acc, 0);
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        '#e91e63', 
        '#9c27b0', 
        '#673ab7',
        '#3f51b5', 
        '#2196f3', 
        '#009688',
        '#4caf50', 
        '#ff9800'
      ];
      setAvatarColor(colors[hash % colors.length]);
    }
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const result = await userService.getCurrentUser();
      if (result.success) {
        setProfileData({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          username: result.data.username || result.data.email || '',
          role: result.data.role || user.role || 'User',
          lastLogin: result.data.lastLogin || new Date().toISOString()
        });
        setError(null);
      } else {
        setError(result.message);
        addNotification({
          message: result.message,
          type: 'error'
        });
      }
    } catch (err) {
      setError('Failed to fetch user profile');
      addNotification({
        message: 'Failed to fetch user profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClickShowPassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Create complete user data with required fields
      const completeUserData = {
        ...profileData,
        // Include required fields that might not be in the form
        id: userId,
        username: profileData.username || profileData.email, // Use email as username if not provided
        role: user.role, // Preserve the user's role
        isActive: true // Set isActive to true for profile updates
      };

      const result = await userService.updateUser(userId, completeUserData);
      if (result.success) {
        addNotification({
          message: 'Profile updated successfully',
          type: 'success'
        });
      } else {
        setError(result.message);
        addNotification({
          message: result.message,
          type: 'error'
        });
      }
    } catch (err) {
      setError('Failed to update profile');
      addNotification({
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const result = await userService.updatePassword(userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        addNotification({
          message: 'Password updated successfully',
          type: 'success'
        });
        setOpenPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordError('');
      } else {
        setPasswordError(result.message);
      }
    } catch (err) {
      setPasswordError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        <Tooltip title="Refresh Profile Data">
          <IconButton onClick={fetchUserProfile} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3} 
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box 
              sx={{
                height: 120,
                bgcolor: 'primary.main',
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: 48,
                  position: 'absolute',
                  top: 60,
                  border: '4px solid #fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  bgcolor: avatarColor
                }}
              >
                {getInitials()}
              </Avatar>
            </Box>
            
            <CardContent sx={{ pt: 8, pb: 3, px: 3, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  mb: 2,
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 1,
                  color: 'primary.main',
                  fontWeight: 'medium'
                }}
              >
                {profileData.role}
              </Typography>

              <Divider sx={{ width: '100%', my: 2 }} />

              <Box sx={{ width: '100%', textAlign: 'left', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Email</Typography>
                    <Typography>{profileData.email}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Phone</Typography>
                    <Typography>{profileData.phone || 'Not provided'}</Typography>
                  </Box>
                </Box>

                
                
                

                {profileData.lastLogin && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <KeyIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="textSecondary">Last Login</Typography>
                      <Typography>
                        {new Date(profileData.lastLogin).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ 
                  mt: 3,
                  width: '100%',
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              p: 3,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3
            }}>
              <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" fontWeight="medium">
                Edit Profile Information
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="lastName"
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="phone"
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                
                
                
              
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                    sx={{ 
                      mt: 2, 
                      px: 4, 
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
          
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              p: 3,
              mt: 3,
              bgcolor: alpha(theme.palette.info.main, 0.05)
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BadgeIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" color="info.main">
                  Account Information
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Username</Typography>
                  <Typography fontWeight="medium">{profileData.username}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Role</Typography>
                  <Typography fontWeight="medium">{profileData.role}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  * Username and role cannot be changed from this interface. Please contact your administrator if you need these details updated.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => !saving && setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`, 
          pb: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
          Change Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {passwordError && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mb: 1 }}>{passwordError}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="currentPassword"
                label="Current Password"
                type={showPassword.currentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword('currentPassword')}
                        edge="end"
                      >
                        {showPassword.currentPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="newPassword"
                label="New Password"
                type={showPassword.newPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
                helperText="Password must be at least 8 characters long"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword('newPassword')}
                        edge="end"
                      >
                        {showPassword.newPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="confirmPassword"
                label="Confirm New Password"
                type={showPassword.confirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleClickShowPassword('confirmPassword')}
                        edge="end"
                      >
                        {showPassword.confirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => setOpenPasswordDialog(false)} 
            disabled={saving}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
