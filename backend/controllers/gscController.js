// controllers/gscController.js - Google Search Console controller
const {
  fetchUserProperties,
  fetchSearchAnalytics,
  analyzeQuickWins,
  analyzeCannibalization,
  analyzeUntappedMarkets,
  analyzeAIVisibility,
  analyzeLocalSEO,
  getCachedOrFetch
} = require('../services/gscService');

/**
 * Get user's GSC properties
 */
async function getProperties(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;

    const properties = await fetchUserProperties(pool, userId);

    res.json({
      success: true,
      properties: properties.map(site => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel
      }))
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch Search Console properties'
    });
  }
}

/**
 * Start calibration for a property
 */
async function startCalibration(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { siteUrl } = req.body;

    if (!siteUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Site URL is required'
      });
    }

    // Verify user has access to this property
    const propertyResult = await pool.query(
      'SELECT id FROM gsc_properties WHERE user_id = $1 AND site_url = $2',
      [userId, siteUrl]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this property'
      });
    }

    const propertyId = propertyResult.rows[0].id;

    // Start background calibration (in real app, this would be a queue/worker)
    res.json({
      success: true,
      message: 'Calibration started',
      propertyId,
      siteUrl
    });

    // Note: The actual analysis runs in the frontend checklist flow
    // Real implementation would use a job queue (Bull, etc.)
  } catch (error) {
    console.error('Error starting calibration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start calibration'
    });
  }
}

/**
 * Get search analytics data
 */
async function getAnalytics(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { siteUrl } = req.query;

    if (!siteUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Site URL is required'
      });
    }

    const data = await fetchSearchAnalytics(pool, userId, siteUrl);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch analytics'
    });
  }
}

/**
 * Get specific metric data
 */
async function getMetricData(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { metric } = req.params;
    const { siteUrl, refresh } = req.query;

    if (!siteUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Site URL is required'
      });
    }

    // Get property ID
    const propertyResult = await pool.query(
      'SELECT id FROM gsc_properties WHERE user_id = $1 AND site_url = $2',
      [userId, siteUrl]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this property'
      });
    }

    const propertyId = propertyResult.rows[0].id;
    
    // Check if cache refresh is requested
    if (refresh === 'true') {
      console.log('🔄 Cache refresh requested - clearing cache for', metric);
      await pool.query(
        'DELETE FROM gsc_analytics_cache WHERE property_id = $1 AND metric_type = $2',
        [propertyId, metric === 'quick-wins' ? 'quick_wins' : metric]
      );
    }
    
    let data;

    // Fetch data based on metric type
    switch (metric) {
      case 'quick-wins':
        const rawQuickWins = await getCachedOrFetch(
          pool,
          propertyId,
          'quick_wins',
          () => analyzeQuickWins(pool, userId, siteUrl)
        );
        
        // Check if we should skip Ahrefs enrichment (for testing)
        const skipAhrefs = process.env.SKIP_AHREFS_FILTER === 'true';
        
        if (skipAhrefs) {
          console.log('⚠️  Skipping Ahrefs KD filtering (SKIP_AHREFS_FILTER=true)');
          // Add mock KD values for testing
          data = rawQuickWins.map(item => ({
            ...item,
            keywordDifficulty: 17 // Mock KD value
          }));
        } else {
          // Enrich with Ahrefs KD data
          const { enrichWithKeywordDifficulty } = require('../services/ahrefsService');
          data = await enrichWithKeywordDifficulty(rawQuickWins);
        }
        break;

      case 'cannibalization':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'cannibalization',
          () => analyzeCannibalization(pool, userId, siteUrl)
        );
        break;

      case 'untapped-markets':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'untapped-markets',
          () => analyzeUntappedMarkets(pool, userId, siteUrl)
        );
        break;

      case 'ai-visibility':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'ai-visibility',
          () => analyzeAIVisibility(pool, userId, siteUrl)
        );
        break;

      case 'local-seo':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'local-seo',
          () => analyzeLocalSEO(pool, userId, siteUrl)
        );
        break;

      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Unknown metric type: ${metric}`
        });
    }

    res.json({
      success: true,
      metric,
      siteUrl,
      data
    });
  } catch (error) {
    console.error(`Error fetching metric ${req.params.metric}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch metric data'
    });
  }
}

module.exports = {
  getProperties,
  startCalibration,
  getAnalytics,
  getMetricData
};
