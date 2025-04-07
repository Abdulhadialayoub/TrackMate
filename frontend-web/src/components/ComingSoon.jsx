import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * ComingSoon component to display a placeholder for features that are under development
 * @param {Object} props - Component props
 * @param {string} props.title - Title of the feature that is coming soon
 */
const ComingSoon = ({ title = 'This Feature' }) => {
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
          <Typography variant="h4" gutterBottom fontWeight="medium" color="primary">
            {title} is Coming Soon
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            We're working hard to bring you this feature. Please check back later for updates.
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

export default ComingSoon;
