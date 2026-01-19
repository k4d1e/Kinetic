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
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - Quick win opportunities
 */
async function analyzeQuickWins(pool, userId, siteUrl) {
  try {
    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    // Find keywords ranking 4-20 with high impressions but low CTR
    const quickWins = data.rows
      .filter(row => {
        const position = row.position;
        const impressions = row.impressions;
        const ctr = row.ctr;
        return position >= 4 && position <= 20 && impressions >= 100 && ctr < 0.05;
      })
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50)
      .map(row => ({
        keyword: row.keys[0],
        page: row.keys[1],
        position: Math.round(row.position),
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: (row.ctr * 100).toFixed(2) + '%'
      }));

    console.log(`✓ Found ${quickWins.length} quick win opportunities`);
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

module.exports = {
  fetchUserProperties,
  fetchSearchAnalytics,
  analyzeQuickWins,
  analyzeCannibalization,
  getCachedOrFetch,
  getDateDaysAgo
};
