import api from './api';

const analyticsService = {
  getRestaurantAnalytics: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/analytics/restaurant', { params });
    return response.data.data;
  }
};

export default analyticsService;
