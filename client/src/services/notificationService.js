import api from './api';

const notificationService = {
  getMyNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    const response = await api.get('/notifications/my', {
      params: { page, limit, unreadOnly }
    });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  }
};

export default notificationService;
