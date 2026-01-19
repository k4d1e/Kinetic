// middleware/authMiddleware.js - Authentication middleware

/**
 * Middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Please sign in to access this resource'
  });
}

/**
 * Middleware to optionally attach user if authenticated
 */
function optionalAuth(req, res, next) {
  // Just continue regardless of auth status
  next();
}

/**
 * Middleware to check if user has access to a specific GSC property
 */
async function requirePropertyAccess(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please sign in to access this resource'
    });
  }

  const siteUrl = req.body.siteUrl || req.params.siteUrl || req.query.siteUrl;
  
  if (!siteUrl) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Site URL is required'
    });
  }

  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM gsc_properties WHERE user_id = $1 AND site_url = $2',
      [req.user.id, siteUrl]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this property'
      });
    }

    // Attach property to request
    req.property = result.rows[0];
    next();
  } catch (error) {
    console.error('Error checking property access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify property access'
    });
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  requirePropertyAccess
};
