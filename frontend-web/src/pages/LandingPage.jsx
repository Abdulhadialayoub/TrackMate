import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { ArrowForward, Assessment, Security, Timeline, GroupWork } from '@mui/icons-material';
import DashboardPlaceholder from '../components/DashboardPlaceholder';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 10
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                Welcome to TrackMate
              </Typography>
              <Typography variant="h5" paragraph>
                Your all-in-one business tracking and management solution
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={handleGetStarted}
                sx={{ 
                  mt: 2, 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  }
                }}
                endIcon={<ArrowForward />}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <DashboardPlaceholder />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Our Features
        </Typography>
        <Grid container spacing={4} mt={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Comprehensive Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gain actionable insights through our advanced analytics dashboard
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Security sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Secure Platform
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your data is protected with enterprise-grade security measures
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Real-time Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor your business performance in real-time with live updates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <GroupWork sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Team Collaboration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enable seamless collaboration among your team members
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h3" component="h2">
              Ready to Transform Your Business?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              Join thousands of businesses already using TrackMate to streamline operations, boost productivity, and drive growth.
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleGetStarted}
              endIcon={<ArrowForward />}
            >
              Start Now
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" component="h3">
                TrackMate
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                © {new Date().getFullYear()} TrackMate. All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Stack direction="row" spacing={2}>
                <Button color="inherit" size="small">Terms</Button>
                <Button color="inherit" size="small">Privacy</Button>
                <Button color="inherit" size="small">Contact</Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 