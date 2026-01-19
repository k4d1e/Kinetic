// services/gscService.js - Google Search Console API wrapper
const { google } = require('googleapis');
const { getOAuth2Client } = require('./googleAuth');

/**
 * Fetch user's GSC properties
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - List of GSC properties
 */
async function fetchUserProperties(pool, userId) {
  try {
    const oauth2Client = await getOAuth2Client(pool, userId);
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

    // Fetch sites from GSC
    const response = await webmasters.sites.list();
    const sites = response.data.siteEntry || [];

    // Store/update properties in database
    for (const site of sites) {
      await pool.query(
        `INSERT INTO gsc_properties (user_id, site_url, permission_level, last_synced)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, site_url) 
         DO UPDATE SET permission_level = $3, last_synced = NOW()`,
        [userId, site.siteUrl, site.permissionLevel]
      );
    }

    console.log(`✓ Fetched ${sites.length} GSC properties for user ${userId}`);
    return sites;
  } catch (error) {
    console.error('Error fetching GSC properties:', error.message);
    throw new Error('Failed to fetch Search Console properties');
  }
}

/**
 * Fetch search analytics data for a property
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @param {Object} options - Query options (startDate, endDate, dimensions, etc.)
 * @returns {Promise<Object>} - Search analytics data
 */
async function fetchSearchAnalytics(pool, userId, siteUrl, options = {}) {
  try {
    const oauth2Client = await getOAuth2Client(pool, userId);
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

    const {
      startDate = getDateDaysAgo(90),
      endDate = getDateDaysAgo(1),
      dimensions = ['query', 'page'],
      rowLimit = 1000,
      dataState = 'all'
    } = options;

    const response = await webmasters.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        dataState
      }
    });

    console.log(`✓ Fetched search analytics for ${siteUrl}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching search analytics:', error.message);
    throw new Error('Failed to fetch search analytics data');
  }
}

/**
 * Analyze data for "Quick Win" opportunities
 * Criteria: Position 6-20, ≥30 impressions (28 days), KD < 40
 */
async function analyzeQuickWins(pool, userId, siteUrl) {
  try {
    // Fetch last 28 days of data
    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      startDate: getDateDaysAgo(28),
      endDate: getDateDaysAgo(1),
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    // Log raw data stats
    console.log(`📊 Total GSC rows fetched: ${data.rows.length}`);
    
    // Filter for position 6-20 with at least 30 impressions
    const quickWins = data.rows
      .filter(row => {
        const position = row.position;
        const impressions = row.impressions;
        return position >= 6.0 && position <= 20.0 && impressions >= 10;
      })
      .sort((a, b) => b.impressions - a.impressions) // sort by highest number of impressions
      .slice(0, 50) // Limit to top 50 opportunities
      .map(row => ({
        keyword: row.keys[0],
        page: row.keys[1],
        position: parseFloat(row.position.toFixed(1)),
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: (row.ctr * 100).toFixed(2) + '%',
        needsKD: true // Flag to fetch KD from Ahrefs
      }));

    console.log(`✓ Found ${quickWins.length} keywords matching position 6-20 with ≥30 impressions`);
    console.log(`📈 Before KD filtering: ${quickWins.length} opportunities`);
    return quickWins;
  } catch (error) {
    console.error('Error analyzing quick wins:', error);
    return [];
  }
}

/**
 * Analyze keyword cannibalization risks
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - Cannibalization issues
 */
async function analyzeCannibalization(pool, userId, siteUrl) {
  try {
    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    // Group by keyword and find multiple competing pages
    const keywordPages = {};
    data.rows.forEach(row => {
      const keyword = row.keys[0];
      const page = row.keys[1];
      
      if (!keywordPages[keyword]) {
        keywordPages[keyword] = [];
      }
      keywordPages[keyword].push({
        page,
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions
      });
    });

    // Find keywords with multiple pages ranking
    const cannibalization = Object.entries(keywordPages)
      .filter(([keyword, pages]) => pages.length >= 2)
      .map(([keyword, pages]) => ({
        keyword,
        pageCount: pages.length,
        pages: pages.sort((a, b) => a.position - b.position).slice(0, 3)
      }))
      .sort((a, b) => b.pageCount - a.pageCount)
      .slice(0, 30);

    console.log(`✓ Found ${cannibalization.length} cannibalization issues`);
    return cannibalization;
  } catch (error) {
    console.error('Error analyzing cannibalization:', error);
    return [];
  }
}

/**
 * Helper: Get date N days ago in YYYY-MM-DD format
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get cached analytics or fetch fresh data
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} propertyId - GSC property ID
 * @param {string} metricType - Type of metric to fetch
 * @param {Function} fetchFunction - Function to fetch fresh data
 * @returns {Promise<Object>} - Analytics data
 */
async function getCachedOrFetch(pool, propertyId, metricType, fetchFunction) {
  try {
    // Check cache first
    const cacheResult = await pool.query(
      `SELECT data, fetched_at FROM gsc_analytics_cache 
       WHERE property_id = $1 AND metric_type = $2 
       AND expires_at > NOW()`,
      [propertyId, metricType]
    );

    if (cacheResult.rows.length > 0) {
      console.log(`✓ Using cached data for ${metricType}`);
      return cacheResult.rows[0].data;
    }

    // Fetch fresh data
    const freshData = await fetchFunction();

    // Cache for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO gsc_analytics_cache (property_id, metric_type, data, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (property_id, metric_type)
       DO UPDATE SET data = $3, fetched_at = NOW(), expires_at = $4`,
      [propertyId, metricType, JSON.stringify(freshData), expiresAt]
    );

    return freshData;
  } catch (error) {
    console.error('Error in cache operation:', error);
    // If cache fails, just return fresh data
    return await fetchFunction();
  }
}

/**
 * Analyze untapped markets - keywords with demand but no dedicated pages
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - List of untapped market opportunities
 */
async function analyzeUntappedMarkets(pool, userId, siteUrl) {
  try {
    // Get domain from siteUrl for brand filtering
    const domain = siteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const brandName = domain.split('.')[0];

    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      startDate: getDateDaysAgo(28),
      endDate: getDateDaysAgo(0),
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data || !data.rows) {
      console.log('⚠️  No data found for untapped markets analysis');
      return [];
    }

    console.log(`📊 Analyzing ${data.rows.length} total rows for untapped markets`);
    if (data.rows.length > 0) {
      console.log(`📊 Sample GSC data:`, data.rows.slice(0, 3).map(r => ({
        query: r.keys[0],
        impressions: r.impressions,
        position: r.position
      })));
    }

    // Filter for potential untapped markets
    // Criteria: Impressions > 100, Position > 30 (not ranking well), exclude brand/generic
    const filtered = data.rows.filter(row => {
      const impressions = row.impressions || 0;
      const position = row.position || 0;
      const query = (row.keys[0] || '').toLowerCase();
      
      // Basic filters
      if (impressions <= 50 || position <= 10 || position > 50) return false;
      
      // Exclude brand name
      if (query.includes(brandName.toLowerCase())) return false;
      
      // Exclude generic terms unless they have specific modifiers
      const genericTerms = ['contractor', 'company', 'near me', 'in my area'];
      const hasGeneric = genericTerms.some(term => query.includes(term));
      
      // If it has a generic term, it must also have a specific modifier
      if (hasGeneric) {
        const specificModifiers = ['installation', 'repair', 'replacement', 'maintenance', 'service', 'cost', 'price'];
        const hasModifier = specificModifiers.some(mod => query.includes(mod));
        if (!hasModifier) return false;
      }
      
      return true;
    });

    console.log(`✓ ${filtered.length} keywords after filtering (impressions >50, position 11-50, excluded brand/generic)`);
    if (filtered.length > 0) {
      console.log(`📊 Sample filtered keywords:`, filtered.slice(0, 3).map(r => ({
        query: r.keys[0],
        impressions: r.impressions,
        position: r.position
      })));
    }

    // Cluster keywords by topic using simple keyword analysis
    const clusters = clusterKeywords(filtered);
    
    console.log(`✓ Grouped into ${clusters.length} topic clusters`);
    if (clusters.length > 0) {
      console.log(`📊 Cluster details:`, clusters.map(c => `${c.topic}: ${c.keywords.length} keywords`));
    }

    // Calculate potential for each cluster
    const opportunities = clusters.map(cluster => {
      const clusterVolume = cluster.keywords.reduce((sum, kw) => sum + kw.impressions, 0);
      const avgPosition = cluster.keywords.reduce((sum, kw) => sum + kw.position, 0) / cluster.keywords.length;
      
      // Calculate commercial intent
      const highIntentTerms = ['installation', 'repair', 'replacement', 'cost', 'price', 'service', 'install', 'replace'];
      const commercialKeywords = cluster.keywords.filter(kw => 
        highIntentTerms.some(term => kw.keyword.toLowerCase().includes(term))
      );
      const commercialIntentScore = (commercialKeywords.length / cluster.keywords.length) * 100;
      
      // Calculate potential: High (>1000 vol + high intent), Medium (>500 vol OR high intent), Low (rest)
      let potential = 'Low';
      if (clusterVolume > 1000 && commercialIntentScore > 40) {
        potential = 'High';
      } else if (clusterVolume > 500 || commercialIntentScore > 50) {
        potential = 'Medium';
      }
      
      // Get top keywords for the description
      const topKeywords = cluster.keywords
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5)
        .map(kw => kw.keyword);
      
      return {
        topic: cluster.topic,
        keywords: topKeywords,
        allKeywords: cluster.keywords,
        clusterVolume,
        avgPosition: Math.round(avgPosition * 10) / 10,
        commercialIntent: Math.round(commercialIntentScore),
        potential,
        keywordCount: cluster.keywords.length
      };
    });

    // Sort by potential (High > Medium > Low) and cluster volume
    const potentialOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    opportunities.sort((a, b) => {
      const potentialDiff = potentialOrder[b.potential] - potentialOrder[a.potential];
      return potentialDiff !== 0 ? potentialDiff : b.clusterVolume - a.clusterVolume;
    });

    console.log(`✓ Found ${opportunities.length} untapped market opportunities`);
    return opportunities.slice(0, 20); // Return top 20

  } catch (error) {
    console.error('Error analyzing untapped markets:', error);
    return [];
  }
}

/**
 * Cluster keywords by topic using simple NLP-like analysis
 */
function clusterKeywords(keywords) {
  const clusters = [];
  const processed = new Set();
  
  keywords.forEach(row => {
    const keyword = row.keys[0];
    if (processed.has(keyword)) return;
    
    // Extract main topic from keyword (remove common words, find core terms)
    const topic = extractTopic(keyword);
    
    // Find or create cluster
    let cluster = clusters.find(c => c.topic.toLowerCase() === topic.toLowerCase());
    if (!cluster) {
      cluster = { topic, keywords: [] };
      clusters.push(cluster);
    }
    
    cluster.keywords.push({
      keyword: keyword,
      page: row.keys[1] || '',
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      position: row.position || 0
    });
    
    processed.add(keyword);
  });
  
  // Filter out clusters
  return clusters.filter(c => c.keywords.length >= 1 && c.keywords.length <= 3);
}

/**
 * Extract main topic from keyword
 */
function extractTopic(keyword) {
  const stopWords = ['how', 'what', 'where', 'when', 'why', 'who', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'my', 'your', 'best', 'top', 'near', 'me'];
  
  const words = keyword.toLowerCase().split(/\s+/);
  const meaningful = words.filter(w => !stopWords.includes(w) && w.length > 2);
  
  // Look for service-type keywords
  const serviceTerms = ['installation', 'repair', 'replacement', 'maintenance', 'service', 'install', 'replace', 'fix'];
  const serviceWord = meaningful.find(w => serviceTerms.some(s => w.includes(s)));
  
  // If we have a service term, combine it with the main noun
  if (serviceWord) {
    const otherWords = meaningful.filter(w => w !== serviceWord);
    if (otherWords.length > 0) {
      return `${otherWords[0]} ${serviceWord}`.replace(/s$/, ''); // Capitalize first letter later
    }
    return serviceWord;
  }
  
  // Otherwise, take first 2-3 meaningful words
  return meaningful.slice(0, 2).join(' ');
}

module.exports = {
  fetchUserProperties,
  fetchSearchAnalytics,
  analyzeQuickWins,
  analyzeCannibalization,
  analyzeUntappedMarkets,
  getCachedOrFetch,
  getDateDaysAgo
};
