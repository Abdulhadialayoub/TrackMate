import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
                {t('landing.welcome')}
              </Typography>
              <Typography variant="h5" paragraph>
                {t('landing.subtitle')}
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
                {t('landing.getStarted')}
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
          {t('landing.features')}
        </Typography>
        <Grid container spacing={4} mt={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  {t('landing.features.analytics.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.features.analytics.description')}
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
                  {t('landing.features.security.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.features.security.description')}
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
                  {t('landing.features.tracking.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.features.tracking.description')}
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
                  {t('landing.features.collaboration.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.features.collaboration.description')}
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
              {t('landing.cta.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              {t('landing.cta.description')}
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleGetStarted}
              endIcon={<ArrowForward />}
            >
              {t('landing.cta.button')}
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
                © {new Date().getFullYear()} TrackMate. {t('landing.footer.rights')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Stack direction="row" spacing={2}>
                
               <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  {/* LinkedIn Butonu */}
  <a
    href="https://www.linkedin.com/in/abdulhadi-eleyy%C3%BCb/"
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <Button color="inherit" size="small">
      LinkedIn
    </Button>
  </a>

  {/* Mail Adresi ve Mail Butonu */}
  <span style={{ fontSize: '0.875rem', color: 'inherit' }}>
    hadi244588@gmail.com
  </span>
  <a
    href="mailto:hadi244588@gmail.com"
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <Button color="inherit" size="small">
      {t('landing.footer.email')}
    </Button>
  </a>

  {/* GitHub Butonu */}
  <a
    href="https://github.com/Abdulhadialayoub"
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <Button color="inherit" size="small">
      GitHub
    </Button>
  </a>
</div>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 