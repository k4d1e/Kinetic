// controllers/authController.js - Authentication controller
const { configureGoogleAuth } = require('../services/googleAuth');

/**
 * Initialize Google OAuth strategy
 */
function initializeAuth(pool) {
  configureGoogleAuth(pool);
}

/**
 * Handle successful authentication
 */
function handleAuthSuccess(req, res) {
  // Redirect back to frontend with success parameter
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  res.redirect(`${frontendUrl}?auth=success`);
}

/**
 * Handle authentication failure
 */
function handleAuthFailure(req, res) {
  // Redirect back to frontend with failure parameter
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  res.redirect(`${frontendUrl}?auth=failure`);
}

/**
 * Get authentication status
 */
function getAuthStatus(req, res) {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profile_picture
      }
    });
  } else {
    res.json({
      authenticated: false
    });
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  const userId = req.user?.id;
  
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: err.message
      });
    }
    
    // Clear tokens from database if we have a user ID
    if (userId && req.app.locals.pool) {
      req.app.locals.pool.query(
        'UPDATE users SET access_token = NULL, refresh_token = NULL, token_expiry = NULL WHERE id = $1',
        [userId]
      ).catch(err => {
        console.error('Error clearing tokens on logout:', err);
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

module.exports = {
  initializeAuth,
  handleAuthSuccess,
  handleAuthFailure,
  getAuthStatus,
  logout
};
