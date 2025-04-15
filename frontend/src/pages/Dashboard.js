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
          {/* Summary Stats */}
          <Grid container spacing={4} sx={{ mb: 5, mt: 2 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Trades
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.total_trades}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Win Rate
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div"
                    color={stats.win_rate > 0.5 ? 'success.main' : 'error.main'}
                  >
                    {formatPercentage(stats.win_rate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total P/L
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div"
                    color={stats.total_profit_loss > 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(stats.total_profit_loss)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={6} sx={{ p: 2, border: '1.5px solid #232a34', boxShadow: '0 4px 24px 0 #00bcd455', background: 'rgba(36,40,50,0.92)' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Risk/Reward
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.avg_risk_reward.toFixed(2)}
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