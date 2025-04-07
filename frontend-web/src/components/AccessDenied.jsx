import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * AccessDenied component to display when a user tries to access a restricted route
 */
const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        height: '100%',
        flex: 1
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            maxWidth: 500,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="medium" color="error">
            Access Denied
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ px: 4, py: 1.2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default AccessDenied;
