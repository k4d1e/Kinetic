// services/gscIndexService.js - GSC Index Coverage & Crawl Analytics (Substrate Dimension)
const { google } = require('googleapis');
const { getOAuth2Client } = require('./googleAuth');

/**
 * SUBSTRATE DIMENSION: The Mycological Foundation
 * Maps indexation health to root system vitality
 * 
 * Metaphor: The website is a biological ecosystem rooted in substrate
 * Health depends on invisible nutrient flow below ground
 */

/**
 * Fetch Index Coverage Report from GSC
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Object>} - Index coverage stats
 */
async function fetchIndexCoverage(pool, userId, siteUrl) {
  try {
    const oauth2Client = await getOAuth2Client(pool, userId);
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    // Note: GSC API v1 doesn't directly expose index coverage in a single call
    // We'll use URL inspection API for sampled URLs to infer coverage
    // For production, consider using Search Console Insights API or bulk export
    
    console.log(`📊 Fetching index coverage for ${siteUrl}...`);
    
    // Get sitemap URLs to check coverage
    const sitemapData = await fetchSitemapStatus(pool, userId, siteUrl);
    
    // Sample URLs from sitemaps for inspection
    const sampleUrls = await getSampleUrlsFromSitemaps(sitemapData);
    
    // Inspect sample URLs to determine coverage patterns
    const inspectionResults = await inspectMultipleUrls(
      pool, 
      userId, 
      siteUrl, 
      sampleUrls
    );
    
    // Aggregate results
    const coverage = {
      valid: inspectionResults.filter(r => r.indexStatus === 'VALID').length,
      excluded: inspectionResults.filter(r => r.indexStatus === 'EXCLUDED').length,
      error: inspectionResults.filter(r => r.indexStatus === 'ERROR').length,
      warning: inspectionResults.filter(r => r.indexStatus === 'WARNING').length,
      totalSampled: inspectionResults.length,
      exclusionReasons: getExclusionReasons(inspectionResults)
    };
    
    console.log(`✓ Index Coverage: ${coverage.valid} valid, ${coverage.excluded} excluded, ${coverage.error} errors`);
    
    return coverage;
  } catch (error) {
    console.error('Error fetching index coverage:', error.message);
    throw new Error('Failed to fetch index coverage data');
  }
}

/**
 * Fetch Sitemap Status from GSC
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - Sitemap status data
 */
async function fetchSitemapStatus(pool, userId, siteUrl) {
  try {
    const oauth2Client = await getOAuth2Client(pool, userId);
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

    const response = await webmasters.sitemaps.list({
      siteUrl: siteUrl
    });

    const sitemaps = response.data.sitemap || [];
    
    const sitemapStats = sitemaps.map(sitemap => ({
      path: sitemap.path,
      lastSubmitted: sitemap.lastSubmitted,
      lastDownloaded: sitemap.lastDownloaded,
      isPending: sitemap.isPending,
      isSitemapsIndex: sitemap.isSitemapsIndex,
      type: sitemap.type,
      warnings: sitemap.warnings || 0,
      errors: sitemap.errors || 0,
      // Mycelial expansion metrics
      submitted: sitemap.contents ? sitemap.contents.reduce((sum, c) => sum + (c.submitted || 0), 0) : 0,
      indexed: sitemap.contents ? sitemap.contents.reduce((sum, c) => sum + (c.indexed || 0), 0) : 0
    }));
    
    sitemapStats.forEach(sm => {
      sm.delta = sm.submitted - sm.indexed;
      sm.indexationRate = sm.submitted > 0 ? (sm.indexed / sm.submitted * 100).toFixed(1) : 0;
    });
    
    console.log(`✓ Found ${sitemapStats.length} sitemaps with total submitted: ${sitemapStats.reduce((s, sm) => s + sm.submitted, 0)}`);
    
    return sitemapStats;
  } catch (error) {
    console.error('Error fetching sitemap status:', error.message);
    return [];
  }
}

/**
 * Inspect individual URL for indexation status
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @param {string} inspectionUrl - URL to inspect
 * @returns {Promise<Object>} - URL inspection result
 */
async function inspectURL(pool, userId, siteUrl, inspectionUrl) {
  try {
    const oauth2Client = await getOAuth2Client(pool, userId);
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: inspectionUrl,
        siteUrl: siteUrl
      }
    });

    const result = response.data.inspectionResult;
    
    return {
      url: inspectionUrl,
      indexStatus: result.indexStatusResult?.verdict || 'UNKNOWN',
      coverageState: result.indexStatusResult?.coverageState || 'UNKNOWN',
      crawlStatus: result.indexStatusResult?.crawledAs || 'UNKNOWN',
      robotsAllowed: result.indexStatusResult?.robotsTxtState === 'ALLOWED',
      crawlTime: result.indexStatusResult?.lastCrawlTime || null,
      pageFetchState: result.indexStatusResult?.pageFetchState || 'UNKNOWN',
      googleCanonical: result.indexStatusResult?.googleCanonical || null,
      userCanonical: result.indexStatusResult?.userCanonical || null,
      issues: [
        ...(result.indexStatusResult?.crawlingDisallowed ? ['Crawling disallowed by robots.txt'] : []),
        ...(result.indexStatusResult?.indexingDisallowed ? ['Indexing disallowed'] : []),
        ...(result.mobileUsabilityResult?.issues || []).map(i => i.issueType)
      ]
    };
  } catch (error) {
    console.error(`Error inspecting URL ${inspectionUrl}:`, error.message);
    return {
      url: inspectionUrl,
      indexStatus: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Inspect multiple URLs in parallel (with rate limiting)
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @param {Array<string>} urls - URLs to inspect
 * @returns {Promise<Array>} - Inspection results
 */
async function inspectMultipleUrls(pool, userId, siteUrl, urls) {
  const results = [];
  const batchSize = 5; // Limit concurrent requests to avoid rate limits
  
  console.log(`🔍 Inspecting ${urls.length} URLs in batches of ${batchSize}...`);
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => inspectURL(pool, userId, siteUrl, url))
    );
    results.push(...batchResults);
    
    // Rate limiting: wait between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get sample URLs from sitemaps for inspection
 * @param {Array} sitemaps - Sitemap data
 * @returns {Array<string>} - Sample URLs
 */
async function getSampleUrlsFromSitemaps(sitemaps) {
  // For now, return empty array - would need to fetch and parse sitemap XML
  // In production, this would fetch sitemap XML and extract sample URLs
  console.log('⚠️  URL sampling from sitemaps not yet implemented - using manual sample');
  return [];
}

/**
 * Extract exclusion reasons from inspection results
 * @param {Array} results - Inspection results
 * @returns {Object} - Exclusion reasons grouped by type
 */
function getExclusionReasons(results) {
  const reasons = {};
  
  results.forEach(result => {
    if (result.indexStatus === 'EXCLUDED' && result.coverageState) {
      const reason = result.coverageState;
      reasons[reason] = (reasons[reason] || 0) + 1;
    }
  });
  
  return reasons;
}

/**
 * SUBSTRATE HEALTH ANALYSIS
 * Calculate root density and soil quality metrics
 * @param {Object} indexCoverage - Index coverage data
 * @param {Array} sitemaps - Sitemap status data
 * @returns {Object} - Substrate health metrics
 */
async function analyzeSubstrateHealth(indexCoverage, sitemaps) {
  const totalSubmitted = sitemaps.reduce((sum, sm) => sum + sm.submitted, 0);
  const totalIndexed = sitemaps.reduce((sum, sm) => sum + sm.indexed, 0);
  
  // Root Density: Percentage of submitted URLs that are indexed
  const rootDensity = totalSubmitted > 0 ? (totalIndexed / totalSubmitted * 100) : 0;
  
  // Root Rot: Percentage of exclusions
  const exclusionRate = totalSubmitted > 0 
    ? ((totalSubmitted - totalIndexed) / totalSubmitted * 100) 
    : 0;
  
  // Soil Quality: Overall health score (0-100)
  let soilQuality = 100;
  
  // Deduct for high exclusion rate
  if (exclusionRate > 20) soilQuality -= 30;
  else if (exclusionRate > 10) soilQuality -= 15;
  
  // Deduct for sitemap errors/warnings
  const totalErrors = sitemaps.reduce((sum, sm) => sum + sm.errors, 0);
  const totalWarnings = sitemaps.reduce((sum, sm) => sum + sm.warnings, 0);
  if (totalErrors > 0) soilQuality -= Math.min(20, totalErrors * 2);
  if (totalWarnings > 0) soilQuality -= Math.min(10, totalWarnings);
  
  // Mycelial Expansion: How well the root network is spreading
  const mycelialExpansion = sitemaps.length > 0 
    ? sitemaps.reduce((sum, sm) => sum + parseFloat(sm.indexationRate), 0) / sitemaps.length
    : 0;
  
  // Determine health status
  let status = 'healthy';
  if (soilQuality < 50) status = 'critical';
  else if (soilQuality < 70) status = 'warning';
  
  // Generate emergent insights
  const insights = [];
  
  if (exclusionRate > 20) {
    insights.push({
      type: 'ROOT_ROT',
      severity: 'high',
      message: `Substrate is rejecting the graft - ${exclusionRate.toFixed(1)}% exclusion rate indicates structural issues`,
      recommendation: 'Investigate excluded pages and fix indexation issues before optimizing content'
    });
  }
  
  if (mycelialExpansion < 70) {
    insights.push({
      type: 'WEAK_MYCELIUM',
      severity: 'medium',
      message: `Mycelial network is underdeveloped - only ${mycelialExpansion.toFixed(1)}% average indexation`,
      recommendation: 'Improve internal linking and sitemap coverage to strengthen root network'
    });
  }
  
  return {
    score: Math.max(0, Math.round(soilQuality)),
    status,
    metrics: {
      rootDensity: rootDensity.toFixed(1) + '%',
      exclusionRate: exclusionRate.toFixed(1) + '%',
      mycelialExpansion: mycelialExpansion.toFixed(1) + '%',
      totalSubmitted,
      totalIndexed,
      totalExcluded: totalSubmitted - totalIndexed
    },
    insights
  };
}

module.exports = {
  fetchIndexCoverage,
  fetchSitemapStatus,
  inspectURL,
  inspectMultipleUrls,
  analyzeSubstrateHealth
};
