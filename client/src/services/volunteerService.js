import api from './api';

const volunteerService = {
  // Toggle availability
  toggleAvailability: async (isAvailable) => {
    const response = await api.patch('/volunteer/availability', { isAvailable });
    return response.data;
  },

  // Get my assignments
  getMyAssignments: async (params = {}) => {
    const response = await api.get('/volunteer/assignments/my', { params });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Update assignment status (accept, pickup, collect, deliver)
  updateAssignmentStatus: async (assignmentId, status) => {
    const response = await api.patch(`/volunteer/assignments/${assignmentId}/status`, { status });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },

  // Upload proof
  uploadProof: async (assignmentId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post(`/volunteer/assignments/${assignmentId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  },
  
  // Get impact stats
  getImpactStats: async () => {
    const response = await api.get('/volunteer/stats/impact');
    return response.data.meta ? { data: response.data.data, meta: response.data.meta } : response.data.data;
  }
};

export default volunteerService;
