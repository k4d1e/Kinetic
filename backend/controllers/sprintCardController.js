// controllers/sprintCardController.js - Sprint Card controller
const {
  saveCompletedCard,
  getCompletedCards,
  getCompletedCardDetails
} = require('../services/sprintService');

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

module.exports = {
  saveCompletion,
  getHistory,
  getCardDetails
};
