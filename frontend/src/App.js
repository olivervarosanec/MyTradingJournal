import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Box from '@mui/material/Box';

// Pages
import Dashboard from './pages/Dashboard';
import TradeEntry from './pages/TradeEntry';
import TradeHistory from './pages/TradeHistory';
import Import from './pages/Import';

// Components
import Navigation from './components/Navigation';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4', // Teal accent
      contrastText: '#e3f2fd',
    },
    secondary: {
      main: '#ffd600', // Gold accent
      contrastText: '#212121',
    },
    background: {
      default: 'linear-gradient(135deg, #181c24 0%, #232a34 100%)',
      paper: 'rgba(30,34,44,0.85)', // Glassy effect
    },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#e3e6eb',
      secondary: '#b0b8c1',
      disabled: '#6c757d',
    },
    success: {
      main: '#26d782',
    },
    error: {
      main: '#ff5370',
    },
    warning: {
      main: '#ffb300',
    },
    info: {
      main: '#29b6f6',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.8rem',
      letterSpacing: '-1px',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.7rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.3rem',
    },
    body1: {
      fontSize: '1.05rem',
    },
    body2: {
      fontSize: '0.97rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          background: 'rgba(24,28,36,0.85)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.25)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(30,34,44,0.85)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
          borderRadius: '16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(36,40,50,0.92)',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
          borderRadius: '18px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
          backgroundColor: '#232a34',
        },
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.5px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#232a34',
          color: '#e3e6eb',
          fontSize: '1rem',
        },
      },
    },
  },
});

function App() {
  const isMobile = useMediaQuery(darkTheme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // No automatic toggle based on screen size - sidebar always starts closed
  // We're removing the useEffect hook that was changing state based on screen size

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <Box sx={{ display: 'flex' }}>
            <Navigation isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: { xs: 2, md: 3 },
                ml: sidebarOpen ? { xs: '60px', sm: '240px' } : '60px',
                mt: '64px',
                minHeight: '100vh',
                transition: (theme) => theme.transitions.create(['margin', 'padding'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trade-entry" element={<TradeEntry />} />
                <Route path="/trade-history" element={<TradeHistory />} />
                <Route path="/import" element={<Import />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 