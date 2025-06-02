import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated: contextIsAuthenticated } = useAppContext();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  useEffect(() => {
    if (contextIsAuthenticated) {
      navigate('/dashboard');
    }
  }, [contextIsAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Email or username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setApiError('');
    
    try {
      const result = await login({
        username: formData.username,
        password: formData.password
      });
      
      if (result.success) {
        console.log('Login successful via context, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        setApiError(result.message || 'Login failed');
      }
    } catch (error) {
      setApiError('An unexpected error occurred during login attempt.');
      console.error('Login component error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
      }}
    >
      <Container component="main" maxWidth="sm">
        <Grid container>
          <Grid item xs={12}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}
            >
              <Box
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <Typography component="h1" variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  TrackMate
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Sign in to your account to continue
                </Typography>
              </Box>
              
              {apiError && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {apiError}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Email or Username"
                  name="username"
                  autoComplete="email"
                  autoFocus
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  disabled={loading}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ 
                    mt: 4, 
                    mb: 3, 
                    height: 56, 
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">OR</Typography>
                </Divider>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body1">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      style={{ 
                        color: '#0284c7', 
                        textDecoration: 'none',
                        fontWeight: 'bold' 
                      }}
                    >
                      Sign Up
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login; 