import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper,
  Snackbar,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { createTrade } from '../services/api';

// Currency formatting function for $1,127,500.00 style
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Import = () => {
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    setImportData(e.target.value);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Helper function to parse currency string to number
  const parseCurrency = (currencyStr) => {
    if (!currencyStr) return null;
    return parseFloat(currencyStr.replace(/[^0-9.-]+/g, ''));
  };

  // Helper function to parse date string to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Handle date strings like "11/18/2024 as of 11/15/2024" by taking the first date
    const cleanDateStr = dateStr.split(' as of ')[0];
    
    const [month, day, year] = cleanDateStr.split('/');
    return new Date(year, month - 1, day);
  };

  // Transform brokerage transaction to trade format
  const transformTransaction = (transaction) => {
    // Default values for required fields
    const defaultStopLoss = 0;
    const defaultTargetPrice = 0;
    
    // Basic mapping
    const tradeData = {
      ticker: transaction.Symbol,
      volume: parseInt(transaction.Quantity.replace(/[^0-9.-]+/g, '')),
      entry_date: parseDate(transaction.Date).toISOString(),
    };
    
    // Handle different transaction types
    if (transaction.Action === 'Buy' || transaction.Action === 'Buy to Open') {
      tradeData.direction = 'Buy';
      tradeData.entry_price = parseCurrency(transaction.Price);
      tradeData.stop_loss = tradeData.entry_price * 0.95; // Default 5% stop loss
      tradeData.target_price = tradeData.entry_price * 1.1; // Default 10% target
    } else if (transaction.Action === 'Sell' || transaction.Action === 'Sell to Close') {
      tradeData.direction = 'Short';
      tradeData.entry_price = parseCurrency(transaction.Price);
      tradeData.stop_loss = tradeData.entry_price * 1.05; // Default 5% stop loss for short
      tradeData.target_price = tradeData.entry_price * 0.9; // Default 10% target for short
    }
    
    return tradeData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setProgress(0);
      
      // Parse the JSON data
      let jsonData;
      try {
        jsonData = JSON.parse(importData);
      } catch (error) {
        throw new Error('Invalid JSON format. Please check your data.');
      }
      
      // Extract transactions
      const transactions = jsonData.BrokerageTransactions || [];
      
      if (transactions.length === 0) {
        throw new Error('No transactions found in the provided data.');
      }
      
      // Filter out non-trade transactions (like 'Expired')
      const validActions = ['Buy', 'Sell', 'Buy to Open', 'Sell to Close'];
      const tradeTransactions = transactions.filter(
        trans => validActions.includes(trans.Action)
      );
      
      // Process each transaction
      const totalTransactions = tradeTransactions.length;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < tradeTransactions.length; i++) {
        try {
          const transaction = tradeTransactions[i];
          const tradeData = transformTransaction(transaction);
          
          await createTrade(tradeData);
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          errorCount++;
        }
        
        // Update progress
        setProgress(Math.round(((i + 1) / totalTransactions) * 100));
      }
      
      // Show success notification
      setNotification({
        open: true,
        message: `Import completed: ${successCount} trades imported successfully, ${errorCount} failed.`,
        severity: errorCount === 0 ? 'success' : 'warning'
      });
      
      // Reset form if completely successful
      if (errorCount === 0) {
        setImportData('');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setNotification({
        open: true,
        message: 'Error importing data: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
          Import Trades
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Paste your trade data in JSON format below:
          </Typography>
          
          <TextField
            required
            fullWidth
            multiline
            rows={12}
            label="Trade Data"
            value={importData}
            onChange={handleChange}
            placeholder='{"FromDate": "10/14/2024", "ToDate": "04/14/2025", "BrokerageTransactions": [...] }'
            sx={{ mb: 3 }}
            disabled={loading}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {loading && (
              <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center' }}>
                <CircularProgress variant="determinate" value={progress} size={24} sx={{ mr: 1 }} />
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(progress)}%`}
                </Typography>
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<UploadIcon />}
              disabled={loading || !importData.trim()}
              sx={{ px: 4, py: 1.5 }}
            >
              Import
            </Button>
          </Box>
        </Box>
        
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Import; 