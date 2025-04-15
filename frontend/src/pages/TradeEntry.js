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
                  disabled={loading}
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