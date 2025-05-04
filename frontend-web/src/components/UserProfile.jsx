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
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { userService } from '../services/api';
import { useAppContext } from '../context/AppContext';

const UserProfile = () => {
  const { user, addNotification } = useAppContext();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: ''
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

  useEffect(() => {
    fetchUserProfile();
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
          jobTitle: result.data.jobTitle || '',
          department: result.data.department || ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const result = await userService.updateUser(userId, profileData);
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
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: 40,
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {getInitials()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {profileData.jobTitle}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {profileData.department}
              </Typography>

              <Divider sx={{ width: '100%', my: 2 }} />

              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>{profileData.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>{profileData.phone || 'Not provided'}</Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ mt: 2 }}
                fullWidth
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Edit Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    fullWidth
                    required
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="phone"
                    label="Phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="jobTitle"
                    label="Job Title"
                    value={profileData.jobTitle}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="department"
                    label="Department"
                    value={profileData.department}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                    sx={{ mt: 2 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {passwordError && (
              <Grid item xs={12}>
                <Alert severity="error">{passwordError}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
                helperText="Password must be at least 8 characters long"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
