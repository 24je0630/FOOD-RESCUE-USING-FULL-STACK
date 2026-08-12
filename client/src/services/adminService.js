import api from './api';

const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  getRestaurants: async (params = {}) => {
    const response = await api.get('/admin/restaurants', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  updateRestaurantVerification: async (id, status) => {
    const response = await api.patch(`/admin/restaurants/${id}/verification`, { status });
    return response.data;
  },

  getNgos: async (params = {}) => {
    const response = await api.get('/admin/ngos', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  updateNgoVerification: async (id, status) => {
    const response = await api.patch(`/admin/ngos/${id}/verification`, { status });
    return response.data;
  },

  getVolunteers: async (params = {}) => {
    const response = await api.get('/admin/volunteers', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  updateVolunteerVerification: async (id, status) => {
    const response = await api.patch(`/admin/volunteers/${id}/verification`, { status });
    return response.data;
  },

  getDonations: async (params = {}) => {
    const response = await api.get('/admin/donations', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  getPickups: async (params = {}) => {
    const response = await api.get('/admin/pickups', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  }
};

export default adminService;
