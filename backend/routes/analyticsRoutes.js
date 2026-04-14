const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

// Public route to track views
router.post('/view/:vendorId', analyticsController.trackView);

// Protected route for vendor dashboard
router.get('/', authenticate, requireRoles('VENDOR'), analyticsController.getVendorStats);

module.exports = router;
