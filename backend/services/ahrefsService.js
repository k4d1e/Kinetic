// services/ahrefsService.js - Ahrefs API integration for keyword metrics

/**
 * Get keyword difficulty (KD) from Ahrefs
 * @param {string} keyword - The keyword to check
 * @param {string} country - Country code (e.g., 'us')
 * @returns {Promise<number>} - Keyword Difficulty (0-100)
 */
async function getKeywordDifficulty(keyword, country = 'us') {
    try {
      const AHREFS_API_TOKEN = process.env.AHREFS_API_TOKEN;
    
      if (!AHREFS_API_TOKEN) {
        console.warn('⚠️  AHREFS_API_TOKEN not set');
        return null;
      }

      // Using Ahrefs API v3
      const response = await fetch(
        `https://api.ahrefs.com/v3/keywords-explorer/overview?select=keyword_difficulty&keyword=${encodeURIComponent(keyword)}&country=${country}`,
        {
          headers: {
            'Authorization': `Bearer ${AHREFS_API_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`Ahrefs API returned ${response.status}`);
      }
  
      const data = await response.json();
      // The response structure might be data.keyword_difficulty or data[0]?.keyword_difficulty
      const kd = data?.keyword_difficulty ?? data?.[0]?.keyword_difficulty ?? null;
      return kd;
  
    } catch (error) {
      console.error(`Error fetching KD for "${keyword}":`, error.message);
      return null;
    }
  }
  
  /**
   * Enrich quick wins with Ahrefs keyword difficulty data
   * @param {Array} quickWins - Array of quick win opportunities
   * @returns {Promise<Array>} - Enriched data with KD
   */
  async function enrichWithKeywordDifficulty(quickWins) {
    console.log(`🔍 Enriching ${quickWins.length} keywords with Ahrefs KD data...`);
    
    const enrichedData = await Promise.all(
      quickWins.map(async (item) => {
        const kd = await getKeywordDifficulty(item.keyword);
        return {
          ...item,
          keywordDifficulty: kd
        };
      })
    );
  
    // Filter for KD < 40
    const filtered = enrichedData.filter(item => 
      item.keywordDifficulty !== null && item.keywordDifficulty < 40
    );
    
    console.log(`✅ After KD < 40 filter: ${filtered.length} opportunities remain`);
    console.log(`❌ Filtered out: ${quickWins.length - filtered.length} keywords with KD ≥ 40 or null`);
    
    return filtered;
  }
  
  module.exports = {
    getKeywordDifficulty,
    enrichWithKeywordDifficulty
  };