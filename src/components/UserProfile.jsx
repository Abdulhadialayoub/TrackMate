import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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
  Business as BusinessIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { userService } from '../services/api';
import { useAppContext } from '../context/AppContext';

const UserProfile = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
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
  }, [user?.email, i18n.language]);

  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

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
          message: t('profile.messages.fetchError'),
          type: 'error'
        });
      }
    } catch (err) {
      setError(t('profile.messages.fetchError'));
      addNotification({
        message: t('profile.messages.fetchError'),
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
        throw new Error(t('profile.messages.userIdError'));
      }

      const completeUserData = {
        ...profileData,
        id: userId,
        username: profileData.username || profileData.email,
        role: user.role,
        isActive: true
      };

      const result = await userService.updateUser(userId, completeUserData);
      if (result.success) {
        addNotification({
          message: t('profile.messages.updateSuccess'),
          type: 'success'
        });
      } else {
        setError(result.message);
        addNotification({
          message: t('profile.messages.updateError'),
          type: 'error'
        });
      }
    } catch (err) {
      setError(t('profile.messages.updateError'));
      addNotification({
        message: t('profile.messages.updateError'),
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('profile.password.mismatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('profile.password.tooShort'));
      return;
    }

    setSaving(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error(t('profile.messages.userIdError'));
      }

      const result = await userService.updatePassword(userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        addNotification({
          message: t('profile.password.updateSuccess'),
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
      setPasswordError(t('profile.password.updateError'));
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

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    localStorage.setItem('i18nextLng', newLang);
    i18n.changeLanguage(newLang);
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
          {t('profile.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              startAdornment={
                <InputAdornment position="start">
                  <TranslateIcon sx={{ mr: 1 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="tr">Türkçe</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={t('profile.refreshProfile')}>
            <IconButton
              onClick={fetchUserProfile}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: avatarColor,
            fontSize: '2rem'
          }}
        >
          {getInitials()}
        </Avatar>
        <Box>
          <Typography variant="h5">
            {profileData.firstName
              ? `${profileData.firstName} ${profileData.lastName}`
              : profileData.username}
          </Typography>
          <Typography color="textSecondary">
            {t(`profile.roles.${profileData.role?.toLowerCase()}`)}
          </Typography>
          <Typography color="textSecondary">
            {t('profile.fields.phone')}: {profileData.phone || t('profile.fields.notProvided')}
          </Typography>
          <Typography color="textSecondary">
            {t('profile.fields.lastLogin')}: {new Date(profileData.lastLogin).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ marginLeft: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => setOpenPasswordDialog(true)}
          >
            {t('profile.password.change')}
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t('profile.editProfileInformation')}</Typography>
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label={t('profile.fields.firstName')}
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label={t('profile.fields.lastName')}
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="email"
                  label={t('profile.fields.emailAddress')}
                  value={profileData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label={t('profile.fields.phoneNumber')}
                  value={profileData.phone}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={fetchUserProfile}
                startIcon={<RefreshIcon />}
                disabled={loading || saving}
              >
                {t('profile.refreshProfile')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading || saving}
              >
                {saving ? t('profile.buttons.saving') : t('profile.buttons.save')}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccountCircleIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{t('profile.accountInformation')}</Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label={t('profile.fields.username')}
                value={profileData.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label={t('profile.fields.role')}
                value={t(`profile.roles.${profileData.role?.toLowerCase()}`)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            {t('profile.accountUpdateNote')}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} />
            {t('profile.password.change')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              name="currentPassword"
              label={t('profile.password.current')}
              type={showPassword.currentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleClickShowPassword('currentPassword')}
                      edge="end"
                    >
                      {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              name="newPassword"
              label={t('profile.password.new')}
              type={showPassword.newPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={handlePasswordInputChange}
              helperText={t('profile.password.requirement')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleClickShowPassword('newPassword')}
                      edge="end"
                    >
                      {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              name="confirmPassword"
              label={t('profile.password.confirm')}
              type={showPassword.confirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleClickShowPassword('confirmPassword')}
                      edge="end"
                    >
                      {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {passwordError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            {t('profile.buttons.cancel')}
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? t('profile.buttons.updating') : t('profile.buttons.update')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
