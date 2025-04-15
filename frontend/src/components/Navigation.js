import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <AppBar position="fixed" elevation={0} sx={{
      background: 'rgba(24,28,36,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1.5px solid rgba(255,255,255,0.06)',
      boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
    }}>
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, md: 4 } }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 72 }, px: 0 }}>
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
            <Box component="span" sx={{ mr: 2, display: 'flex', alignItems: 'center', fontSize: 32 }}>
              <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            </Box>
            Trading Journal
          </Typography>

          <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 } }}>
            <Button
              component={RouterLink}
              to="/"
              color={location.pathname === '/' ? 'secondary' : 'inherit'}
              startIcon={<DashboardIcon />}
              sx={{
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                borderRadius: '10px',
                boxShadow: location.pathname === '/' ? '0 0 8px 2px #ffd60055' : 'none',
                background: location.pathname === '/' ? 'rgba(255,214,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Dashboard
            </Button>

            <Button
              component={RouterLink}
              to="/trade-entry"
              color={location.pathname === '/trade-entry' ? 'secondary' : 'inherit'}
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                borderRadius: '10px',
                boxShadow: location.pathname === '/trade-entry' ? '0 0 8px 2px #ffd60055' : 'none',
                background: location.pathname === '/trade-entry' ? 'rgba(255,214,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Add Trade
            </Button>

            <Button
              component={RouterLink}
              to="/trade-history"
              color={location.pathname === '/trade-history' ? 'secondary' : 'inherit'}
              startIcon={<HistoryIcon />}
              sx={{
                fontWeight: 600,
                fontSize: '1.05rem',
                px: 2.5,
                borderRadius: '10px',
                boxShadow: location.pathname === '/trade-history' ? '0 0 8px 2px #ffd60055' : 'none',
                background: location.pathname === '/trade-history' ? 'rgba(255,214,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              History
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 