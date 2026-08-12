import api from './api';

const donationService = {
  // Create a new donation
  createDonation: async (data) => {
    const response = await api.post('/donations', data);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Get all donations for logged-in restaurant
  getMyDonations: async (params = {}) => {
    const response = await api.get('/donations/my', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Get specific donation by ID
  getDonationById: async (id) => {
    const response = await api.get(`/donations/${id}`);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Update donation
  updateDonation: async (id, data) => {
    const response = await api.put(`/donations/${id}`, data);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Update donation status (e.g., Cancel)
  updateDonationStatus: async (id, status) => {
    const response = await api.patch(`/donations/${id}/status`, { status });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Get impact stats
  getImpactStats: async () => {
    const response = await api.get('/donations/stats/impact');
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Accept a pickup request
  acceptPickupRequest: async (requestId) => {
    const response = await api.post(`/donations/requests/${requestId}/accept`);
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Upload donation image
  uploadDonationImage: async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post(`/donations/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },
};

export default donationService;
