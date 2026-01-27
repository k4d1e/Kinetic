// controllers/gscController.js - Google Search Console controller
const {
  fetchUserProperties,
  fetchSearchAnalytics,
  analyzeQuickWins,
  analyzeCannibalization,
  analyzeUntappedMarkets,
  analyzeAIVisibility,
  analyzeLocalSEO,
  getCachedOrFetch,
  saveLastSelectedProperty,
  getLastSelectedProperty
} = require('../services/gscService');

const {
  saveCalibrationCards,
  getLatestCalibration,
  hasExistingCalibration
} = require('../services/calibrationService');

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
    let propertyResult = await pool.query(
      'SELECT id FROM gsc_properties WHERE user_id = $1 AND site_url = $2',
      [userId, siteUrl]
    );

    // If property not found in database, fetch and save properties from GSC
    if (propertyResult.rows.length === 0) {
      console.log('⚠️  Property not found in database, fetching from GSC...');
      try {
        await fetchUserProperties(pool, userId);
        // Try again after fetching
        propertyResult = await pool.query(
          'SELECT id FROM gsc_properties WHERE user_id = $1 AND site_url = $2',
          [userId, siteUrl]
        );
        
        if (propertyResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'This property was not found in your Google Search Console account. Please verify you have access to this property in GSC.'
          });
        }
      } catch (fetchError) {
        console.error('Error fetching properties:', fetchError);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to verify property access. Please try refreshing the property list.'
        });
      }
    }

    const propertyId = propertyResult.rows[0].id;

    // Save as last selected property
    await saveLastSelectedProperty(pool, userId, siteUrl, propertyId);

    // Check if calibration already exists
    const calibrationExists = await hasExistingCalibration(pool, userId, propertyId);

    if (calibrationExists) {
      console.log('✓ Using existing calibration from database');
      return res.json({
        success: true,
        message: 'Using existing calibration',
        fromCache: true,
        propertyId,
        siteUrl
      });
    }

    // No existing calibration - start fresh
    res.json({
      success: true,
      message: 'Calibration started',
      fromCache: false,
      propertyId,
      siteUrl
    });

    // Note: The actual analysis runs in the frontend checklist flow
    // and saves via getMetricData endpoints
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
    
    // Check if calibration exists and refresh is not forced
    const calibrationExists = await hasExistingCalibration(pool, userId, propertyId);
    
    if (calibrationExists && refresh !== 'true') {
      console.log(`📦 Returning ${metric} from database calibration`);
      const calibrationData = await getLatestCalibration(pool, userId, propertyId);
      
      // Map metric to calibration data
      let data;
      switch (metric) {
        case 'quick-wins':
          data = calibrationData.quickWins;
          break;
        case 'cannibalization':
          data = calibrationData.cannibalization;
          break;
        case 'untapped-markets':
          data = calibrationData.untappedMarkets;
          break;
        case 'ai-visibility':
          data = calibrationData.aiVisibility;
          break;
        case 'local-seo':
          data = calibrationData.localSEO;
          break;
        default:
          return res.status(400).json({
            error: 'Bad Request',
            message: `Unknown metric type: ${metric}`
          });
      }
      
      return res.json({
        success: true,
        metric,
        siteUrl,
        fromDatabase: true,
        data
      });
    }
    
    // Check if cache refresh is requested or first time calibration
    if (refresh === 'true') {
      console.log('🔄 Cache refresh requested - clearing cache for', metric);
      await pool.query(
        'DELETE FROM gsc_analytics_cache WHERE property_id = $1 AND metric_type = $2',
        [propertyId, metric === 'quick-wins' ? 'quick_wins' : metric]
      );
    }
    
    let data;
    const moduleDataForSave = {};

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
        moduleDataForSave.quickWins = data;
        break;

      case 'cannibalization':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'cannibalization',
          () => analyzeCannibalization(pool, userId, siteUrl)
        );
        moduleDataForSave.cannibalization = data;
        break;

      case 'untapped-markets':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'untapped-markets',
          () => analyzeUntappedMarkets(pool, userId, siteUrl)
        );
        moduleDataForSave.untappedMarkets = data;
        break;

      case 'ai-visibility':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'ai-visibility',
          () => analyzeAIVisibility(pool, userId, siteUrl)
        );
        moduleDataForSave.aiVisibility = data;
        break;

      case 'local-seo':
        data = await getCachedOrFetch(
          pool,
          propertyId,
          'local-seo',
          () => analyzeLocalSEO(pool, userId, siteUrl)
        );
        moduleDataForSave.localSEO = data;
        break;

      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Unknown metric type: ${metric}`
        });
    }
    
    // Save this module's data to calibration (will merge with other modules)
    // This allows incremental building as each module loads
    try {
      // Get existing calibration data
      const existingCalibration = await getLatestCalibration(pool, userId, propertyId);
      
      // Merge with new data
      const mergedData = {
        quickWins: existingCalibration?.quickWins || [],
        cannibalization: existingCalibration?.cannibalization || [],
        untappedMarkets: existingCalibration?.untappedMarkets || [],
        aiVisibility: existingCalibration?.aiVisibility || [],
        localSEO: existingCalibration?.localSEO || [],
        ...moduleDataForSave
      };
      
      // Save merged data
      await saveCalibrationCards(pool, userId, propertyId, mergedData);
    } catch (saveError) {
      console.error('Error saving calibration cards:', saveError);
      // Don't fail the request if save fails
    }

    res.json({
      success: true,
      metric,
      siteUrl,
      fromDatabase: false,
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

/**
 * Get user's last selected property
 */
async function getUserLastSelectedProperty(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    
    const preference = await getLastSelectedProperty(pool, userId);
    
    res.json({
      success: true,
      lastSelectedProperty: preference
    });
  } catch (error) {
    console.error('Error fetching last selected property:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch preference'
    });
  }
}

/**
 * Get calibration cards from database
 */
async function getCalibrationCards(req, res) {
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

    // Get calibration data
    const calibrationData = await getLatestCalibration(pool, userId, propertyId);

    if (!calibrationData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No calibration data found for this property'
      });
    }

    res.json({
      success: true,
      siteUrl,
      cards: calibrationData
    });
  } catch (error) {
    console.error('Error fetching calibration cards:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch calibration cards'
    });
  }
}

/**
 * Check if calibration exists
 */
async function hasCalibration(req, res) {
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

    // Check if calibration exists
    const exists = await hasExistingCalibration(pool, userId, propertyId);

    res.json({
      success: true,
      exists,
      propertyId
    });
  } catch (error) {
    console.error('Error checking calibration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check calibration'
    });
  }
}

module.exports = {
  getProperties,
  startCalibration,
  getAnalytics,
  getMetricData,
  getUserLastSelectedProperty,
  getCalibrationCards,
  hasCalibration
};
