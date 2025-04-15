import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
  CardHeader
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { fetchStats, fetchTrades } from '../services/api';
import { format } from 'date-fns';

// Chart colors
const COLORS = ['#00bcd4', '#ffd600', '#26d782', '#ff5370', '#42a5f5', '#7e57c2'];

// Currency formatting function for $1,127,500.00 style
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, tradesData] = await Promise.all([
          fetchStats(),
          fetchTrades()
        ]);
        
        setStats(statsData);
        setTrades(tradesData);
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Prepare data for ticker distribution chart
  const getTickerDistribution = () => {
    const tickerCounts = {};
    trades.forEach(trade => {
      if (!tickerCounts[trade.ticker]) {
        tickerCounts[trade.ticker] = 0;
      }
      tickerCounts[trade.ticker]++;
    });
    
    return Object.entries(tickerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);  // Show top 6 tickers
  };
  
  // Prepare data for direction distribution chart
  const getDirectionDistribution = () => {
    const buyCount = trades.filter(trade => trade.direction === 'Buy').length;
    const shortCount = trades.filter(trade => trade.direction === 'Short').length;
    
    return [
      { name: 'Buy', value: buyCount },
      { name: 'Short', value: shortCount }
    ];
  };
  
  // Prepare data for holding period distribution chart
  const getHoldingDistribution = () => {
    const intraday = trades.filter(trade => trade.days_held < 1).length;
    const overnight = trades.filter(trade => trade.days_held >= 1).length;
    
    return [
      { name: 'Intraday', value: intraday },
      { name: 'Overnight', value: overnight }
    ];
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // --- Additional Calculated Stats ---
  const totalWinnerTrades = trades.filter(trade => trade.profit_loss > 0).length;
  const totalLoserTrades = trades.filter(trade => trade.profit_loss < 0).length;
  const currentOpenTrades = trades.filter(trade => trade.exit_date === null || trade.exit_date === undefined).length;
  const winningTrades = trades.filter(trade => trade.profit_loss > 0);
  const losingTrades = trades.filter(trade => trade.profit_loss < 0);
  const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((acc, t) => acc + t.profit_loss, 0) / winningTrades.length : 0;
  const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((acc, t) => acc + t.profit_loss, 0) / losingTrades.length : 0;
  
  return (
    <Container maxWidth="lg">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ my: 5 }}>
          {error}
        </Typography>
      ) : (
        <>
          {/* Modern Control Dashboard Summary Stats */}
          <Grid container spacing={3} sx={{ mb: 5, mt: 2, flexWrap: 'wrap' }}>
            {/* Winner Trades */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #26d782',
                background: 'linear-gradient(135deg, #232a34 80%, #26d782 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #26d78255',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #26d782cc, 0 4px 24px 0 #26d78255',
                  borderColor: '#00ffb0',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Winner Trades
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {totalWinnerTrades}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Loser Trades */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #ff5370',
                background: 'linear-gradient(135deg, #232a34 80%, #ff5370 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #ff537055',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #ff5370cc, 0 4px 24px 0 #ff537055',
                  borderColor: '#ff1744',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Loser Trades
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {totalLoserTrades}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Open Trades */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #ffd600',
                background: 'linear-gradient(135deg, #232a34 80%, #ffd600 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #ffd60055',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #ffd600cc, 0 4px 24px 0 #ffd60055',
                  borderColor: '#fff700',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Open Trades
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {currentOpenTrades}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Win Rate */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #42a5f5',
                background: 'linear-gradient(135deg, #232a34 80%, #42a5f5 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #42a5f555',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #42a5f5cc, 0 4px 24px 0 #42a5f555',
                  borderColor: '#00e5ff',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Win Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={stats.win_rate > 0.5 ? '#26d782' : '#ff5370'}>
                    {formatPercentage(stats.win_rate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Total P/L */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #00bcd4',
                background: 'linear-gradient(135deg, #232a34 80%, #00bcd4 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #00bcd455',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #00bcd4cc, 0 4px 24px 0 #00bcd455',
                  borderColor: '#00e5ff',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Total P/L
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={stats.total_profit_loss > 0 ? '#26d782' : '#ff5370'}>
                    {formatCurrency(stats.total_profit_loss)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Avg. Risk/Reward */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #ffd600',
                background: 'linear-gradient(135deg, #232a34 80%, #ffd600 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #ffd60055',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #ffd600cc, 0 4px 24px 0 #ffd60055',
                  borderColor: '#fff700',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Avg. Risk/Reward
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.avg_risk_reward.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Avg. Loss ($) */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #ff5370',
                background: 'linear-gradient(135deg, #232a34 80%, #ff5370 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #ff537055',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #ff5370cc, 0 4px 24px 0 #ff537055',
                  borderColor: '#ff1744',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Avg. Loss ($)
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatCurrency(avgLosingTrade)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* Avg. Win ($) */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={8} sx={{
                p: 2,
                border: '2px solid #26d782',
                background: 'linear-gradient(135deg, #232a34 80%, #26d782 100%)',
                color: '#fff',
                minHeight: 120,
                transition: 'box-shadow 0.3s, border-color 0.3s',
                boxShadow: '0 4px 24px 0 #26d78255',
                '&:hover': {
                  boxShadow: '0 0 32px 8px #26d782cc, 0 4px 24px 0 #26d78255',
                  borderColor: '#00ffb0',
                  zIndex: 2,
                },
              }}>
                <CardContent>
                  <Typography color="#b0b8c1" gutterBottom fontWeight={600}>
                    Avg. Win ($)
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatCurrency(avgWinningTrade)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Equity Curve */}
          <Paper elevation={6} sx={{ p: 4, mb: 5, border: '1.5px solid #232a34', background: 'rgba(30,34,44,0.85)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimelineIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Equity Curve
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={trades.map(trade => ({
                  date: format(new Date(trade.exit_date), 'MM/dd'),
                  equity: trade.cumulative_equity
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="#b0b8c1" />
                <YAxis stroke="#b0b8c1" />
                <Tooltip contentStyle={{ backgroundColor: '#232a34', borderColor: '#00bcd4' }} formatter={(value) => [`${formatCurrency(value)}`, 'Equity']} />
                <Legend />
                <Line type="monotone" dataKey="equity" stroke="#00bcd4" activeDot={{ r: 8 }} name="Account Equity" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          
          {/* Monthly Performance */}
          <Paper elevation={6} sx={{ p: 4, mb: 5, border: '1.5px solid #232a34', background: 'rgba(30,34,44,0.85)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Monthly Performance
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.monthly_performance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#b0b8c1" />
                <YAxis stroke="#b0b8c1" />
                <Tooltip contentStyle={{ backgroundColor: '#232a34', borderColor: '#00bcd4' }} formatter={(value) => [`${formatCurrency(value)}`, 'Profit/Loss']} />
                <Legend />
                <Bar dataKey="profit_loss" name="Profit/Loss" fill="#00bcd4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          
          {/* Distribution Charts */}
          <Grid container spacing={4} sx={{ mb: 5, mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 4, height: '100%', border: '1.5px solid #232a34', background: 'rgba(30,34,44,0.85)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    Ticker Distribution
                  </Typography>
                </Box>
                
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getTickerDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#00bcd4"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getTickerDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Trades']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 4, height: '100%', border: '1.5px solid #232a34', background: 'rgba(30,34,44,0.85)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    Direction Distribution
                  </Typography>
                </Box>
                
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getDirectionDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#00bcd4"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#26d782" />
                      <Cell fill="#ff5370" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Trades']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 4, height: '100%', border: '1.5px solid #232a34', background: 'rgba(30,34,44,0.85)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    Holding Period
                  </Typography>
                </Box>
                
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getHoldingDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#00bcd4"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#42a5f5" />
                      <Cell fill="#7e57c2" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Trades']} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Best and Worst Trades */}
          <Grid container spacing={4} sx={{ mb: 5, mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardHeader
                  title="Best Trade"
                  titleTypographyProps={{ variant: 'h6' }}
                  avatar={<TrendingUpIcon color="success" />}
                />
                <Divider />
                <CardContent>
                  {stats.best_trade ? (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={stats.best_trade.ticker} 
                          color="primary" 
                          size="small" 
                        />
                        <Chip 
                          label={stats.best_trade.direction} 
                          color={stats.best_trade.direction === 'Buy' ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Entry Date:</Typography>
                        <Typography variant="body2">
                          {format(new Date(stats.best_trade.entry_date), 'MMM dd, yyyy')}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Date:</Typography>
                        <Typography variant="body2">
                          {format(new Date(stats.best_trade.exit_date), 'MMM dd, yyyy')}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">Entry Price:</Typography>
                        <Typography variant="body2">${formatCurrency(stats.best_trade.entry_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                        <Typography variant="body2">${formatCurrency(stats.best_trade.exit_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Volume:</Typography>
                        <Typography variant="body2">{stats.best_trade.volume} shares</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Profit/Loss:</Typography>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          {formatCurrency(stats.best_trade.profit_loss)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography align="center">No trades available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardHeader
                  title="Worst Trade"
                  titleTypographyProps={{ variant: 'h6' }}
                  avatar={<TrendingDownIcon color="error" />}
                />
                <Divider />
                <CardContent>
                  {stats.worst_trade ? (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          label={stats.worst_trade.ticker} 
                          color="primary" 
                          size="small" 
                        />
                        <Chip 
                          label={stats.worst_trade.direction} 
                          color={stats.worst_trade.direction === 'Buy' ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Entry Date:</Typography>
                        <Typography variant="body2">
                          {format(new Date(stats.worst_trade.entry_date), 'MMM dd, yyyy')}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Date:</Typography>
                        <Typography variant="body2">
                          {format(new Date(stats.worst_trade.exit_date), 'MMM dd, yyyy')}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">Entry Price:</Typography>
                        <Typography variant="body2">${formatCurrency(stats.worst_trade.entry_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                        <Typography variant="body2">${formatCurrency(stats.worst_trade.exit_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Volume:</Typography>
                        <Typography variant="body2">{stats.worst_trade.volume} shares</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Profit/Loss:</Typography>
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          {formatCurrency(stats.worst_trade.profit_loss)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography align="center">No trades available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard; 