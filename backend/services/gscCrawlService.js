// services/gscCrawlService.js - GSC Crawl Stats Analysis

const { google } = require('googleapis');
const { getOAuth2Client } = require('./googleAuth');
const { fetchSitemapStatus } = require('./gscIndexService');

/**
 * Fetch Crawl Stats from GSC
 * 
 * NOTE: The Google Search Console API does not currently expose the Crawl Stats
 * dashboard data programmatically. This includes:
 * - Total crawl requests per day
 * - Average response time
 * - Download time spent
 * - Kilobytes downloaded
 * - Host status (response codes)
 * 
 * These metrics are only available through the GSC web interface at:
 * Settings > Crawl Stats
 * 
 * This service provides a placeholder structure for when/if the API adds this data.
 * 
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Object>} - Crawl stats data
 */
async function fetchCrawlStats(pool, userId, siteUrl) {
  try {
    console.log(`📊 Attempting to fetch crawl stats for ${siteUrl}...`);
    console.log('⚠️  NOTE: GSC API does not expose Crawl Stats dashboard data');
    
    // Verify OAuth2 access
    const oauth2Client = await getOAuth2Client(pool, userId);
    
    // Get sitemap data as a proxy for site structure
    const sitemaps = await fetchSitemapStatus(pool, userId, siteUrl);
    const totalSubmitted = sitemaps.reduce((sum, sitemap) => sum + (sitemap.contents || 0), 0);
    
    // Return mock/placeholder data structure
    // In production, this would come from actual GSC Crawl Stats API (when available)
    const crawlData = {
      totalSubmitted,
      sitemapCount: sitemaps.length,
      // Placeholder crawl metrics (would come from API)
      crawlStats: {
        requestsPerDay: null,  // Not available via API
        avgResponseTime: null, // Not available via API
        serverErrors: null,    // Not available via API
        crawlBudgetUsed: null  // Not available via API
      },
      apiLimitation: true,
      message: 'GSC API does not currently expose Crawl Stats dashboard data'
    };
    
    console.log('✓ Crawl data structure prepared (API limitation noted)');
    
    return crawlData;
  } catch (error) {
    console.error('Error fetching crawl stats:', error.message);
    throw new Error('Failed to fetch crawl stats data');
  }
}

/**
 * Analyze Crawl Health
 * 
 * Since the GSC API doesn't provide crawl stats, we provide:
 * 1. Information about the API limitation
 * 2. Instructions for manual monitoring
 * 3. Default healthy score (no action needed)
 * 
 * @param {Object} crawlData - Crawl data from fetchCrawlStats
 * @returns {Promise<Object>} - Health analysis with insights
 */
async function analyzeCrawlHealth(crawlData) {
  console.log('🔍 Analyzing crawl health...');
  
  const health = {
    score: 85,  // Default healthy score since we can't detect issues via API
    status: 'info',
    metrics: {
      totalSubmitted: String(crawlData.totalSubmitted).padStart(5, '0'),
      sitemapCount: crawlData.sitemapCount,
      apiStatus: 'Limited - Manual monitoring required'
    },
    insights: []
  };
  
  // Primary insight: API limitation
  health.insights.push({
    type: 'INFO',
    severity: 'info',
    message: 'Crawl Stats Monitoring - Manual Review Required',
    details: 'The Google Search Console API does not currently provide programmatic access to Crawl Stats dashboard data. This includes crawl requests per day, response times, server errors, and crawl budget utilization.',
    possibleCauses: [
      'API Limitation: Crawl Stats data not available via GSC API',
      'Manual monitoring required through GSC web interface'
    ],
    recommendation: 'Visit Google Search Console > Settings > Crawl Stats to manually monitor: (1) Total crawl requests trend, (2) Average response time (aim for <200ms), (3) Server error rate (should be <1%), (4) Download time and kilobytes per day to optimize crawl budget.'
  });
  
  // Additional insight: What to look for
  health.insights.push({
    type: 'GUIDE',
    severity: 'info',
    message: 'Key Crawl Metrics to Monitor',
    details: 'When reviewing Crawl Stats in the GSC dashboard, focus on these key indicators of crawl health and efficiency.',
    possibleCauses: [
      'Total Requests: Should be stable or increasing for growing sites',
      'Response Time: Spikes indicate server performance issues',
      'Server Errors (5xx): Should remain below 1% of total requests',
      'File Type Distribution: Ensure important pages get crawl priority'
    ],
    recommendation: 'Set up weekly monitoring of Crawl Stats dashboard. Look for: sudden drops in crawl requests (may indicate crawl budget issues or blocked URLs), response time spikes (server performance problems), increased server errors (hosting issues), and ensure high-value pages are being crawled regularly.'
  });
  
  console.log(`✓ Crawl Health Score: ${health.score}/100 (informational)`);
  
  return health;
}

module.exports = {
  fetchCrawlStats,
  analyzeCrawlHealth
};
