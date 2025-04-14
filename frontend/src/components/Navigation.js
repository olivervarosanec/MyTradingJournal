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
    <AppBar position="fixed">
      <Container>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              color: 'primary.main', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              <DashboardIcon />
            </Box>
            Trading Journal
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/"
              color={location.pathname === '/' ? 'secondary' : 'inherit'}
              startIcon={<DashboardIcon />}
            >
              Dashboard
            </Button>
            
            <Button
              component={RouterLink}
              to="/trade-entry"
              color={location.pathname === '/trade-entry' ? 'secondary' : 'inherit'}
              startIcon={<AddCircleOutlineIcon />}
            >
              Add Trade
            </Button>
            
            <Button
              component={RouterLink}
              to="/trade-history"
              color={location.pathname === '/trade-history' ? 'secondary' : 'inherit'}
              startIcon={<HistoryIcon />}
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