const express = require('express');
const {
  toggleAvailability,
  getMyAssignments,
  updateAssignmentStatus,
  uploadProof,
  getImpactStats,
} = require('../controllers/volunteer.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['VOLUNTEER']));

router.patch('/availability', toggleAvailability);
router.get('/assignments/my', getMyAssignments);
router.patch('/assignments/:assignmentId/status', updateAssignmentStatus);
router.post('/assignments/:assignmentId/proof', upload.single('image'), uploadProof);
router.get('/stats/impact', getImpactStats);

module.exports = router;
