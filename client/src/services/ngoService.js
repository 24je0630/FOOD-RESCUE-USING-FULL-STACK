import api from './api';

const ngoService = {
  // Discover available donations
  discoverDonations: async (filters = {}) => {
    const response = await api.get('/ngo/donations/discover', { params: filters });
    return response.data.data;
  },

  // Request a pickup
  requestPickup: async (donationId) => {
    const response = await api.post(`/ngo/donations/${donationId}/request`);
    return response.data.data;
  },

  // Get NGO's pickup requests
  getMyRequests: async () => {
    const response = await api.get('/ngo/requests/my');
    return response.data.data;
  },

  // Cancel a pickup request
  cancelRequest: async (requestId) => {
    const response = await api.patch(`/ngo/requests/${requestId}/cancel`);
    return response.data.data;
  }
};

export default ngoService;
