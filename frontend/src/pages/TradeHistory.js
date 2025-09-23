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
  Snackbar,
  Alert
} from '@mui/material';
import { fetchTrades, fetchChartData, deleteTrade, updateTrade } from '../services/api';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Helper to safely check dates before using them
const isValidDate = (date) => date instanceof Date && !isNaN(date);

// Currency formatting function for $1,127,500.00 style
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const extractPricePoint = (item) => {
  if (!item) return null;
  const dateValue = item.Date || item.date || item.Datetime || item.datetime || item.Timestamp || item.timestamp;
  const openValue = item.Open ?? item.open ?? item.o;
  const highValue = item.High ?? item.high ?? item.h;
  const lowValue = item.Low ?? item.low ?? item.l;
  const closeValue = item.Close ?? item.close ?? item.c;

  const time = new Date(dateValue);
  const open = Number(openValue);
  const high = Number(highValue);
  const low = Number(lowValue);
  const close = Number(closeValue);

  if (!isValidDate(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
    return null;
  }

  return {
    time,
    open,
    high,
    low,
    close
  };
};

const buildChartOptions = (trade, priceSeries = []) => {
  const entryDate = new Date(trade.entry_date);
  const exitDate = trade.exit_date ? new Date(trade.exit_date) : null;

  if (!isValidDate(entryDate) || !Array.isArray(priceSeries) || priceSeries.length === 0) {
    return null;
  }

  const processed = priceSeries
    .map(extractPricePoint)
    .filter(Boolean)
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (processed.length === 0) {
    return null;
  }

  const ohlcData = processed.map((point) => [
    point.time.getTime(),
    point.open,
    point.high,
    point.low,
    point.close,
  ]);

  const entryPrice = trade.entry_price !== null && trade.entry_price !== undefined ? Number(trade.entry_price) : null;
  const potentialExitRaw = trade.exit_price !== null && trade.exit_price !== undefined
    ? trade.exit_price
    : (trade.target_price !== null && trade.target_price !== undefined ? trade.target_price : null);
  const potentialExitPrice = potentialExitRaw !== null ? Number(potentialExitRaw) : null;

  const entryDataPoint = processed.find((point) => point.time.toDateString() === entryDate.toDateString());
  const entryTimestamp = entryDataPoint
    ? entryDataPoint.time.getTime()
    : entryDate.getTime();

  const exitDataPoint = exitDate && isValidDate(exitDate)
    ? processed.find((point) => point.time.toDateString() === exitDate.toDateString())
    : null;
  const exitTimestamp = exitDataPoint
    ? exitDataPoint.time.getTime()
    : (exitDate && isValidDate(exitDate) ? exitDate.getTime() : null);

  const plotLines = [];

  if (Number.isFinite(entryPrice)) {
    plotLines.push({
      value: entryPrice,
      color: '#4caf50',
      dashStyle: 'Dash',
      width: 2,
      zIndex: 3,
      label: {
        text: `Entry: ${formatCurrency(entryPrice)}`,
        align: 'right',
        style: { color: '#4caf50', fontWeight: '600' }
      }
    });
  }

  if (Number.isFinite(potentialExitPrice)) {
    const exitLabel = trade.exit_price !== null && trade.exit_price !== undefined ? 'Exit' : 'Target';
    plotLines.push({
      value: potentialExitPrice,
      color: '#f44336',
      dashStyle: 'Dash',
      width: 2,
      zIndex: 3,
      label: {
        text: `${exitLabel}: ${formatCurrency(potentialExitPrice)}`,
        align: 'right',
        style: { color: '#f44336', fontWeight: '600' }
      }
    });
  }

  const series = [
    {
      type: 'candlestick',
      name: `${trade.ticker} Price`,
      data: ohlcData,
      color: '#e53935',
      upColor: '#43a047',
      lineColor: '#e53935',
      upLineColor: '#43a047',
      tooltip: {
        valueDecimals: 2
      }
    }
  ];

  if (Number.isFinite(entryPrice)) {
    series.push({
      type: 'scatter',
      name: 'Entry',
      data: [{ x: entryTimestamp, y: entryPrice }],
      color: '#4caf50',
      marker: {
        symbol: 'triangle',
        radius: 6,
        fillColor: '#4caf50',
        lineColor: '#ffffff',
        lineWidth: 2
      },
      dataLabels: {
        enabled: true,
        format: 'Entry',
        align: 'left',
        y: -10,
        style: { color: '#4caf50', fontWeight: '600' }
      },
      tooltip: {
        pointFormatter: function () {
          return `<span style="color:#4caf50">●</span> Entry<br/>Price: <b>${formatCurrency(this.y)}</b><br/>Date: <b>${Highcharts.dateFormat('%b %e, %Y', this.x)}</b>`;
        }
      },
      showInLegend: false
    });
  }

  if (Number.isFinite(potentialExitPrice) && Number.isFinite(exitTimestamp)) {
    const exitLabel = trade.exit_price !== null && trade.exit_price !== undefined ? 'Exit' : 'Target';
    series.push({
      type: 'scatter',
      name: exitLabel,
      data: [{ x: exitTimestamp, y: potentialExitPrice }],
      color: '#f44336',
      marker: {
        symbol: 'triangle-down',
        radius: 6,
        fillColor: '#f44336',
        lineColor: '#ffffff',
        lineWidth: 2
      },
      dataLabels: {
        enabled: true,
        format: exitLabel,
        align: 'left',
        y: -10,
        style: { color: '#f44336', fontWeight: '600' }
      },
      tooltip: {
        pointFormatter: function () {
          return `<span style="color:#f44336">●</span> ${exitLabel}<br/>Price: <b>${formatCurrency(this.y)}</b><br/>Date: <b>${Highcharts.dateFormat('%b %e, %Y', this.x)}</b>`;
        }
      },
      showInLegend: false
    });
  }

  return {
    chart: {
      backgroundColor: 'transparent',
      height: 300,
      style: { fontFamily: 'inherit' }
    },
    credits: { enabled: false },
    rangeSelector: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    title: { text: `${trade.ticker} Price` },
    xAxis: {
      type: 'datetime',
      labels: {
        style: { color: 'rgba(0, 0, 0, 0.6)' }
      },
      crosshair: true
    },
    yAxis: {
      title: { text: 'Price' },
      labels: {
        formatter: function () {
          return formatCurrency(this.value);
        },
        style: { color: 'rgba(0, 0, 0, 0.6)' }
      },
      plotLines
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const header = `<span style="font-size:10px">${Highcharts.dateFormat('%b %e, %Y', this.x)}</span><br/>`;
        const body = (this.points || [])
          .map((point) => {
            if (point.series.type === 'candlestick') {
              const { open, high, low, close } = point.point;
              return `<span style="color:${point.color}">●</span> ${point.series.name}<br/>Open: <b>${formatCurrency(open)}</b><br/>High: <b>${formatCurrency(high)}</b><br/>Low: <b>${formatCurrency(low)}</b><br/>Close: <b>${formatCurrency(close)}</b><br/>`;
            }
            return `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${formatCurrency(point.y)}</b><br/>`;
          })
          .join('');
        return header + body;
      }
    },
    series
  };
};

const generateFallbackPriceSeries = (trade) => {
  const entryDate = new Date(trade.entry_date);
  if (!isValidDate(entryDate)) {
    return [];
  }

  const entryPriceRaw = trade.entry_price !== null && trade.entry_price !== undefined ? Number(trade.entry_price) : null;
  const entryPrice = Number.isFinite(entryPriceRaw) && entryPriceRaw > 0 ? entryPriceRaw : null;
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return [];
  }

  const exitDate = trade.exit_date ? new Date(trade.exit_date) : null;
  const validExitDate = exitDate && isValidDate(exitDate) ? exitDate : null;
  const targetPriceRaw = trade.exit_price !== null && trade.exit_price !== undefined
    ? Number(trade.exit_price)
    : (trade.target_price !== null && trade.target_price !== undefined ? Number(trade.target_price) : null);
  const targetPrice = Number.isFinite(targetPriceRaw) && targetPriceRaw > 0 ? targetPriceRaw : entryPrice;

  const startDate = new Date(entryDate);
  startDate.setDate(startDate.getDate() - 10);
  const finalDate = validExitDate ? new Date(validExitDate) : new Date(entryDate);
  finalDate.setDate(finalDate.getDate() + 10);

  const totalDays = Math.max(1, Math.round((finalDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  const priceSeries = [];
  const volatility = Math.max(entryPrice * 0.015, 0.1);

  for (let i = 0; i <= totalDays; i += 1) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const progress = totalDays === 0 ? 0 : i / totalDays;
    const baseTrend = entryPrice + (targetPrice - entryPrice) * progress;
    const wave = Math.sin(i / 3) * volatility;
    const openBase = baseTrend + wave;
    let open = openBase;
    let close = openBase + Math.sin((i + 1) / 2) * (volatility / 2);

    if (currentDate.toDateString() === entryDate.toDateString()) {
      open = entryPrice;
      close = entryPrice;
    }

    if (validExitDate && currentDate.toDateString() === validExitDate.toDateString()) {
      open = targetPrice;
      close = targetPrice;
    }

    let high = Math.max(open, close) + volatility;
    let low = Math.min(open, close) - volatility;

    if (low < 0) {
      low = Math.max(0.01, low + volatility);
    }
    if (high <= low) {
      high = low + volatility;
    }

    priceSeries.push({
      Date: currentDate.toISOString(),
      Open: Number(open.toFixed(2)),
      High: Number(high.toFixed(2)),
      Low: Number(low.toFixed(2)),
      Close: Number(close.toFixed(2))
    });
  }

  return priceSeries;
};

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('entry_date');
  const [order, setOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    ticker: '',
    direction: 'Buy',
    volume: '',
    entry_price: '',
    stop_loss: '',
    target_price: '',
    entry_date: null,
    exit_date: null,
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
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Handle closing notifications
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Load trades function
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
  
  // Fetch trades data
  useEffect(() => {
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

      const entryDate = new Date(trade.entry_date);
      if (!isValidDate(entryDate)) {
        setChartOptions(null);
        setChartError('Invalid entry date for this trade.');
        return;
      }

      const exitDate = trade.exit_date ? new Date(trade.exit_date) : null;

      const startDate = new Date(entryDate);
      startDate.setDate(startDate.getDate() - 10);

      const endDate = exitDate && isValidDate(exitDate) ? new Date(exitDate) : new Date(entryDate);
      endDate.setDate(endDate.getDate() + 10);

      const data = await fetchChartData(
        trade.ticker,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );

      const priceSeries = Array.isArray(data) ? data : [];
      const options = buildChartOptions(trade, priceSeries);

      if (!options) {
        throw new Error('No chart data available for this period.');
      }

      setChartOptions(options);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      const fallbackSeries = generateFallbackPriceSeries(trade);
      const fallbackOptions = buildChartOptions(trade, fallbackSeries);

      if (fallbackOptions) {
        setChartOptions(fallbackOptions);
        setChartError(null);
      } else {
        setChartOptions(null);
        setChartError('Failed to load chart data. Please try again later.');
      }
    } finally {
      setChartLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTrade(null);
    setChartOptions(null);
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
    setEditFormData({
      id: trade.id,
      ticker: trade.ticker,
      direction: trade.direction,
      volume: trade.volume.toString(),
      entry_price: trade.entry_price !== null ? trade.entry_price.toString() : '',
      stop_loss: trade.stop_loss !== null ? trade.stop_loss.toString() : '',
      target_price: trade.target_price !== null ? trade.target_price.toString() : '',
      entry_date: trade.entry_date ? new Date(trade.entry_date) : null,
      exit_date: trade.exit_date ? new Date(trade.exit_date) : null,
      exit_price: trade.exit_price !== null ? trade.exit_price.toString() : ''
    });
    setEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
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
    
    setLoading(true);
    setEditLoading(true);
    try {
      // Convert data for API
      const updatedTrade = {
        ...editFormData,
        volume: parseInt(editFormData.volume),
        entry_price: parseFloat(editFormData.entry_price),
        stop_loss: editFormData.stop_loss !== '' ? parseFloat(editFormData.stop_loss) : null,
        target_price: editFormData.target_price !== '' ? parseFloat(editFormData.target_price) : null,
        exit_price: editFormData.exit_price !== '' ? parseFloat(editFormData.exit_price) : null,
        entry_date: editFormData.entry_date.toISOString(),
        exit_date: editFormData.exit_date ? editFormData.exit_date.toISOString() : null
      };
      
      await updateTrade(editFormData.id, updatedTrade);
      
      // Refresh trades list and close modal
      await loadTrades();
      setEditModalOpen(false);
      setNotification({
        open: true,
        message: 'Trade updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating trade:', error);
      setNotification({
        open: true,
        message: `Error updating trade: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
                            {formatCurrency(trade.risk_dollars)}
                          </Typography>
                        ) : (
                          <Chip label="-" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.target_price !== null && trade.entry_price !== null && trade.volume !== null ? (
                          <Typography>
                            {formatCurrency(Math.abs(trade.target_price - trade.entry_price) * trade.volume)}
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
                            {formatCurrency(trade.profit_loss)}
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
                    <Typography variant="body1">{formatCurrency(selectedTrade.entry_price)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.exit_price !== null ? 
                        formatCurrency(selectedTrade.exit_price) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Stop Loss:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.stop_loss !== null ? 
                        formatCurrency(selectedTrade.stop_loss) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Target Price:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.target_price !== null ? 
                        formatCurrency(selectedTrade.target_price) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Entry Date:</Typography>
                    <Typography variant="body1">{format(new Date(selectedTrade.entry_date), 'MMM dd, yyyy HH:mm')}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">Exit Date:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.exit_date ? 
                        format(new Date(selectedTrade.exit_date), 'MMM dd, yyyy HH:mm') : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Days Held:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.days_held !== null ? 
                        `${selectedTrade.days_held.toFixed(1)} days` : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">R:R Ratio:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.risk_reward !== null ? 
                        selectedTrade.risk_reward.toFixed(2) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Profit Factor:</Typography>
                    <Typography variant="body1">
                      {selectedTrade.profit_factor !== null ? 
                        selectedTrade.profit_factor.toFixed(2) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Risk ($):</Typography>
                    <Typography variant="body1">
                      {selectedTrade.risk_dollars !== null ? 
                        formatCurrency(selectedTrade.risk_dollars) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">Target P/L ($):</Typography>
                    <Typography variant="body1">
                      {selectedTrade.target_price !== null && selectedTrade.entry_price !== null ? 
                        formatCurrency(Math.abs(selectedTrade.target_price - selectedTrade.entry_price) * selectedTrade.volume) : 
                        '-'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">P/L:</Typography>
                    <Typography 
                      variant="body1" 
                      color={selectedTrade.profit_loss > 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {selectedTrade.profit_loss !== null ? 
                        formatCurrency(selectedTrade.profit_loss) : 
                        '-'}
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
                  ) : chartOptions ? (
                    <Box sx={{ height: '300px' }}>
                      <HighchartsReact
                        highcharts={Highcharts}
                        constructorType="stockChart"
                        options={chartOptions}
                      />
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
                  fullWidth
                  label="Stop Loss Price (optional)"
                  name="stop_loss"
                  type="number"
                  value={editFormData.stop_loss}
                  onChange={handleEditFormChange}
                  inputProps={{ step: 0.01, min: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target Price (optional)"
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
                  label="Exit Date & Time (EST) (optional)"
                  value={editFormData.exit_date}
                  onChange={(date) => handleEditDateChange('exit_date', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exit Price (optional)"
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
      
      {/* Notification Snackbar */}
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
    </Container>
  );
};

export default TradeHistory; 
