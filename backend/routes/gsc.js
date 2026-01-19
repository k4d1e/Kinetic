// routes/gsc.js - Google Search Console API routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getProperties,
  startCalibration,
  getAnalytics,
  getMetricData
} = require('../controllers/gscController');

// All GSC routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/gsc/properties
 * @desc    Get user's GSC properties
 * @access  Private
 */
router.get('/properties', getProperties);

/**
 * @route   POST /api/gsc/calibrate
 * @desc    Start calibration for a property
 * @access  Private
 */
router.post('/calibrate', startCalibration);

/**
 * @route   GET /api/gsc/analytics
 * @desc    Get search analytics data
 * @query   siteUrl - The GSC property URL
 * @access  Private
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/gsc/data/:metric
 * @desc    Get specific metric data (quick-wins, cannibalization, etc.)
 * @query   siteUrl - The GSC property URL
 * @access  Private
 */
router.get('/data/:metric', getMetricData);

module.exports = router;
