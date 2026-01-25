// routes/gsc.js - Google Search Console API routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getProperties,
  startCalibration,
  getAnalytics,
  getMetricData,
  getUserLastSelectedProperty,
  getCalibrationCards,
  hasCalibration
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

/**
 * @route   GET /api/gsc/last-selected-property
 * @desc    Get user's last selected property
 * @access  Private
 */
router.get('/last-selected-property', getUserLastSelectedProperty);

/**
 * @route   GET /api/gsc/calibration-cards
 * @desc    Get calibration cards from database
 * @query   siteUrl - The GSC property URL
 * @access  Private
 */
router.get('/calibration-cards', getCalibrationCards);

/**
 * @route   GET /api/gsc/has-calibration
 * @desc    Check if calibration exists for a property
 * @query   siteUrl - The GSC property URL
 * @access  Private
 */
router.get('/has-calibration', hasCalibration);

module.exports = router;
