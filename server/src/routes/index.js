const express = require('express');
const authRoutes = require('./auth.routes');
const donationRoutes = require('./donation.routes');
const ngoRoutes = require('./ngo.routes');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Food Rescue API is running!' });
});

router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/ngo', ngoRoutes);

module.exports = router;
