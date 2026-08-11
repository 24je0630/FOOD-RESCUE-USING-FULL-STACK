const express = require('express');
const authRoutes = require('./auth.routes');
const donationRoutes = require('./donation.routes');
const ngoRoutes = require('./ngo.routes');
const volunteerRoutes = require('./volunteer.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Food Rescue API is running!' });
});

router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/ngo', ngoRoutes);
router.use('/volunteer', volunteerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
