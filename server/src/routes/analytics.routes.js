const express = require('express');
const {
  getGlobalAnalytics,
  getRestaurantAnalytics,
  getNgoAnalytics,
  getVolunteerAnalytics
} = require('../controllers/analytics.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/global', requireRole(['ADMIN']), getGlobalAnalytics);
router.get('/restaurant', requireRole(['RESTAURANT']), getRestaurantAnalytics);
router.get('/ngo', requireRole(['NGO']), getNgoAnalytics);
router.get('/volunteer', requireRole(['VOLUNTEER']), getVolunteerAnalytics);

module.exports = router;
