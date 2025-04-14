import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trade API functions
export const fetchTrades = async () => {
  const response = await api.get('/api/trades');
  return response.data;
};

export const fetchTrade = async (id) => {
  const response = await api.get(`/api/trades/${id}`);
  return response.data;
};

export const createTrade = async (tradeData) => {
  const response = await api.post('/api/trades', tradeData);
  return response.data;
};

export const updateTrade = async (id, tradeData) => {
  const response = await api.put(`/api/trades/${id}`, tradeData);
  return response.data;
};

export const deleteTrade = async (id) => {
  const response = await api.delete(`/api/trades/${id}`);
  return response.data;
};

// Stats API functions
export const fetchStats = async () => {
  const response = await api.get('/api/stats');
  return response.data;
};

// Chart data API functions
export const fetchChartData = async (ticker, startDate, endDate) => {
  const response = await api.get(`/api/charts/${ticker}`, {
    params: {
      start: startDate,
      end: endDate,
    },
  });
  return response.data;
};

export default api; 