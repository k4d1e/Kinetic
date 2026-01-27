// routes/sprintCards.js - Sprint Card API routes
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
  saveCompletion,
  getHistory,
  getCardDetails,
  generateLoomsGap,
  getProgress
} = require('../controllers/sprintCardController');

// All sprint card routes require authentication
router.use(requireAuth);

/**
 * @route   POST /api/sprint-cards/complete
 * @desc    Save completed sprint card with step details
 * @access  Private
 */
router.post('/complete', saveCompletion);

/**
 * @route   GET /api/sprint-cards/history
 * @desc    Get user's completed sprint cards
 * @query   propertyId - Optional property filter
 * @access  Private
 */
router.get('/history', getHistory);

/**
 * @route   POST /api/sprint-cards/looms-gap
 * @desc    Generate Loom's Gap Analysis (competitor backlink gaps)
 * @body    propertyId, refresh (optional), country (optional)
 * @access  Private
 */
router.post('/looms-gap', generateLoomsGap);

/**
 * @route   GET /api/sprint-cards/progress
 * @desc    Get sprint progress for a property (which circles are completed)
 * @query   propertyId - Required property ID
 * @access  Private
 */
router.get('/progress', getProgress);

/**
 * @route   GET /api/sprint-cards/:cardId
 * @desc    Get detailed view of specific completed card
 * @access  Private
 */
router.get('/:cardId', getCardDetails);

module.exports = router;
