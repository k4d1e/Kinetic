// services/sprintService.js - Sprint Card persistence service

/**
 * Save a completed sprint card with all step details
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {number} propertyId - GSC property ID
 * @param {Object} completionData - Card completion data
 * @returns {Promise<Object>} - Success status and card ID
 */
async function saveCompletedCard(pool, userId, propertyId, completionData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get card type ID
    const cardTypeResult = await client.query(
      'SELECT id FROM sprint_action_cards WHERE card_type = $1',
      [completionData.cardType]
    );
    
    if (cardTypeResult.rows.length === 0) {
      throw new Error(`Invalid card type: ${completionData.cardType}`);
    }
    
    const cardTypeId = cardTypeResult.rows[0].id;
    
    // Insert completed card record
    const cardResult = await client.query(
      `INSERT INTO completed_sprint_cards 
       (user_id, property_id, card_type_id, sprint_index, started_at, completed_at, duration_ms, progress_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        propertyId,
        cardTypeId,
        completionData.sprintIndex,
        completionData.startedAt,
        completionData.completedAt,
        completionData.duration,
        completionData.progressPercentage || 95
      ]
    );
    
    const completedCardId = cardResult.rows[0].id;
    
    // Insert individual steps
    if (completionData.steps && completionData.steps.length > 0) {
      for (const step of completionData.steps) {
        await client.query(
          `INSERT INTO sprint_card_steps 
           (completed_card_id, step_number, step_name, step_description, completed_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            completedCardId,
            step.stepNumber,
            step.name,
            step.description || null,
            step.completedAt
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`✓ Sprint card saved: ID ${completedCardId}, User ${userId}, Sprint ${completionData.sprintIndex}`);
    
    return { success: true, cardId: completedCardId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving completed card:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all completed cards for a user
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {number|null} propertyId - Optional GSC property ID filter
 * @returns {Promise<Array>} - List of completed cards with summary data
 */
async function getCompletedCards(pool, userId, propertyId = null) {
  try {
    const query = `
      SELECT 
        csc.id,
        csc.sprint_index,
        csc.started_at,
        csc.completed_at,
        csc.duration_ms,
        csc.progress_percentage,
        sac.card_type,
        sac.display_name,
        sac.total_steps,
        sac.description,
        gp.site_url,
        COUNT(scs.id) as completed_steps_count
      FROM completed_sprint_cards csc
      JOIN sprint_action_cards sac ON csc.card_type_id = sac.id
      LEFT JOIN gsc_properties gp ON csc.property_id = gp.id
      LEFT JOIN sprint_card_steps scs ON scs.completed_card_id = csc.id
      WHERE csc.user_id = $1
      ${propertyId ? 'AND csc.property_id = $2' : ''}
      GROUP BY csc.id, sac.id, gp.site_url
      ORDER BY csc.completed_at DESC
    `;
    
    const params = propertyId ? [userId, propertyId] : [userId];
    const result = await pool.query(query, params);
    
    console.log(`✓ Fetched ${result.rows.length} completed cards for user ${userId}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching completed cards:', error);
    throw error;
  }
}

/**
 * Get detailed view of a specific completed card with all steps
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} cardId - Completed card ID
 * @param {number} userId - User ID (for security validation)
 * @returns {Promise<Object|null>} - Card details with steps array, or null if not found
 */
async function getCompletedCardDetails(pool, cardId, userId) {
  const client = await pool.connect();
  
  try {
    // Get card details
    const cardResult = await client.query(
      `SELECT 
        csc.*,
        sac.card_type,
        sac.display_name,
        sac.description,
        sac.total_steps,
        gp.site_url
       FROM completed_sprint_cards csc
       JOIN sprint_action_cards sac ON csc.card_type_id = sac.id
       LEFT JOIN gsc_properties gp ON csc.property_id = gp.id
       WHERE csc.id = $1 AND csc.user_id = $2`,
      [cardId, userId]
    );
    
    if (cardResult.rows.length === 0) {
      console.log(`Card not found or access denied: ID ${cardId}, User ${userId}`);
      return null;
    }
    
    // Get all steps for this card
    const stepsResult = await client.query(
      `SELECT * FROM sprint_card_steps 
       WHERE completed_card_id = $1 
       ORDER BY step_number`,
      [cardId]
    );
    
    const cardDetails = {
      ...cardResult.rows[0],
      steps: stepsResult.rows
    };
    
    console.log(`✓ Fetched details for card ${cardId} with ${stepsResult.rows.length} steps`);
    
    return cardDetails;
  } catch (error) {
    console.error('Error fetching card details:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  saveCompletedCard,
  getCompletedCards,
  getCompletedCardDetails
};
