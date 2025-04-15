import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import UploadIcon from '@mui/icons-material/Upload';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import './NavigationGlow.css';

const Navigation = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Always respect the isOpen prop from the parent component
  const open = isOpen;
  
  const handleDrawerToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  // Nav items configuration
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/trade-entry', label: 'Add Trade', icon: <AddCircleOutlineIcon /> },
    { path: '/trade-history', label: 'History', icon: <HistoryIcon /> },
    { path: '/import', label: 'Import', icon: <UploadIcon /> }
  ];

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0} 
        className="seamless-appbar"
        sx={{
          background: 'rgba(24,28,36,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1.5px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: '100%'
        }}
      >
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '-1px',
              fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 24, sm: 28 } }}>
              <DashboardIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main', mr: 1.5 }} />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Trading Journal</Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>TJ</Box>
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        className="seamless-drawer"
        sx={{
          width: open ? 240 : 60,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: open ? 240 : 60,
            boxSizing: 'border-box',
            background: 'rgba(24,28,36,0.95)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar /> {/* Spacer to push down content below AppBar */}
        
        <List sx={{ mt: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem 
                button
                component={RouterLink}
                to={item.path}
                key={item.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  px: 2,
                  py: { xs: 1.2, sm: 1.5 },
                  mb: 0.5,
                  mx: 1,
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Tooltip title={open ? '' : item.label} placement="right">
                  <ListItemIcon 
                    className="glow-icon"
                    sx={{ 
                      minWidth: 0, 
                      mr: open ? 2 : 'auto', 
                      justifyContent: 'center',
                      color: isActive ? 'secondary.main' : 'inherit' 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                
                {open && (
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{
                      color: isActive ? 'secondary.main' : 'inherit',
                      fontWeight: 600,
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </>
  );
};

export default Navigation; 