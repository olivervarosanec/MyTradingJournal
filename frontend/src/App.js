import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Pages
import Dashboard from './pages/Dashboard';
import TradeEntry from './pages/TradeEntry';
import TradeHistory from './pages/TradeHistory';

// Components
import Navigation from './components/Navigation';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
          backgroundColor: '#2e2e2e',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Navigation />
            <main style={{ padding: '20px', marginTop: '64px' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trade-entry" element={<TradeEntry />} />
                <Route path="/trade-history" element={<TradeHistory />} />
              </Routes>
            </main>
          </div>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 