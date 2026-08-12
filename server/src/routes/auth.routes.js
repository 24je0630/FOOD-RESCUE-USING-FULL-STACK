const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../config/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);

module.exports = router;
