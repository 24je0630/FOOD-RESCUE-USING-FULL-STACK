const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Food Rescue API is running!' });
});

module.exports = router;
