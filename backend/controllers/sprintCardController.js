// controllers/sprintCardController.js - Sprint Card controller
const {
  saveCompletedCard,
  getCompletedCards,
  getCompletedCardDetails,
  getSprintProgress
} = require('../services/sprintService');

const { analyzeLoomsGap } = require('../services/ahrefsLinkIntersectService');

/**
 * Save completed sprint card
 * @route POST /api/sprint-cards/complete
 */
async function saveCompletion(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const completionData = req.body;
    
    // Validate required fields
    if (!completionData.cardType || !completionData.propertyId || completionData.sprintIndex === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: cardType, propertyId, sprintIndex'
      });
    }
    
    const result = await saveCompletedCard(pool, userId, completionData.propertyId, completionData);
    
    res.json({
      success: true,
      message: 'Sprint card completion saved successfully',
      cardId: result.cardId
    });
  } catch (error) {
    console.error('Error saving completed card:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save sprint card completion'
    });
  }
}

/**
 * Get completed cards history
 * @route GET /api/sprint-cards/history
 * @query propertyId - Optional property filter
 */
async function getHistory(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId) : null;
    
    const cards = await getCompletedCards(pool, userId, propertyId);
    
    res.json({
      success: true,
      cards
    });
  } catch (error) {
    console.error('Error fetching completed cards:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch card history'
    });
  }
}

/**
 * Get specific card details with all steps
 * @route GET /api/sprint-cards/:cardId
 */
async function getCardDetails(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const cardId = parseInt(req.params.cardId);
    
    if (isNaN(cardId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid card ID'
      });
    }
    
    const cardDetails = await getCompletedCardDetails(pool, cardId, userId);
    
    if (!cardDetails) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Card not found or access denied'
      });
    }
    
    res.json({
      success: true,
      card: cardDetails
    });
  } catch (error) {
    console.error('Error fetching card details:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch card details'
    });
  }
}

/**
 * Generate Loom's Gap Analysis for a property
 * @route POST /api/sprint-cards/looms-gap
 * @body propertyId - GSC property ID
 * @body refresh - Optional: force refresh analysis (default: false)
 * @body country - Optional: country code for competitor discovery (default: 'us')
 */
async function generateLoomsGap(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const { propertyId, refresh = false, country = 'us', competitors = [] } = req.body;
    
    // Validate required fields
    if (!propertyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: propertyId'
      });
    }
    
    // Get property URL
    const propertyResult = await pool.query(
      'SELECT site_url FROM gsc_properties WHERE id = $1 AND user_id = $2',
      [propertyId, userId]
    );
    
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Property not found or access denied'
      });
    }
    
    const siteUrl = propertyResult.rows[0].site_url;
    
    // Log manual competitors if provided
    if (competitors.length > 0) {
      console.log(`📋 Manual competitors provided: ${competitors.length}`);
      console.log(`   Competitors: ${competitors.join(', ')}`);
    }
    
    // Check cache first (unless refresh requested or manual competitors provided)
    // Skip cache if manual competitors are provided since they might be different
    if (!refresh && competitors.length === 0) {
      const cacheResult = await pool.query(
        `SELECT * FROM looms_gap_cache 
         WHERE property_id = $1 AND expires_at > NOW()`,
        [propertyId]
      );
      
      if (cacheResult.rows.length > 0) {
        console.log(`✓ Returning cached Loom's Gap Analysis for ${siteUrl}`);
        const cached = cacheResult.rows[0];
        return res.json({
          success: true,
          cached: true,
          data: {
            userDomain: cached.user_domain,
            competitors: cached.competitors,
            gapDomains: cached.gap_domains,
            threadResonanceScores: cached.thread_resonance_scores,
            totalGaps: cached.total_gaps,
            highAuthorityGaps: cached.high_authority_gaps,
            threadStarvation: cached.thread_starvation,
            analyzedAt: cached.analyzed_at
          }
        });
      }
    }
    
    // Run fresh analysis with manual competitors
    console.log(`🧵 Running fresh Loom's Gap Analysis for ${siteUrl}...`);
    const analysisResult = await analyzeLoomsGap(siteUrl, country, competitors);
    
    if (!analysisResult.success) {
      return res.status(500).json({
        error: 'Analysis Failed',
        message: analysisResult.error || 'Failed to complete Loom\'s Gap Analysis'
      });
    }
    
    // Cache results (expire in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await pool.query(
      `INSERT INTO looms_gap_cache 
       (property_id, user_domain, competitors, gap_domains, thread_resonance_scores, 
        thread_starvation, total_gaps, high_authority_gaps, analyzed_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
       ON CONFLICT (property_id) 
       DO UPDATE SET
         user_domain = EXCLUDED.user_domain,
         competitors = EXCLUDED.competitors,
         gap_domains = EXCLUDED.gap_domains,
         thread_resonance_scores = EXCLUDED.thread_resonance_scores,
         thread_starvation = EXCLUDED.thread_starvation,
         total_gaps = EXCLUDED.total_gaps,
         high_authority_gaps = EXCLUDED.high_authority_gaps,
         analyzed_at = NOW(),
         expires_at = EXCLUDED.expires_at`,
      [
        propertyId,
        analysisResult.userDomain,
        JSON.stringify(analysisResult.competitors),
        JSON.stringify(analysisResult.gapDomains),
        JSON.stringify(analysisResult.threadResonanceScores),
        analysisResult.threadStarvation,
        analysisResult.totalGaps,
        analysisResult.highAuthorityGaps,
        expiresAt
      ]
    );
    
    console.log(`✓ Cached Loom's Gap Analysis results (expires: ${expiresAt.toISOString()})`);
    
    res.json({
      success: true,
      cached: false,
      data: {
        userDomain: analysisResult.userDomain,
        competitors: analysisResult.competitors,
        gapDomains: analysisResult.gapDomains,
        threadResonanceScores: analysisResult.threadResonanceScores,
        totalGaps: analysisResult.totalGaps,
        highAuthorityGaps: analysisResult.highAuthorityGaps,
        threadStarvation: analysisResult.threadStarvation,
        analyzedAt: new Date().toISOString(),
        elapsedSeconds: analysisResult.elapsedSeconds
      }
    });
  } catch (error) {
    console.error('Error generating Loom\'s Gap Analysis:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate Loom\'s Gap Analysis',
      details: error.message
    });
  }
}

/**
 * Get sprint progress for a property
 * @route GET /api/sprint-cards/progress
 * @query propertyId - Required property ID
 */
async function getProgress(req, res) {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId) : null;
    
    if (!propertyId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameter: propertyId'
      });
    }
    
    const progress = await getSprintProgress(pool, userId, propertyId);
    
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error fetching sprint progress:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch sprint progress'
    });
  }
}

module.exports = {
  saveCompletion,
  getHistory,
  getCardDetails,
  generateLoomsGap,
  getProgress
};
