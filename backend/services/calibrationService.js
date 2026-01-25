// services/calibrationService.js - Calibration card persistence service

/**
 * Save calibration cards for all modules
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {number} propertyId - GSC property ID
 * @param {Object} moduleDataMap - Object with module data arrays: { quickWins: [...], cannibalization: [...], ... }
 * @returns {Promise<Object>} - Success status and session ID
 */
async function saveCalibrationCards(pool, userId, propertyId, moduleDataMap) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if calibration session already exists
    const existingSession = await client.query(
      'SELECT id FROM calibration_sessions WHERE user_id = $1 AND property_id = $2',
      [userId, propertyId]
    );
    
    let sessionId;
    
    if (existingSession.rows.length > 0) {
      // Update existing session
      sessionId = existingSession.rows[0].id;
      
      // Delete old cards
      await client.query(
        'DELETE FROM module_cards WHERE calibration_session_id = $1',
        [sessionId]
      );
      
      // Update session timestamp
      await client.query(
        'UPDATE calibration_sessions SET calibrated_at = NOW(), total_cards_generated = $1 WHERE id = $2',
        [0, sessionId] // Will update count below
      );
      
      console.log(`🔄 Updating existing calibration session: ${sessionId}`);
    } else {
      // Create new calibration session
      const sessionResult = await client.query(
        `INSERT INTO calibration_sessions (user_id, property_id, total_cards_generated)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, propertyId, 0] // Will update count below
      );
      
      sessionId = sessionResult.rows[0].id;
      console.log(`✓ Created new calibration session: ${sessionId}`);
    }
    
    // Get module type IDs
    const moduleTypes = await client.query(
      'SELECT id, module_name FROM module_card_types'
    );
    
    const moduleTypeMap = {};
    moduleTypes.rows.forEach(row => {
      moduleTypeMap[row.module_name] = row.id;
    });
    
    let totalCards = 0;
    
    // Insert cards for each module
    const modules = [
      { name: 'quick_wins', data: moduleDataMap.quickWins || [] },
      { name: 'cannibalization', data: moduleDataMap.cannibalization || [] },
      { name: 'untapped_markets', data: moduleDataMap.untappedMarkets || [] },
      { name: 'ai_visibility', data: moduleDataMap.aiVisibility || [] },
      { name: 'local_seo', data: moduleDataMap.localSEO || [] }
    ];
    
    for (const module of modules) {
      const moduleTypeId = moduleTypeMap[module.name];
      
      if (!moduleTypeId) {
        console.warn(`⚠️  Module type not found: ${module.name}`);
        continue;
      }
      
      // Insert each card
      for (let i = 0; i < module.data.length; i++) {
        const card = module.data[i];
        
        await client.query(
          `INSERT INTO module_cards (calibration_session_id, module_card_type_id, card_data, card_index)
           VALUES ($1, $2, $3, $4)`,
          [sessionId, moduleTypeId, JSON.stringify(card), i]
        );
        
        totalCards++;
      }
      
      if (module.data.length > 0) {
        console.log(`  ✓ Saved ${module.data.length} ${module.name} cards`);
      }
    }
    
    // Update total cards count
    await client.query(
      'UPDATE calibration_sessions SET total_cards_generated = $1 WHERE id = $2',
      [totalCards, sessionId]
    );
    
    await client.query('COMMIT');
    
    console.log(`✓ Calibration saved: Session ${sessionId}, Total ${totalCards} cards`);
    
    return { success: true, sessionId, totalCards };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving calibration cards:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get latest calibration cards for a user + property
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {number} propertyId - GSC property ID
 * @returns {Promise<Object>} - Object with module data: { quickWins: [...], cannibalization: [...], ... }
 */
async function getLatestCalibration(pool, userId, propertyId) {
  try {
    // Get calibration session
    const sessionResult = await pool.query(
      `SELECT id, calibrated_at, total_cards_generated 
       FROM calibration_sessions 
       WHERE user_id = $1 AND property_id = $2
       ORDER BY calibrated_at DESC 
       LIMIT 1`,
      [userId, propertyId]
    );
    
    if (sessionResult.rows.length === 0) {
      console.log(`No calibration found for user ${userId}, property ${propertyId}`);
      return null;
    }
    
    const session = sessionResult.rows[0];
    const sessionId = session.id;
    
    // Get all cards for this session
    const cardsResult = await pool.query(
      `SELECT 
        mc.card_data,
        mc.card_index,
        mct.module_name
       FROM module_cards mc
       JOIN module_card_types mct ON mc.module_card_type_id = mct.id
       WHERE mc.calibration_session_id = $1
       ORDER BY mct.id, mc.card_index`,
      [sessionId]
    );
    
    // Group cards by module
    const moduleData = {
      quickWins: [],
      cannibalization: [],
      untappedMarkets: [],
      aiVisibility: [],
      localSEO: []
    };
    
    cardsResult.rows.forEach(row => {
      const moduleName = row.module_name;
      const cardData = row.card_data;
      
      switch (moduleName) {
        case 'quick_wins':
          moduleData.quickWins.push(cardData);
          break;
        case 'cannibalization':
          moduleData.cannibalization.push(cardData);
          break;
        case 'untapped_markets':
          moduleData.untappedMarkets.push(cardData);
          break;
        case 'ai_visibility':
          moduleData.aiVisibility.push(cardData);
          break;
        case 'local_seo':
          moduleData.localSEO.push(cardData);
          break;
      }
    });
    
    console.log(`✓ Retrieved calibration: Session ${sessionId}, ${session.total_cards_generated} cards`);
    console.log(`  - Quick Wins: ${moduleData.quickWins.length}`);
    console.log(`  - Cannibalization: ${moduleData.cannibalization.length}`);
    console.log(`  - Untapped Markets: ${moduleData.untappedMarkets.length}`);
    console.log(`  - AI Visibility: ${moduleData.aiVisibility.length}`);
    console.log(`  - Local SEO: ${moduleData.localSEO.length}`);
    
    return moduleData;
  } catch (error) {
    console.error('Error fetching calibration cards:', error);
    throw error;
  }
}

/**
 * Check if calibration exists for user + property
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {number} propertyId - GSC property ID
 * @returns {Promise<boolean>} - True if calibration exists
 */
async function hasExistingCalibration(pool, userId, propertyId) {
  try {
    const result = await pool.query(
      `SELECT id FROM calibration_sessions 
       WHERE user_id = $1 AND property_id = $2`,
      [userId, propertyId]
    );
    
    const exists = result.rows.length > 0;
    console.log(`Calibration check for user ${userId}, property ${propertyId}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    return exists;
  } catch (error) {
    console.error('Error checking calibration existence:', error);
    throw error;
  }
}

module.exports = {
  saveCalibrationCards,
  getLatestCalibration,
  hasExistingCalibration
};
