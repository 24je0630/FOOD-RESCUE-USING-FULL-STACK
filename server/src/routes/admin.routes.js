const express = require('express');
const {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getRestaurants,
  updateRestaurantVerification,
  getNgos,
  updateNgoVerification,
  getVolunteers,
  getDonations,
  getPickups,
  getActivityLogs,
  updateVolunteerVerification
} = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Strict Admin-only middleware
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);

// Restaurants
router.get('/restaurants', getRestaurants);
router.patch('/restaurants/:id/verification', updateRestaurantVerification);

// NGOs
router.get('/ngos', getNgos);
router.patch('/ngos/:id/verification', updateNgoVerification);

// Volunteers
router.get('/volunteers', getVolunteers);
router.patch('/volunteers/:id/verification', updateVolunteerVerification);

// Monitoring
router.get('/donations', getDonations);
router.get('/pickups', getPickups);

// Activity Logs
router.get('/activity-logs', getActivityLogs);

// Reports (for now reusing dashboard logic internally or just exposing existing analytics)
router.get('/reports', getDashboardStats); 

module.exports = router;
