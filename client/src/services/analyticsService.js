import api from './api';

const analyticsService = {
  getRestaurantAnalytics: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/analytics/restaurant', { params });
    return response.data.data;
  },
  getNgoAnalytics: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/analytics/ngo', { params });
    return response.data.data;
  },
  getVolunteerAnalytics: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/analytics/volunteer', { params });
    return response.data.data;
  }
};

export default analyticsService;
