const express = require('express');
const {
  discoverDonations,
  requestPickup,
  getMyRequests,
  cancelRequest,
  getImpactStats,
} = require('../controllers/ngo.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['NGO']));

router.get('/donations/discover', discoverDonations);
router.post('/donations/:donationId/request', requestPickup);
router.get('/requests/my', getMyRequests);
router.patch('/requests/:requestId/cancel', cancelRequest);
router.get('/stats/impact', getImpactStats);

module.exports = router;
