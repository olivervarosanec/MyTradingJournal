import React, { useState, useEffect, useMemo } from 'react';
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
  CardHeader,
  Stack,
  Avatar
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import InsightsIcon from '@mui/icons-material/Insights';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HCMore from 'highcharts/highcharts-more';
import HCExporting from 'highcharts/modules/exporting';
import HCExportData from 'highcharts/modules/export-data';
import { fetchStats, fetchTrades } from '../services/api';
import { format } from 'date-fns';

const registerHighchartsModule = (module) => {
  if (!module) return;
  if (typeof module === 'function') {
    module(Highcharts);
  } else if (typeof module === 'object' && typeof module.default === 'function') {
    module.default(Highcharts);
  }
};

if (typeof Highcharts === 'object' && !Highcharts.__customModulesLoaded) {
  [HCMore, HCExporting, HCExportData].forEach(registerHighchartsModule);
  Highcharts.__customModulesLoaded = true;
}

Highcharts.setOptions({
  credits: { enabled: false },
  exporting: {
    enabled: false,
    buttons: { contextButton: { enabled: false } }
  }
});

const chartPalette = ['#00bcd4', '#ffd600', '#26d782', '#ff5370', '#42a5f5', '#7e57c2'];

const MAX_EQUITY_POINTS = 90;
const MAX_MONTHLY_POINTS = 12;

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
  
  const tickerDistribution = useMemo(() => {
    const counts = trades.reduce((acc, trade) => {
      if (!trade.ticker) return acc;
      acc[trade.ticker] = (acc[trade.ticker] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({ name, y: value }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 8);
  }, [trades]);

  const directionDistribution = useMemo(() => {
    const buy = trades.filter(trade => trade.direction === 'Buy').length;
    const short = trades.filter(trade => trade.direction === 'Short').length;
    return [
      { name: 'Long (Buy)', y: buy, color: '#26d782' },
      { name: 'Short (Sell)', y: short, color: '#ff5370' }
    ];
  }, [trades]);

  const holdingDistribution = useMemo(() => {
    const intraday = trades.filter(trade => trade.days_held !== null && trade.days_held < 1).length;
    const overnight = trades.filter(trade => trade.days_held !== null && trade.days_held >= 1).length;
    return [
      { name: 'Intraday (< 1 day)', y: intraday, color: '#42a5f5' },
      { name: 'Multi-day', y: overnight, color: '#7e57c2' }
    ];
  }, [trades]);

  const sortedClosedTrades = useMemo(() => (
    trades
      .filter(trade => trade.exit_date && trade.cumulative_equity !== null && trade.cumulative_equity !== undefined)
      .sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date))
  ), [trades]);

  const trimmedClosedTrades = useMemo(() => {
    if (!sortedClosedTrades.length) return [];
    if (sortedClosedTrades.length > MAX_EQUITY_POINTS) {
      return sortedClosedTrades.slice(-MAX_EQUITY_POINTS);
    }
    return sortedClosedTrades;
  }, [sortedClosedTrades]);

  const trimmedMonthlyPerformance = useMemo(() => {
    const performance = stats?.monthly_performance ?? [];
    if (performance.length > MAX_MONTHLY_POINTS) {
      return performance.slice(-MAX_MONTHLY_POINTS);
    }
    return performance;
  }, [stats]);

  const equityOptions = useMemo(() => {
    if (!trimmedClosedTrades.length) return null;

    const equitySeries = trimmedClosedTrades.map(trade => ([
      new Date(trade.exit_date).getTime(),
      Number(trade.cumulative_equity || 0)
    ]));

    return {
      chart: {
        type: 'areaspline',
        backgroundColor: 'transparent',
        height: 320,
        animation: true,
        zoomType: 'x',
        spacing: [16, 12, 12, 12],
        style: { fontFamily: 'Inter, Roboto, sans-serif' }
      },
      title: { text: undefined },
      xAxis: {
        type: 'datetime',
        lineColor: 'rgba(255,255,255,0.12)',
        tickPixelInterval: 110,
        labels: {
          style: { color: 'rgba(255,255,255,0.65)' },
          rotation: trimmedClosedTrades.length > 20 ? -35 : 0
        }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: 'rgba(255,255,255,0.08)',
        labels: {
          formatter: function () { return formatCurrency(this.value); },
          style: { color: 'rgba(255,255,255,0.65)' }
        }
      },
      legend: { enabled: false },
      tooltip: {
        useHTML: true,
        backgroundColor: 'rgba(24,28,36,0.92)',
        borderColor: '#00bcd4',
        formatter: function () {
          const trade = trimmedClosedTrades[this.point.index];
          const dateLabel = Highcharts.dateFormat('%b %e, %Y', this.x);
          return `<strong>${dateLabel}</strong><br/>Equity: <b>${formatCurrency(this.y)}</b><br/>Ticker: ${trade?.ticker ?? 'N/A'}`;
        }
      },
      plotOptions: {
        series: {
          marker: { enabled: trimmedClosedTrades.length <= 40, radius: 3 },
          lineWidth: 2
        }
      },
      series: [{
        name: 'Cumulative Equity',
        data: equitySeries,
        color: '#00bcd4',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(0, 188, 212, 0.65)'],
            [1, 'rgba(0, 188, 212, 0.05)']
          ]
        }
      }],
      credits: { enabled: false }
    };
  }, [trimmedClosedTrades]);

  const monthlyPerformanceOptions = useMemo(() => {
    if (!trimmedMonthlyPerformance.length) return null;

    const tickInterval = trimmedMonthlyPerformance.length > 6
      ? Math.max(1, Math.floor(trimmedMonthlyPerformance.length / 6))
      : 1;

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 320,
        style: { fontFamily: 'Inter, Roboto, sans-serif' }
      },
      title: { text: undefined },
      xAxis: {
        categories: trimmedMonthlyPerformance.map(item => item.month),
        crosshair: true,
        lineColor: 'rgba(255,255,255,0.12)',
        tickInterval,
        labels: {
          style: { color: 'rgba(255,255,255,0.65)' },
          rotation: trimmedMonthlyPerformance.length > 6 ? -35 : 0
        }
      },
      yAxis: {
        title: { text: null },
        gridLineColor: 'rgba(255,255,255,0.08)',
        labels: {
          formatter: function () { return formatCurrency(this.value); },
          style: { color: 'rgba(255,255,255,0.65)' }
        }
      },
      legend: { enabled: false },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(24,28,36,0.92)',
        borderColor: '#ffd600',
        formatter: function () {
          return `<strong>${this.x}</strong><br/>Profit/Loss: <b>${formatCurrency(this.y)}</b>`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 6,
          pointPadding: 0.1,
          groupPadding: 0.12,
          colorByPoint: true,
          colors: trimmedMonthlyPerformance.map(item => item.profit_loss >= 0 ? '#26d782' : '#ff5370')
        }
      },
      series: [{
        name: 'Monthly P/L',
        data: trimmedMonthlyPerformance.map(item => Number(item.profit_loss || 0))
      }],
      credits: { enabled: false }
    };
  }, [trimmedMonthlyPerformance]);

  const pieBaseOptions = useMemo(() => ({
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 260,
      style: { fontFamily: 'Inter, Roboto, sans-serif' }
    },
    title: { text: undefined },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      itemStyle: { color: 'rgba(255,255,255,0.78)' }
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> trades ({point.percentage:.1f}%)',
      backgroundColor: 'rgba(24,28,36,0.92)',
      borderColor: '#00bcd4'
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: '<span style="color:rgba(255,255,255,0.75)">{point.name}</span><br/><span style="font-size:12px;color:#00bcd4">{point.percentage:.0f}%</span>',
          distance: -40
        }
      }
    }
  }), []);

  const tickerOptions = useMemo(() => (
    tickerDistribution.length ? {
      ...pieBaseOptions,
      series: [{
        name: 'Trades',
        data: tickerDistribution.map((item, idx) => ({
          ...item,
          color: chartPalette[idx % chartPalette.length]
        }))
      }]
    } : null
  ), [pieBaseOptions, tickerDistribution]);

  const directionOptions = useMemo(() => (
    directionDistribution.length ? {
      ...pieBaseOptions,
      series: [{ name: 'Trades', data: directionDistribution }]
    } : null
  ), [pieBaseOptions, directionDistribution]);

  const holdingOptions = useMemo(() => (
    holdingDistribution.length ? {
      ...pieBaseOptions,
      series: [{ name: 'Trades', data: holdingDistribution }]
    } : null
  ), [pieBaseOptions, holdingDistribution]);

  const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;
  
  // --- Additional Calculated Stats ---
  const totalWinnerTrades = trades.filter(trade => trade.profit_loss > 0).length;
  const totalLoserTrades = trades.filter(trade => trade.profit_loss < 0).length;
  const currentOpenTrades = trades.filter(trade => trade.exit_date === null || trade.exit_date === undefined).length;
  const winningTrades = trades.filter(trade => trade.profit_loss > 0);
  const losingTrades = trades.filter(trade => trade.profit_loss < 0);
  const avgWinningTrade = winningTrades.length > 0 ? winningTrades.reduce((acc, t) => acc + t.profit_loss, 0) / winningTrades.length : 0;
  const avgLosingTrade = losingTrades.length > 0 ? losingTrades.reduce((acc, t) => acc + t.profit_loss, 0) / losingTrades.length : 0;
  const winRate = stats?.win_rate ?? 0;
  const totalProfitLoss = stats?.total_profit_loss ?? 0;
  const avgRiskReward = stats?.avg_risk_reward ?? 0;
  
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
          <Paper
            elevation={10}
            sx={{
              p: 4,
              mb: 5,
              mt: 2,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(36,40,50,0.92) 0%, rgba(0,188,212,0.25) 100%)',
              border: '1px solid rgba(0,188,212,0.35)'
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight={700} color="#e3f2fd" gutterBottom>
                  Portfolio Performance Pulse
                </Typography>
                <Typography variant="body1" color="rgba(224,242,255,0.75)">
                  A modern snapshot of trade performance, risk posture, and capital growth across your book.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 3, background: 'rgba(30,34,44,0.85)', border: '1px solid rgba(255,214,0,0.35)' }}>
                  <Typography variant="body2" color="rgba(255,214,0,0.9)">Win Rate</Typography>
                  <Typography variant="h4" fontWeight={700} color={winRate > 0.5 ? '#26d782' : '#ff5370'}>
                    {formatPercentage(winRate)}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ px: 3, py: 2, borderRadius: 3, background: 'rgba(30,34,44,0.85)', border: '1px solid rgba(38,215,130,0.35)' }}>
                  <Typography variant="body2" color="rgba(38,215,130,0.9)">Net P/L</Typography>
                  <Typography variant="h4" fontWeight={700} color={totalProfitLoss >= 0 ? '#26d782' : '#ff5370'}>
                    {formatCurrency(totalProfitLoss)}
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              {
                label: 'Winning Trades',
                value: totalWinnerTrades,
                sub: 'Positions closed in profit',
                color: '#26d782'
              },
              {
                label: 'Losing Trades',
                value: totalLoserTrades,
                sub: 'Positions closed in loss',
                color: '#ff5370'
              },
              {
                label: 'Open Exposure',
                value: currentOpenTrades,
                sub: 'Trades currently open',
                color: '#ffd600'
              },
              {
                label: 'Avg. Risk / Reward',
                value: avgRiskReward.toFixed(2),
                sub: 'Portfolio risk efficiency',
                color: '#00bcd4'
              },
              {
                label: 'Avg. Win',
                value: formatCurrency(avgWinningTrade),
                sub: 'Mean profit per winner',
                color: '#29b6f6'
              },
              {
                label: 'Avg. Loss',
                value: formatCurrency(avgLosingTrade),
                sub: 'Mean loss per loser',
                color: '#ab47bc'
              }
            ].map(metric => (
              <Grid item xs={12} sm={6} md={4} key={metric.label}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at top, rgba(0,188,212,0.06), rgba(24,28,36,0.9))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'rgba(255,255,255,0.18)'
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: `${metric.color}25`, color: metric.color }}>
                      <InsightsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
                        {metric.label}
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="white">
                        {metric.value}
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.55)">
                        {metric.sub}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} lg={7}>
              <Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: 'rgba(30,34,44,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <TimelineIcon color="primary" />
                  <Typography variant="h5" component="h2">Equity Trajectory</Typography>
                </Stack>
                {equityOptions ? (
                  <HighchartsReact highcharts={Highcharts} options={equityOptions} />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">Insufficient closed trades to render equity curve.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: 'rgba(30,34,44,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h5" component="h2">Monthly Performance</Typography>
                </Stack>
                {monthlyPerformanceOptions ? (
                  <HighchartsReact highcharts={Highcharts} options={monthlyPerformanceOptions} />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No monthly performance history yet.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 3, borderRadius: 4, background: 'rgba(30,34,44,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <PieChartIcon color="primary" />
                  <Typography variant="h6">Ticker Allocation</Typography>
                </Stack>
                {tickerOptions ? (
                  <HighchartsReact highcharts={Highcharts} options={tickerOptions} />
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No trade distribution yet.</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 3, borderRadius: 4, background: 'rgba(30,34,44,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6">Direction Mix</Typography>
                </Stack>
                {directionOptions ? (
                  <HighchartsReact highcharts={Highcharts} options={directionOptions} />
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No directional data.</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={6} sx={{ p: 3, borderRadius: 4, background: 'rgba(30,34,44,0.88)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                  <InsightsIcon color="primary" />
                  <Typography variant="h6">Holding Horizon</Typography>
                </Stack>
                {holdingOptions ? (
                  <HighchartsReact highcharts={Highcharts} options={holdingOptions} />
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Add trades to view holding periods.</Typography>
                )}
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
                        <Typography variant="body2">{formatCurrency(stats.best_trade.entry_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                        <Typography variant="body2">{formatCurrency(stats.best_trade.exit_price)}</Typography>
                        
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
                        <Typography variant="body2">{formatCurrency(stats.worst_trade.entry_price)}</Typography>
                        
                        <Typography variant="body2" color="text.secondary">Exit Price:</Typography>
                        <Typography variant="body2">{formatCurrency(stats.worst_trade.exit_price)}</Typography>
                        
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
