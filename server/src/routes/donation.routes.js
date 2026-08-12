const express = require('express');
const {
  createDonation,
  getMyDonations,
  getDonationById,
  updateDonation,
  getImpactStats,
  acceptPickupRequest,
  uploadDonationImage,
} = require('../controllers/donation.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Apply auth and RESTAURANT role requirement to all routes in this file
router.use(requireAuth);
router.use(requireRole(['RESTAURANT']));

router.post('/', createDonation);
router.get('/my', getMyDonations);
router.get('/stats/impact', getImpactStats);
router.get('/:id', getDonationById);
router.put('/:id', updateDonation);
router.patch('/:id/status', updateDonation); // Assuming status update goes through same validation
router.post('/requests/:requestId/accept', acceptPickupRequest);
router.post('/:id/images', upload.single('image'), uploadDonationImage);

module.exports = router;
