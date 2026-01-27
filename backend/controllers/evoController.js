// controllers/evoController.js - E.V.O. Synthesis Controller

const {
  synthesizeDimensions,
  analyzeSubstrateDimension,
  analyzeLatticeDimension,
  analyzeSynapseDimension,
  analyzeResonanceDimension,
  analyzeWeaveDimension,
  analyzeElixirDimension,
  detectEmergencePatterns,
  generateSystemIntelligence
} = require('../services/evoService');

/**
 * Get E.V.O. Full Synthesis
 * @route GET /api/gsc/evo/synthesis
 */
async function getEVOSynthesis(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { siteUrl, refresh } = req.query;

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

    // Check cache unless refresh requested
    if (refresh !== 'true') {
      const cacheResult = await pool.query(
        `SELECT dimensional_data, emergence_patterns, system_intelligence, analyzed_at 
         FROM evo_analysis_cache 
         WHERE property_id = $1 AND analysis_type = 'full_synthesis' 
         AND expires_at > NOW()`,
        [propertyId]
      );

      if (cacheResult.rows.length > 0) {
        console.log('📦 Returning E.V.O. synthesis from cache');
        return res.json({
          success: true,
          fromCache: true,
          siteUrl,
          analysis: {
            ...cacheResult.rows[0].dimensional_data,
            emergencePatterns: cacheResult.rows[0].emergence_patterns,
            systemIntelligence: cacheResult.rows[0].system_intelligence,
            analyzedAt: cacheResult.rows[0].analyzed_at
          }
        });
      }
    }

    // Perform full synthesis
    console.log('🌟 Performing E.V.O. synthesis...');
    const analysis = await synthesizeDimensions(pool, userId, siteUrl);

    // Cache the results (24 hour expiry)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO evo_analysis_cache 
       (property_id, analysis_type, dimensional_data, emergence_patterns, system_intelligence, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (property_id, analysis_type)
       DO UPDATE SET 
         dimensional_data = $3,
         emergence_patterns = $4,
         system_intelligence = $5,
         analyzed_at = NOW(),
         expires_at = $6`,
      [
        propertyId,
        'full_synthesis',
        JSON.stringify(analysis),
        JSON.stringify(analysis.emergencePatterns),
        JSON.stringify(analysis.systemIntelligence),
        expiresAt
      ]
    );

    res.json({
      success: true,
      fromCache: false,
      siteUrl,
      analysis
    });
  } catch (error) {
    console.error('Error in E.V.O. synthesis:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to perform E.V.O. synthesis'
    });
  }
}

/**
 * Get individual dimensional view
 * @route GET /api/gsc/evo/:dimension
 */
async function getDimensionAnalysis(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { dimension } = req.params;
    const { siteUrl } = req.query;

    if (!siteUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Site URL is required'
      });
    }

    // Verify user has access
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

    // Analyze specific dimension
    let data;
    switch (dimension) {
      case 'substrate':
        data = await analyzeSubstrateDimension(pool, userId, siteUrl);
        break;
      case 'lattice':
        data = await analyzeLatticeDimension(pool, userId, siteUrl);
        break;
      case 'synapse':
        data = await analyzeSynapseDimension(pool, userId, siteUrl);
        break;
      case 'resonance':
        data = await analyzeResonanceDimension(pool, userId, siteUrl);
        break;
      case 'weave':
        data = await analyzeWeaveDimension(siteUrl);
        break;
      case 'elixir':
        data = await analyzeElixirDimension(pool, userId, siteUrl);
        break;
      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Unknown dimension: ${dimension}. Valid: substrate, lattice, synapse, resonance, weave, elixir`
        });
    }

    res.json({
      success: true,
      dimension,
      siteUrl,
      data
    });
  } catch (error) {
    console.error(`Error analyzing ${req.params.dimension}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to analyze dimension'
    });
  }
}

/**
 * Get emergence patterns only
 * @route GET /api/gsc/evo/emergence-patterns
 */
async function getEmergencePatterns(req, res) {
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

    // Verify access
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

    // Check cache
    const cacheResult = await pool.query(
      `SELECT emergence_patterns, analyzed_at 
       FROM evo_analysis_cache 
       WHERE property_id = $1 AND analysis_type = 'full_synthesis' 
       AND expires_at > NOW()`,
      [propertyId]
    );

    if (cacheResult.rows.length > 0) {
      return res.json({
        success: true,
        fromCache: true,
        siteUrl,
        patterns: cacheResult.rows[0].emergence_patterns,
        analyzedAt: cacheResult.rows[0].analyzed_at
      });
    }

    // Need to run full synthesis to get patterns
    const analysis = await synthesizeDimensions(pool, userId, siteUrl);

    res.json({
      success: true,
      fromCache: false,
      siteUrl,
      patterns: analysis.emergencePatterns
    });
  } catch (error) {
    console.error('Error getting emergence patterns:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get emergence patterns'
    });
  }
}

/**
 * Get system intelligence only
 * @route GET /api/gsc/evo/system-intelligence
 */
async function getSystemIntelligence(req, res) {
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

    // Verify access
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

    // Check cache
    const cacheResult = await pool.query(
      `SELECT system_intelligence, analyzed_at 
       FROM evo_analysis_cache 
       WHERE property_id = $1 AND analysis_type = 'full_synthesis' 
       AND expires_at > NOW()`,
      [propertyId]
    );

    if (cacheResult.rows.length > 0) {
      return res.json({
        success: true,
        fromCache: true,
        siteUrl,
        intelligence: cacheResult.rows[0].system_intelligence,
        analyzedAt: cacheResult.rows[0].analyzed_at
      });
    }

    // Need to run full synthesis
    const analysis = await synthesizeDimensions(pool, userId, siteUrl);

    res.json({
      success: true,
      fromCache: false,
      siteUrl,
      intelligence: analysis.systemIntelligence
    });
  } catch (error) {
    console.error('Error getting system intelligence:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get system intelligence'
    });
  }
}

module.exports = {
  getEVOSynthesis,
  getDimensionAnalysis,
  getEmergencePatterns,
  getSystemIntelligence
};
