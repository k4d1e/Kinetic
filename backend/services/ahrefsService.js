// services/ahrefsService.js - Ahrefs API integration for keyword metrics

/**
 * Get keyword difficulty (KD) from Ahrefs
 * @param {string} keyword - The keyword to check
 * @param {string} country - Country code (e.g., 'us')
 * @returns {Promise<number>} - Keyword Difficulty (0-100)
 */
async function getKeywordDifficulty(keyword, country = 'us') {
    try {
      // Option 1: Using Ahrefs MCP Server (if available)
      // This assumes you have Ahrefs MCP server running
      const mcpResponse = await fetch('http://localhost:3001/ahrefs/keyword-difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, country })
      });
  
      if (!mcpResponse.ok) {
        throw new Error('Failed to fetch KD from Ahrefs MCP');
      }
  
      const data = await mcpResponse.json();
      return data.keyword_difficulty || 0;
  
      // Option 2: Direct Ahrefs API (if you have API key)
      // const response = await fetch(
      //   `https://apiv2.ahrefs.com?from=keyword_difficulty&target=${encodeURIComponent(keyword)}&mode=exact&country=${country}&token=YOUR_API_KEY`
      // );
      // const data = await response.json();
      // return data.keyword_difficulty || 0;
  
    } catch (error) {
      console.error(`Error fetching KD for "${keyword}":`, error.message);
      return null; // Return null if KD fetch fails
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