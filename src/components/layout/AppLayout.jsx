import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
  ListItemButton,
  Select,
  FormControl,
  InputAdornment,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingBasket as OrdersIcon,
  Receipt as InvoicesIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Security as SecurityIcon,
  Business as BusinessIcon,
  ExpandLess,
  ExpandMore,
  ChevronRight,
  Category as CategoryIcon,
  Email as EmailIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { authService } from '../../services/api';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';

const drawerWidth = 240;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  useEffect(() => {
    // Use a flag to prevent state updates after component unmounts
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated && isMounted) {
          navigate('/login');
          return;
        }
        
        const token = localStorage.getItem('token');
        if (token && isMounted) {
          try {
            // Parse the JWT token
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const { role, sub, name, email } = JSON.parse(jsonPayload);
            
            // Only update state if component is still mounted
            if (isMounted) {
              setUserProfile({
                username: sub,
                name: name || sub || 'User',
                role: role,
                email: email
              });
            }
          } catch (error) {
            console.error('Error parsing JWT token:', error);
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (isMounted) {
          navigate('/login');
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  
  // Close mobile drawer when route changes
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    authService.logout();
    navigate('/');
  };

  const handleAdminMenuToggle = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Define menu items - all users including developers see all menu items
  const getMenuItems = () => {
    // All users see the same menu items
    return [
      { text: t('menuItems.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
      { text: t('menuItems.products'), icon: <InventoryIcon />, path: '/products' },
      { text: t('menuItems.categories'), icon: <CategoryIcon />, path: '/categories' },
      { text: t('menuItems.customers'), icon: <PeopleIcon />, path: '/customers' },
      { text: t('menuItems.orders'), icon: <OrdersIcon />, path: '/orders' },
      { text: t('menuItems.invoices'), icon: <InvoicesIcon />, path: '/invoices' },
    ];
  };
  
  const menuItems = getMenuItems();
  
  const adminMenuItems = [
    { text: t('menuItems.userManagement'), icon: <PeopleIcon />, path: '/user-management' },
    { text: t('menuItems.companies'), icon: <BusinessIcon />, path: '/companies' },
    { text: t('menuItems.activityLogs'), icon: <ReceiptIcon />, path: '/activity-logs' },
  ];
  
  // Dev-only menu items
  const devMenuItems = [
    { text: t('menuItems.developerPanel'), icon: <DashboardIcon />, path: '/dev-panel' },
    { text: t('menuItems.roleManager'), icon: <SecurityIcon />, path: '/role-manager' },
  ];
  
  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    localStorage.setItem('i18nextLng', newLang);
    i18n.changeLanguage(newLang);
  };
  
  // Add useEffect to initialize language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);
  
  const drawer = (
    <div>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 1
      }}>
        <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
          TrackMate
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav">
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              borderLeft: isActive(item.path) ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              pl: isActive(item.path) ? 1.5 : 2,
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: isActive(item.path) ? 'medium' : 'normal',
                color: isActive(item.path) ? theme.palette.primary.main : 'inherit'
              }}
            />
          </ListItem>
        ))}
        
        {/* Developer Tools section - only visible to users with Dev role */}
        {userProfile?.role === 'Dev' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ pl: 2, py: 0.5 }}>
              <ListItemText 
                primary={t('developerTools', 'DEVELOPER TOOLS')}
                primaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary',
                  fontWeight: 'medium'
                }}
              />
            </ListItem>
            {devMenuItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  borderLeft: isActive(item.path) ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                  pl: isActive(item.path) ? 1.5 : 2,
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 'medium' : 'normal',
                    color: isActive(item.path) ? theme.palette.primary.main : 'inherit'
                  }}
                />
              </ListItem>
            ))}
          </>
        )}
      </List>
      
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />

          <FormControl size="small" sx={{ minWidth: 100, mr: 2 }}>
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              variant="outlined"
              sx={{ height: 32 }}
              startAdornment={
                <InputAdornment position="start">
                  <TranslateIcon sx={{ fontSize: 20 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="tr">Türkçe</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Typography variant="subtitle1" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              {userProfile?.name || 'User'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <PageTransition
          variant={isActive('/dashboard') ? 'fade' : 
                  location.pathname.includes('/products') ? 'slideRight' :
                  location.pathname.includes('/categories') ? 'fade' :
                  location.pathname.includes('/customers') ? 'scale' : 
                  location.pathname.includes('/orders') ? 'slideDown' :
                  location.pathname.includes('/invoices') ? 'rotate' :
                  'slideUp'}
          transition={isActive('/dashboard') ? 'default' : 'smooth'}
          delay={0.1}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Outlet />
        </PageTransition>
      </Box>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" noWrap>
            {userProfile?.name || t('menuItems.user')}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {userProfile?.email || ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          {t('menuItems.profile')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t('menuItems.logout')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AppLayout;
