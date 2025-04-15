import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Chip,
  InputAdornment,
  TextField,
  Grid,
  MenuItem,
  Divider
} from '@mui/material';
import { fetchTrades, fetchChartData, deleteTrade, updateTrade } from '../services/api';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import { Line } from 'react-chartjs-2';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('entry_date');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    ticker: '',
    direction: 'Buy',
    volume: '',
    entry_price: '',
    stop_loss: '',
    target_price: '',
    entry_date: new Date(),
    exit_date: new Date(),
    exit_price: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState(null);
  const [closeFormData, setCloseFormData] = useState({
    exit_date: new Date(),
    exit_price: ''
  });
  const [closeLoading, setCloseLoading] = useState(false);
  
  // Fetch trades data
  useEffect(() => {
    const loadTrades = async () => {
      try {
        setLoading(true);
        const data = await fetchTrades();
        setTrades(data);
      } catch (err) {
        setError('Failed to load trades: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrades();
  }, []);
  
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };
  
  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };
  
  const handleTradeDetails = async (trade) => {
    setSelectedTrade(trade);
    setModalOpen(true);
    
    try {
      setChartLoading(true);
      setChartError(null);
      
      // Calculate date range (10 days before entry to 10 days after exit)
      const entryDate = new Date(trade.entry_date);
      const exitDate = new Date(trade.exit_date);
      
      const startDate = new Date(entryDate);
      startDate.setDate(startDate.getDate() - 10);
      
      const endDate = new Date(exitDate);
      endDate.setDate(endDate.getDate() + 10);
      
      // Fetch chart data
      const data = await fetchChartData(
        trade.ticker,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Process chart data
      const chartLabels = data.map(item => format(new Date(item.Date), 'MMM dd'));
      const chartPrices = data.map(item => item.Close);
      
      // Find indices for entry and exit points
      const entryIndex = data.findIndex(item => 
        new Date(item.Date).toDateString() === entryDate.toDateString()
      );
      
      const exitIndex = data.findIndex(item => 
        new Date(item.Date).toDateString() === exitDate.toDateString()
      );
      
      // Create chart data structure
      const chartDataObj = {
        labels: chartLabels,
        datasets: [
          {
            label: `${trade.ticker} Price`,
            data: chartPrices,
            borderColor: 'rgba(144, 202, 249, 1)',
            backgroundColor: 'rgba(144, 202, 249, 0.5)',
            tension: 0.2,
            pointRadius: 0,
            pointHitRadius: 10,
          },
          {
            label: 'Entry',
            data: chartLabels.map((_, i) => (i === entryIndex ? chartPrices[i] : null)),
            pointBackgroundColor: 'rgba(76, 175, 80, 1)',
            pointBorderColor: '#fff',
            pointRadius: 8,
            pointHoverRadius: 10,
            borderWidth: 0,
            showLine: false,
          },
          {
            label: 'Exit',
            data: chartLabels.map((_, i) => (i === exitIndex ? chartPrices[i] : null)),
            pointBackgroundColor: 'rgba(244, 67, 54, 1)',
            pointBorderColor: '#fff',
            pointRadius: 8,
            pointHoverRadius: 10,
            borderWidth: 0,
            showLine: false,
          },
        ],
      };
      
      setChartData(chartDataObj);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setChartError('Failed to load chart data. Please try again later.');
    } finally {
      setChartLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTrade(null);
    setChartData(null);
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDeleteConfirm = (trade) => {
    setTradeToDelete(trade);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTradeToDelete(null);
  };
  
  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    try {
      await deleteTrade(tradeToDelete.id);
      
      // Update the trades list
      setTrades(trades.filter(trade => trade.id !== tradeToDelete.id));
      
      setDeleteConfirmOpen(false);
      setTradeToDelete(null);
    } catch (err) {
      console.error('Error deleting trade:', err);
      // You could show an error notification here
    }
  };
  
  const handleEditTrade = (trade) => {
    setTradeToEdit(trade);
    setEditFormData({
      ticker: trade.ticker,
      direction: trade.direction,
      volume: trade.volume != null ? trade.volume.toString() : '',
      entry_price: trade.entry_price != null ? trade.entry_price.toString() : '',
      stop_loss: trade.stop_loss != null ? trade.stop_loss.toString() : '',
      target_price: trade.target_price != null ? trade.target_price.toString() : '',
      entry_date: trade.entry_date ? new Date(trade.entry_date) : new Date(),
      exit_date: trade.exit_date ? new Date(trade.exit_date) : null,
      exit_price: trade.exit_price != null ? trade.exit_price.toString() : ''
    });
    setEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setTradeToEdit(null);
  };
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  
  const handleEditDateChange = (field, date) => {
    setEditFormData({ ...editFormData, [field]: date });
  };
  
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!tradeToEdit) return;
    
    try {
      setEditLoading(true);
      
      // Convert data types
      const tradeData = {
        ...editFormData,
        volume: parseInt(editFormData.volume),
        entry_price: parseFloat(editFormData.entry_price),
        stop_loss: parseFloat(editFormData.stop_loss),
        target_price: parseFloat(editFormData.target_price),
        exit_price: parseFloat(editFormData.exit_price),
        // Convert dates to ISO string format
        entry_date: editFormData.entry_date.toISOString(),
        exit_date: editFormData.exit_date ? editFormData.exit_date.toISOString() : null
      };
      
      const updatedTrade = await updateTrade(tradeToEdit.id, tradeData);
      
      // Update the trades list
      setTrades(trades.map(trade => 
        trade.id === tradeToEdit.id ? updatedTrade : trade
      ));
      
      // Close the modal
      setEditModalOpen(false);
      setTradeToEdit(null);
    } catch (err) {
      console.error('Error updating trade:', err);
      // You could show an error notification here
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleOpenCloseModal = (trade) => {
    setTradeToClose(trade);
    setCloseFormData({
      exit_date: new Date(),
      exit_price: ''
    });
    setCloseModalOpen(true);
  };
  
  const handleCloseCloseModal = () => {
    setCloseModalOpen(false);
    setTradeToClose(null);
  };
  
  const handleCloseFormChange = (e) => {
    const { name, value } = e.target;
    setCloseFormData({ ...closeFormData, [name]: value });
  };
  
  const handleCloseDateChange = (date) => {
    setCloseFormData({ ...closeFormData, exit_date: date });
  };
  
  const handleSubmitCloseTrade = async (e) => {
    e.preventDefault();
    if (!tradeToClose) return;
    try {
      setCloseLoading(true);
      const tradeData = {
        ...tradeToClose,
        exit_date: closeFormData.exit_date.toISOString(),
        exit_price: parseFloat(closeFormData.exit_price)
      };
      const updatedTrade = await updateTrade(tradeToClose.id, tradeData);
      setTrades(trades.map(trade => trade.id === tradeToClose.id ? updatedTrade : trade));
      setCloseModalOpen(false);
      setTradeToClose(null);
    } catch (err) {
      console.error('Error closing trade:', err);
    } finally {
      setCloseLoading(false);
    }
  };
  
  // Filter and sort trades
  const filteredTrades = trades.filter(trade => 
    trade.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort(getComparator(order, orderBy));
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
  };
  
  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Trade History
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by ticker..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'ticker'}
                      direction={orderBy === 'ticker' ? order : 'asc'}
                      onClick={() => handleRequestSort('ticker')}
                    >
                      Ticker
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'direction'}
                      direction={orderBy === 'direction' ? order : 'asc'}
                      onClick={() => handleRequestSort('direction')}
                    >
                      Direction
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'entry_date'}
                      direction={orderBy === 'entry_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('entry_date')}
                    >
                      Entry Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'exit_date'}
                      direction={orderBy === 'exit_date' ? order : 'asc'}
                      onClick={() => handleRequestSort('exit_date')}
                    >
                      Exit Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'profit_factor'}
                      direction={orderBy === 'profit_factor' ? order : 'asc'}
                      onClick={() => handleRequestSort('profit_factor')}
                    >
                      Profit Factor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'risk_dollars'}
                      direction={orderBy === 'risk_dollars' ? order : 'asc'}
                      onClick={() => handleRequestSort('risk_dollars')}
                    >
                      Risk ($)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'profit_dollars'}
                      direction={orderBy === 'profit_dollars' ? order : 'asc'}
                      onClick={() => handleRequestSort('profit_dollars')}
                    >
                      Target P/L ($)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'profit_loss'}
                      direction={orderBy === 'profit_loss' ? order : 'asc'}
                      onClick={() => handleRequestSort('profit_loss')}
                    >
                      P/L ($)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'days_held'}
                      direction={orderBy === 'days_held' ? order : 'asc'}
                      onClick={() => handleRequestSort('days_held')}
                    >
                      Days Held
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id} hover>
                      <TableCell>
                        <Chip
                          label={trade.ticker}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.direction}
                          color={trade.direction === 'Buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(trade.entry_date), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {trade.exit_date ? format(new Date(trade.exit_date), 'MMM dd, yyyy HH:mm') : <Chip label="Open" color="warning" size="small" />}
                      </TableCell>
                      <TableCell>
                        {trade.profit_factor !== null ? (
                          <Typography>
                            {trade.profit_factor.toFixed(2)}
                          </Typography>
                        ) : (
                          <Chip label="-" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.risk_dollars !== null ? (
                          <Typography>
                            ${trade.risk_dollars.toFixed(2)}
                          </Typography>
                        ) : (
                          <Chip label="-" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.target_price !== null && trade.entry_price !== null && trade.volume !== null ? (
                          <Typography>
                            ${(Math.abs(trade.target_price - trade.entry_price) * trade.volume).toFixed(2)}
                          </Typography>
                        ) : (
                          <Chip label="-" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.profit_loss !== null && trade.profit_loss !== undefined ? (
                          <Typography
                            color={trade.profit_loss > 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            ${trade.profit_loss.toFixed(2)}
                          </Typography>
                        ) : (
                          <Chip label="Open" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.days_held !== null && trade.days_held !== undefined ? trade.days_held.toFixed(1) : <Chip label="-" size="small" />}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={() => handleTradeDetails(trade)}
                            startIcon={<InfoIcon />}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => handleEditTrade(trade)}
                            startIcon={<EditIcon />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleDeleteConfirm(trade)}
                            startIcon={<DeleteIcon />}
                          >
                            Delete
                          </Button>
                          {(!trade.exit_date || trade.exit_price === null || trade.exit_price === undefined) && (
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleOpenCloseModal(trade)}
                              sx={{ fontWeight: 600 }}
                            >
                              Close
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Trade Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedTrade && (
          <>
            <DialogTitle>
              <Typography variant="h5" component="div">
                {selectedTrade.ticker} - {selectedTrade.direction} Trade Details
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Trade Information</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">Direction:</Typography>
                    <Typography variant="body1">{selectedTrade.direction}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Volume:</Typography>
                    <Typography variant="body1">{selectedTrade.volume} shares</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Entry Price:</Typography>
                    <Typography variant="body1">${selectedTrade.entry_price.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                    <Typography variant="body1">${selectedTrade.exit_price.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Stop Loss:</Typography>
                    <Typography variant="body1">${selectedTrade.stop_loss.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Target Price:</Typography>
                    <Typography variant="body1">${selectedTrade.target_price.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Entry Date:</Typography>
                    <Typography variant="body1">{format(new Date(selectedTrade.entry_date), 'MMM dd, yyyy HH:mm')}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Exit Date:</Typography>
                    <Typography variant="body1">{format(new Date(selectedTrade.exit_date), 'MMM dd, yyyy HH:mm')}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Days Held:</Typography>
                    <Typography variant="body1">{selectedTrade.days_held.toFixed(1)} days</Typography>
                    
                    <Typography variant="body2" color="text.secondary">R:R Ratio:</Typography>
                    <Typography variant="body1">{selectedTrade.risk_reward.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Profit Factor:</Typography>
                    <Typography variant="body1">{selectedTrade.profit_factor.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Risk ($):</Typography>
                    <Typography variant="body1">${selectedTrade.risk_dollars.toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Target P/L ($):</Typography>
                    <Typography variant="body1">${(Math.abs(selectedTrade.target_price - selectedTrade.entry_price) * selectedTrade.volume).toFixed(2)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">P/L:</Typography>
                    <Typography 
                      variant="body1" 
                      color={selectedTrade.profit_loss > 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      ${selectedTrade.profit_loss.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Price Chart</Typography>
                  {chartLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, height: '300px', alignItems: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : chartError ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, height: '300px', alignItems: 'center' }}>
                      <Typography color="error">{chartError}</Typography>
                    </Box>
                  ) : chartData ? (
                    <Box sx={{ height: '300px' }}>
                      <Line data={chartData} options={chartOptions} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4, height: '300px', alignItems: 'center' }}>
                      <Typography>No chart data available</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trade for {tradeToDelete?.ticker}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteTrade} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Trade Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Edit Trade
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSaveEdit} noValidate>
            <Grid container spacing={3}>
              {/* Basic Trade Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Ticker Symbol"
                  name="ticker"
                  value={editFormData.ticker}
                  onChange={handleEditFormChange}
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
                  value={editFormData.direction}
                  onChange={handleEditFormChange}
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
                  value={editFormData.volume}
                  onChange={handleEditFormChange}
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
                  value={editFormData.entry_price}
                  onChange={handleEditFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Stop Loss Price"
                  name="stop_loss"
                  type="number"
                  value={editFormData.stop_loss}
                  onChange={handleEditFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Target Price"
                  name="target_price"
                  type="number"
                  value={editFormData.target_price}
                  onChange={handleEditFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
              
              {/* Date Information */}
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Entry Date & Time (EST)"
                  value={editFormData.entry_date}
                  onChange={(date) => handleEditDateChange('entry_date', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Exit Date & Time (EST)"
                  value={editFormData.exit_date}
                  onChange={(date) => handleEditDateChange('exit_date', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Exit Price"
                  name="exit_price"
                  type="number"
                  value={editFormData.exit_price}
                  onChange={handleEditFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            color="primary" 
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Close Trade Modal */}
      <Dialog
        open={closeModalOpen}
        onClose={handleCloseCloseModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Close Trade</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmitCloseTrade} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Exit Date & Time (EST)"
                  value={closeFormData.exit_date}
                  onChange={handleCloseDateChange}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Exit Price"
                  name="exit_price"
                  type="number"
                  value={closeFormData.exit_price}
                  onChange={handleCloseFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCloseModal} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmitCloseTrade}
            color="primary"
            variant="contained"
            disabled={closeLoading}
          >
            {closeLoading ? 'Saving...' : 'Close Trade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TradeHistory; 