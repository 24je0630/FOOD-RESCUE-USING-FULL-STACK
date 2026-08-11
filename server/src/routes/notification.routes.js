const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notification.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/my', getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
