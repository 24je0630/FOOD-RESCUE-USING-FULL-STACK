import api from './api';

const volunteerService = {
  // Toggle availability
  toggleAvailability: async (isAvailable) => {
    const response = await api.patch('/volunteer/availability', { isAvailable });
    return response.data;
  },

  // Get my assignments
  getMyAssignments: async () => {
    const response = await api.get('/volunteer/assignments/my');
    return response.data.data;
  },

  // Update assignment status (accept, pickup, collect, deliver)
  updateAssignmentStatus: async (assignmentId, status) => {
    const response = await api.patch(`/volunteer/assignments/${assignmentId}/status`, { status });
    return response.data.data;
  },

  // Upload proof
  uploadProof: async (assignmentId, proofImageUrl) => {
    const response = await api.post(`/volunteer/assignments/${assignmentId}/proof`, { proofImageUrl });
    return response.data.data;
  },
  
  // Get impact stats
  getImpactStats: async () => {
    const response = await api.get('/volunteer/stats/impact');
    return response.data.data;
  }
};

export default volunteerService;
