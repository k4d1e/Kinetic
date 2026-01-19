// routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  initializeAuth,
  handleAuthSuccess,
  handleAuthFailure,
  getAuthStatus,
  logout
} = require('../controllers/authController');

// Initialize auth strategy with database pool
router.use((req, res, next) => {
  if (!req.app.locals.authInitialized) {
    initializeAuth(req.app.locals.pool);
    req.app.locals.authInitialized = true;
  }
  next();
});

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', 
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })
);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    session: true
  }),
  handleAuthSuccess
);

/**
 * @route   GET /auth/failure
 * @desc    Authentication failure handler
 * @access  Public
 */
router.get('/failure', handleAuthFailure);

/**
 * @route   GET /auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', getAuthStatus);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', logout);

module.exports = router;
