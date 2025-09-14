import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  People,
  VerifiedUser,
  SupportAgent,
  Analytics,
  Settings,
  Logout,
  AccountCircle,
  DarkMode,
  LightMode,
  LocalOffer,
  BugReport
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import GlobalSearch from '../Search/GlobalSearch';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Salons', icon: <Business />, path: '/salons' },
  { text: 'Vérification KYC', icon: <VerifiedUser />, path: '/kyc' },
  { text: 'Utilisateurs', icon: <People />, path: '/users' },
  { text: 'Promos', icon: <LocalOffer />, path: '/promos' },
  { text: 'Support', icon: <SupportAgent />, path: '/support' },
  { text: 'Crashes', icon: <BugReport />, path: '/crashes' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { text: 'Paramètres', icon: <Settings />, path: '/settings' }
];

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [badges, setBadges] = useState({ kyc: 0, support: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      // Compter les KYC en attente
      const salonsRef = collection(db, 'salons');
      const salonsSnapshot = await getDocs(salonsRef);
      
      let kycPending = 0;
      salonsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.kyc_status === 'under_review' || data.kyc_status === 'pending') {
          kycPending++;
        }
      });

      // Compter les tickets support
      const supportRef = collection(db, 'support_tickets');
      const supportSnapshot = await getDocs(supportRef);
      
      setBadges({
        kyc: kycPending,
        support: supportSnapshot.size
      });
    } catch (error) {
      console.error('Erreur badges:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            B
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Balaan Admin
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  backgroundColor: location.pathname === item.path ? 'primary.main' : 'action.hover',
                }
              }}
            >
              <ListItemIcon>
                {item.path === '/kyc' && badges.kyc > 0 ? (
                  <Badge badgeContent={badges.kyc} color="warning">
                    {item.icon}
                  </Badge>
                ) : item.path === '/support' && badges.support > 0 ? (
                  <Badge badgeContent={badges.support} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Recherche globale */}
            <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
              <GlobalSearch onClose={() => setSearchOpen(false)} />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            
            {/* Toggle thème */}
            <IconButton
              onClick={toggleTheme}
              size="small"
              title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
              sx={{ 
                background: 'rgba(212, 175, 55, 0.1)',
                '&:hover': { 
                  background: 'rgba(212, 175, 55, 0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {isDarkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
            
            <IconButton onClick={handleProfileMenuOpen} size="small">
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Déconnexion
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'grey.50',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
