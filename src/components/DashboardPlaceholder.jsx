import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Person, 
  ShoppingCart, 
  AttachMoney, 
  Assessment 
} from '@mui/icons-material';

const mockData = [
  { id: 1, customer: "Acme Ltd.", product: "Yazılım Lisansı", amount: 1200, status: "Tamamlandı", date: "2023-10-15" },
  { id: 2, customer: "TechCorp", product: "Bulut Hizmetleri", amount: 850, status: "Beklemede", date: "2023-10-16" },
  { id: 3, customer: "GlobalTrade", product: "Danışmanlık", amount: 3400, status: "Tamamlandı", date: "2023-10-14" },
  { id: 4, customer: "InnovateTech", product: "Donanım", amount: 760, status: "İşleniyor", date: "2023-10-16" },
  { id: 5, customer: "FutureWorks", product: "Destek Planı", amount: 1500, status: "Tamamlandı", date: "2023-10-13" },
];

const getStatusColor = (status) => {
  switch(status) {
    case 'Tamamlandı': return 'success';
    case 'Beklemede': return 'warning';
    case 'İşleniyor': return 'info';
    default: return 'default';
  }
};

const DashboardPlaceholder = () => {
  const { t } = useTranslation();

  const formatCurrency = (amount) => {
    return t('dashboard.stats.currency', { amount: amount.toLocaleString() });
  };

  const formatPercentage = (value) => {
    return value >= 0 
      ? t('dashboard.stats.increase', { amount: Math.abs(value) })
      : t('dashboard.stats.decrease', { amount: Math.abs(value) });
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" color="black">{t('dashboard.systemDashboard')}</Typography>
        <Chip label={t('dashboard.today', { date: '16 Haziran 2025' })} size="small" color="primary" />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'primary.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="primary" variant="subtitle2">{t('dashboard.stats.sales')}</Typography>
                  <Typography variant="h6" fontWeight="bold">{formatCurrency(12850)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">{formatPercentage(12.5)}</Typography>
                  </Box>
                </Box>
                <AttachMoney sx={{ color: 'primary.main', opacity: 0.8, fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'success.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="success.dark" variant="subtitle2">{t('dashboard.stats.orders')}</Typography>
                  <Typography variant="h6" fontWeight="bold">584</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">{formatPercentage(8.2)}</Typography>
                  </Box>
                </Box>
                <ShoppingCart sx={{ color: 'success.main', opacity: 0.8, fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="secondary.dark" variant="subtitle2">{t('dashboard.stats.customers')}</Typography>
                  <Typography variant="h6" fontWeight="bold">1,253</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" color="success.main">{formatPercentage(3.1)}</Typography>
                  </Box>
                </Box>
                <Person sx={{ color: 'secondary.main', opacity: 0.8, fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'error.lighter', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="error.dark" variant="subtitle2">{t('dashboard.stats.refunds')}</Typography>
                  <Typography variant="h6" fontWeight="bold">{formatCurrency(950)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="caption" color="error.main">{formatPercentage(-2.4)}</Typography>
                  </Box>
                </Box>
                <Assessment sx={{ color: 'error.main', opacity: 0.8, fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Progress */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom color="black">{t('dashboard.monthlyGoal')}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress variant="determinate" value={68} sx={{ height: 8, borderRadius: 5 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">68%</Typography>
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }} fontWeight="medium">{t('dashboard.recentOrders')}</Typography>
        <TableContainer sx={{ maxHeight: 240 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>{t('customer')}</TableCell>
                <TableCell>{t('product')}</TableCell>
                <TableCell align="right">{t('total')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell>{t('date')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.product}</TableCell>
                  <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      color={getStatusColor(row.status)} 
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DashboardPlaceholder; 