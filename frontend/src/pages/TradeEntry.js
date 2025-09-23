import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  MenuItem, 
  Snackbar, 
  Alert,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { createTrade } from '../services/api';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Currency formatting function for $1,127,500.00 style
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TradeEntry = () => {
  const [formData, setFormData] = useState({
    ticker: '',
    direction: 'Buy',
    volume: '',
    entry_price: '',
    stop_loss: '',
    target_price: '',
    entry_date: new Date(),
    exit_date: null,
    exit_price: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleDateChange = (field, date) => {
    setFormData({ ...formData, [field]: date });
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  const resetForm = () => {
    setFormData({
      ticker: '',
      direction: 'Buy',
      volume: '',
      entry_price: '',
      stop_loss: '',
      target_price: '',
      entry_date: new Date(),
      exit_date: null,
      exit_price: ''
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Convert data types
      const tradeData = {
        ticker: formData.ticker,
        direction: formData.direction,
        volume: parseInt(formData.volume),
        entry_price: parseFloat(formData.entry_price),
        entry_date: formData.entry_date.toISOString(),
      };
      
      // Only add stop_loss if it has a value
      if (formData.stop_loss !== '' && formData.stop_loss !== null && formData.stop_loss !== undefined) {
        tradeData.stop_loss = parseFloat(formData.stop_loss);
      }
      
      // Only add target_price if it has a value
      if (formData.target_price !== '' && formData.target_price !== null && formData.target_price !== undefined) {
        tradeData.target_price = parseFloat(formData.target_price);
      }
      
      if (formData.exit_date) {
        tradeData.exit_date = formData.exit_date.toISOString();
      }
      if (formData.exit_price !== '' && formData.exit_price !== null && formData.exit_price !== undefined) {
        tradeData.exit_price = parseFloat(formData.exit_price);
      }
      
      await createTrade(tradeData);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Trade successfully added!',
        severity: 'success'
      });
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving trade:', error);
      setNotification({
        open: true,
        message: 'Error saving trade: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // --- Calculation logic for dashboard display ---
  const isFilled = [formData.volume, formData.entry_price, formData.stop_loss, formData.target_price].every(v => v !== '' && !isNaN(Number(v)));
  let risk = null, targetPL = null, profitFactor = null;
  if (isFilled) {
    const volume = parseFloat(formData.volume);
    const entry = parseFloat(formData.entry_price);
    const stop = parseFloat(formData.stop_loss);
    const target = parseFloat(formData.target_price);
    if (formData.direction === 'Buy') {
      risk = (entry - stop) * volume;
      targetPL = (target - entry) * volume;
    } else {
      risk = (stop - entry) * volume;
      targetPL = (entry - target) * volume;
    }
    profitFactor = risk !== 0 ? targetPL / Math.abs(risk) : null;
  }
  
  // Enable Save button only if mandatory fields are filled
  const isSaveEnabled =
    formData.ticker.trim() !== '' &&
    formData.direction.trim() !== '' &&
    formData.volume !== '' && !isNaN(Number(formData.volume)) && Number(formData.volume) > 0 &&
    formData.entry_price !== '' && !isNaN(Number(formData.entry_price)) && Number(formData.entry_price) > 0;
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
          Add New Trade
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Basic Trade Information */}
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Ticker Symbol"
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                placeholder="AAPL"
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Direction"
                name="direction"
                value={formData.direction}
                onChange={handleChange}
              >
                <MenuItem value="Buy">Buy (Long)</MenuItem>
                <MenuItem value="Short">Short (Sell)</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Volume (Shares)"
                name="volume"
                type="number"
                value={formData.volume}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            {/* Price Information */}
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Entry Price"
                name="entry_price"
                type="number"
                value={formData.entry_price}
                onChange={handleChange}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stop Loss Price (optional)"
                name="stop_loss"
                type="number"
                value={formData.stop_loss}
                onChange={handleChange}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Price (optional)"
                name="target_price"
                type="number"
                value={formData.target_price}
                onChange={handleChange}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            
            {/* Modern Dashboard Display for Trade Metrics */}
            {isFilled && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', my: 3 }}>
                  <Card elevation={8} sx={{ minWidth: 220, background: 'linear-gradient(135deg, #232a34 60%, #26d782 100%)', color: '#fff', borderRadius: 4, boxShadow: '0 8px 32px 0 #26d78255' }}>
                    <CardHeader
                      avatar={<TrendingUpIcon sx={{ color: '#26d782', fontSize: 36 }} />}
                      title={<Typography variant="h6" sx={{ color: '#26d782', fontWeight: 700 }}>Risk ($)</Typography>}
                      sx={{ pb: 0 }}
                    />
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: risk > 0 ? '#26d782' : '#ff5370', textShadow: '0 2px 12px #0008' }}>
                        {formatCurrency(risk)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={8} sx={{ minWidth: 220, background: 'linear-gradient(135deg, #232a34 60%, #ffd600 100%)', color: '#232a34', borderRadius: 4, boxShadow: '0 8px 32px 0 #ffd60055' }}>
                    <CardHeader
                      title={<Typography variant="h6" sx={{ color: '#ffd600', fontWeight: 700 }}>Target P/L ($)</Typography>}
                      sx={{ pb: 0 }}
                    />
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: targetPL > 0 ? '#26d782' : '#ff5370', textShadow: '0 2px 12px #0008' }}>
                        {formatCurrency(targetPL)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={8} sx={{ minWidth: 220, background: 'linear-gradient(135deg, #232a34 60%, #ffd600 100%)', color: '#232a34', borderRadius: 4, boxShadow: '0 8px 32px 0 #ffd60055' }}>
                    <CardHeader
                      title={<Typography variant="h6" sx={{ color: '#ffd600', fontWeight: 700 }}>Profit Factor</Typography>}
                      sx={{ pb: 0 }}
                    />
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: profitFactor > 1 ? '#26d782' : '#ff5370', textShadow: '0 2px 12px #0008' }}>
                        {profitFactor !== null && isFinite(profitFactor) ? profitFactor.toFixed(2) : '-'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            )}
            
            {/* Date Information */}
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Entry Date & Time (EST)"
                value={formData.entry_date}
                onChange={(date) => handleDateChange('entry_date', date)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Exit Date & Time (EST) (optional)"
                value={formData.exit_date}
                onChange={(date) => handleDateChange('exit_date', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exit Price (optional)"
                name="exit_price"
                type="number"
                value={formData.exit_price}
                onChange={handleChange}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            
            {/* Form Controls */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetForm}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Reset
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading || !isSaveEnabled}
                >
                  Save Trade
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TradeEntry; 