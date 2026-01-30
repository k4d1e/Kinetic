// services/gscIndexService.js - GSC Index Coverage & Crawl Analytics (Substrate Dimension)
const { google } = require('googleapis');
const { getOAuth2Client } = require('./googleAuth');
const axios = require('axios');
const xml2js = require('xml2js');

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
    const verdict = result.indexStatusResult?.verdict || 'VERDICT_UNSPECIFIED';
    const coverageState = result.indexStatusResult?.coverageState || 'Unknown';
    const indexingState = result.indexStatusResult?.indexingState || 'INDEXING_STATE_UNSPECIFIED';
    
    // Map GSC verdict to our status categories
    // PASS = Valid (indexed), NEUTRAL = Excluded, FAIL = Error
    let indexStatus = 'UNKNOWN';
    if (verdict === 'PASS') {
      indexStatus = 'VALID';
    } else if (verdict === 'NEUTRAL') {
      indexStatus = 'EXCLUDED';
    } else if (verdict === 'FAIL') {
      indexStatus = 'ERROR';
    }
    
    return {
      url: inspectionUrl,
      verdict: verdict, // Store original verdict
      indexStatus: indexStatus, // Mapped status
      coverageState: coverageState,
      indexingState: indexingState,
      crawlStatus: result.indexStatusResult?.crawledAs || 'UNKNOWN',
      robotsAllowed: result.indexStatusResult?.robotsTxtState === 'ALLOWED',
      crawlTime: result.indexStatusResult?.lastCrawlTime || null,
      pageFetchState: result.indexStatusResult?.pageFetchState || 'UNKNOWN',
      googleCanonical: result.indexStatusResult?.googleCanonical || null,
      userCanonical: result.indexStatusResult?.userCanonical || null,
      issues: [
        ...(result.indexStatusResult?.robotsTxtState === 'DISALLOWED' ? ['Crawling disallowed by robots.txt'] : []),
        ...(indexingState === 'BLOCKED_BY_META_TAG' ? ['Indexing blocked by noindex meta tag'] : []),
        ...(indexingState === 'BLOCKED_BY_HTTP_HEADER' ? ['Indexing blocked by X-Robots-Tag header'] : []),
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
  if (!sitemaps || sitemaps.length === 0) {
    console.log('⚠️  No sitemaps available for sampling');
    return [];
  }
  
  const allUrls = [];
  
  // Fetch and parse each sitemap
  for (const sitemap of sitemaps) {
    try {
      console.log(`📥 Fetching sitemap: ${sitemap.path}`);
      
      // Fetch sitemap XML
      const response = await axios.get(sitemap.path, {
        timeout: 10000,
        headers: {
          'User-Agent': 'KineticEVO/1.0 (+https://kinetic-evo.com)'
        }
      });
      
      // Parse XML
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      // Handle sitemap index (contains other sitemaps)
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        console.log(`   └─ Sitemap index detected, skipping nested sitemaps for now`);
        continue;
      }
      
      // Extract URLs from regular sitemap
      if (result.urlset && result.urlset.url) {
        const urls = result.urlset.url.map(entry => entry.loc[0]);
        console.log(`   └─ Found ${urls.length} URLs in sitemap`);
        allUrls.push(...urls);
      }
      
    } catch (error) {
      console.error(`   └─ Error fetching sitemap ${sitemap.path}:`, error.message);
      continue;
    }
  }
  
  if (allUrls.length === 0) {
    console.log('⚠️  No URLs extracted from sitemaps');
    return [];
  }
  
  // Sample URLs intelligently:
  // - Take first 5 URLs (homepage, main pages)
  // - Take 5 random URLs from middle
  // - Take last 5 URLs (recent content)
  const sampleSize = Math.min(15, allUrls.length);
  const sampledUrls = [];
  
  // First 5
  sampledUrls.push(...allUrls.slice(0, Math.min(5, allUrls.length)));
  
  // Random 5 from middle
  if (allUrls.length > 10) {
    const middleStart = Math.floor(allUrls.length * 0.3);
    const middleEnd = Math.floor(allUrls.length * 0.7);
    const middleUrls = allUrls.slice(middleStart, middleEnd);
    
    for (let i = 0; i < Math.min(5, middleUrls.length); i++) {
      const randomIndex = Math.floor(Math.random() * middleUrls.length);
      sampledUrls.push(middleUrls[randomIndex]);
      middleUrls.splice(randomIndex, 1);
    }
  }
  
  // Last 5
  if (allUrls.length > 5) {
    sampledUrls.push(...allUrls.slice(-Math.min(5, allUrls.length - sampledUrls.length)));
  }
  
  // Remove duplicates
  const uniqueSampledUrls = [...new Set(sampledUrls)].slice(0, sampleSize);
  
  console.log(`✓ Sampled ${uniqueSampledUrls.length} URLs from ${allUrls.length} total URLs`);
  
  return uniqueSampledUrls;
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
      // Map GSC coverageState to normalized exclusion reasons
      const normalizedReason = normalizeCoverageState(result.coverageState, result.indexingState);
      if (normalizedReason) {
        if (!reasons[normalizedReason]) {
          reasons[normalizedReason] = {
            count: 0,
            urls: []
          };
        }
        reasons[normalizedReason].count += 1;
        reasons[normalizedReason].urls.push(result.url);
      }
    }
  });
  
  return reasons;
}

/**
 * Normalize GSC coverageState to consistent exclusion reason keys
 * @param {string} coverageState - GSC coverage state
 * @param {string} indexingState - GSC indexing state
 * @returns {string|null} - Normalized exclusion reason
 */
function normalizeCoverageState(coverageState, indexingState) {
  const state = coverageState.toLowerCase();
  
  // Check indexing state for noindex blocking
  if (indexingState === 'BLOCKED_BY_META_TAG' || indexingState === 'BLOCKED_BY_HTTP_HEADER') {
    return 'EXCLUDED_BY_NOINDEX';
  }
  
  // Map coverage states to normalized reasons
  if (state.includes('noindex')) {
    return 'EXCLUDED_BY_NOINDEX';
  } else if (state.includes('robots.txt') || state.includes('blocked by robots')) {
    return 'BLOCKED_BY_ROBOTS_TXT';
  } else if (state.includes('duplicate')) {
    return 'DUPLICATE';
  } else if (state.includes('crawled') && state.includes('not indexed')) {
    return 'CRAWLED_NOT_INDEXED';
  } else if (state.includes('discovered') && state.includes('not indexed')) {
    return 'CRAWLED_NOT_INDEXED'; // Treat discovered but not indexed similarly
  } else if (state.includes('soft 404')) {
    return 'SOFT_404';
  } else if (state.includes('redirect')) {
    return 'PAGE_WITH_REDIRECT';
  } else if (state.includes('not found') || state.includes('404')) {
    return 'NOT_FOUND';
  } else if (state.includes('server error') || state.includes('5xx')) {
    return 'SERVER_ERROR';
  } else if (state.includes('access denied') || state.includes('403')) {
    return 'ACCESS_DENIED';
  }
  
  // Return original state if no mapping found (for logging/debugging)
  return coverageState;
}

/**
 * SUBSTRATE HEALTH ANALYSIS
 * Calculate root density and soil quality metrics
 * @param {Object} indexCoverage - Index coverage data
 * @param {Array} sitemaps - Sitemap status data
 * @returns {Object} - Substrate health metrics
 */
async function analyzeSubstrateHealth(indexCoverage, sitemaps) {
  const totalSubmittedFromSitemap = sitemaps.reduce((sum, sm) => sum + sm.submitted, 0);
  const totalIndexedFromSitemap = sitemaps.reduce((sum, sm) => sum + sm.indexed, 0);
  
  // Use URL Inspection data when available (more accurate, real-time)
  // Project sample results to estimate full site metrics
  let totalSubmitted = totalSubmittedFromSitemap;
  let totalIndexed = totalIndexedFromSitemap;
  let totalExcluded = totalSubmittedFromSitemap - totalIndexedFromSitemap;
  
  // If we have URL inspection data with meaningful sample size, use it to project
  if (indexCoverage && indexCoverage.totalSampled > 0) {
    console.log(`📊 Using URL Inspection data: ${indexCoverage.valid} valid, ${indexCoverage.excluded} excluded from ${indexCoverage.totalSampled} sampled`);
    
    // Calculate rates from inspection sample
    const validRate = indexCoverage.valid / indexCoverage.totalSampled;
    const excludedRate = indexCoverage.excluded / indexCoverage.totalSampled;
    
    // Project to full site if we have sitemap total
    if (totalSubmittedFromSitemap > 0) {
      totalIndexed = Math.round(totalSubmittedFromSitemap * validRate);
      totalExcluded = Math.round(totalSubmittedFromSitemap * excludedRate);
    } else {
      // Use raw inspection counts if no sitemap data
      totalSubmitted = indexCoverage.totalSampled;
      totalIndexed = indexCoverage.valid;
      totalExcluded = indexCoverage.excluded;
    }
  }
  
  console.log(`📊 Final metrics: ${totalIndexed} indexed / ${totalSubmitted} submitted (${totalExcluded} excluded)`);
  
  // Root Density: Percentage of submitted URLs that are indexed
  const rootDensity = totalSubmitted > 0 ? (totalIndexed / totalSubmitted * 100) : 0;
  
  // Root Rot: Percentage of exclusions
  const exclusionRate = totalSubmitted > 0 
    ? (totalExcluded / totalSubmitted * 100) 
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
  
  // Mycelial Expansion: How well the root network is spreading (use rootDensity if sitemap data unavailable)
  const mycelialExpansion = sitemaps.length > 0 && totalIndexedFromSitemap > 0
    ? sitemaps.reduce((sum, sm) => sum + parseFloat(sm.indexationRate), 0) / sitemaps.length
    : rootDensity;
  
  // Determine health status
  let status = 'healthy';
  if (soilQuality < 50) status = 'critical';
  else if (soilQuality < 70) status = 'warning';
  
  // Generate emergent insights
  const insights = [];
  
  if (exclusionRate > 20) {
    // Diagnose actual causes from GSC exclusion data
    const exclusionReasons = indexCoverage.exclusionReasons || {};
    const diagnosedCauses = [];
    
    // Analyze each exclusion reason and add specific diagnosis
    if (exclusionReasons['EXCLUDED_BY_NOINDEX']) {
      diagnosedCauses.push({
        reason: 'Noindex Tags Detected',
        count: exclusionReasons['EXCLUDED_BY_NOINDEX'].count,
        urls: exclusionReasons['EXCLUDED_BY_NOINDEX'].urls,
        severity: 'high',
        fix: 'Remove noindex meta tags from pages that should be indexed'
      });
    }
    
    if (exclusionReasons['BLOCKED_BY_ROBOTS_TXT']) {
      diagnosedCauses.push({
        reason: 'Robots.txt Blocking',
        count: exclusionReasons['BLOCKED_BY_ROBOTS_TXT'].count,
        urls: exclusionReasons['BLOCKED_BY_ROBOTS_TXT'].urls,
        severity: 'high',
        fix: 'Update robots.txt to allow Googlebot access'
      });
    }
    
    if (exclusionReasons['DUPLICATE']) {
      diagnosedCauses.push({
        reason: 'Duplicate Content',
        count: exclusionReasons['DUPLICATE'].count,
        urls: exclusionReasons['DUPLICATE'].urls,
        severity: 'medium',
        fix: 'Add canonical tags or consolidate duplicate pages'
      });
    }
    
    if (exclusionReasons['CRAWLED_NOT_INDEXED']) {
      diagnosedCauses.push({
        reason: 'Crawled But Not Indexed',
        count: exclusionReasons['CRAWLED_NOT_INDEXED'].count,
        urls: exclusionReasons['CRAWLED_NOT_INDEXED'].urls,
        severity: 'medium',
        fix: 'Improve content quality or add more internal links to these pages'
      });
    }
    
    if (exclusionReasons['SOFT_404']) {
      diagnosedCauses.push({
        reason: 'Soft 404 Errors',
        count: exclusionReasons['SOFT_404'].count,
        urls: exclusionReasons['SOFT_404'].urls,
        severity: 'medium',
        fix: 'Return proper 404 status codes or add substantial content'
      });
    }
    
    if (exclusionReasons['PAGE_WITH_REDIRECT']) {
      diagnosedCauses.push({
        reason: 'Redirect Chains',
        count: exclusionReasons['PAGE_WITH_REDIRECT'].count,
        urls: exclusionReasons['PAGE_WITH_REDIRECT'].urls,
        severity: 'low',
        fix: 'Update internal links to point directly to final destination'
      });
    }
    
    if (exclusionReasons['NOT_FOUND']) {
      diagnosedCauses.push({
        reason: '404 Not Found Errors',
        count: exclusionReasons['NOT_FOUND'].count,
        urls: exclusionReasons['NOT_FOUND'].urls,
        severity: 'high',
        fix: 'Fix broken links or restore missing pages with 301 redirects'
      });
    }
    
    if (exclusionReasons['SERVER_ERROR']) {
      diagnosedCauses.push({
        reason: 'Server Errors (5xx)',
        count: exclusionReasons['SERVER_ERROR'].count,
        urls: exclusionReasons['SERVER_ERROR'].urls,
        severity: 'high',
        fix: 'Investigate server logs and fix technical errors causing 500/503 responses'
      });
    }
    
    if (exclusionReasons['ACCESS_DENIED']) {
      diagnosedCauses.push({
        reason: 'Access Denied (403)',
        count: exclusionReasons['ACCESS_DENIED'].count,
        urls: exclusionReasons['ACCESS_DENIED'].urls,
        severity: 'medium',
        fix: 'Check server permissions and authentication requirements'
      });
    }
    
    // If no specific reasons found, provide fallback with possible causes
    if (diagnosedCauses.length === 0) {
      const possibleCauses = [];
      
      if (exclusionRate >= 100) {
        possibleCauses.push(
          'Site recently added to GSC - Google hasn\'t crawled yet',
          'Robots.txt file blocking Googlebot from all pages',
          'Noindex meta tags present on all pages',
          'GSC property just connected - data not fully populated',
          'Server returning 5xx errors for all requests'
        );
      } else if (exclusionRate > 50) {
        possibleCauses.push(
          'Widespread robots.txt or noindex issues',
          'Server errors (500s) preventing crawling',
          'Pages behind authentication or paywalls',
          'Sitemap contains URLs that redirect or 404'
        );
      } else {
        possibleCauses.push(
          'Duplicate content issues',
          'Soft 404 errors or thin content pages',
          'Redirect chains wasting crawl budget',
          'Some pages blocked by robots.txt'
        );
      }
      
      insights.push({
        type: 'ROOT_ROT',
        severity: 'high',
        message: `Substrate is rejecting the graft - ${exclusionRate.toFixed(1)}% exclusion rate indicates structural issues`,
        possibleCauses,
        recommendation: 'Wait for GSC to process crawl data, then E.V.O. can diagnose specific issues'
      });
    } else {
      // We have diagnosed causes from actual GSC data
      insights.push({
        type: 'ROOT_ROT',
        severity: 'high',
        message: `Substrate is rejecting the graft - ${exclusionRate.toFixed(1)}% exclusion rate indicates structural issues`,
        diagnosedCauses,
        recommendation: `${diagnosedCauses.length} specific issue(s) diagnosed from GSC data`
      });
    }
  }
  
  if (mycelialExpansion < 70) {
    // Generate possible causes for weak mycelial expansion
    const possibleCauses = [];
    
    if (mycelialExpansion < 30) {
      // Very weak - critical structural issues
      possibleCauses.push(
        'Sitemap missing or not submitted to GSC',
        'Pages not discoverable through internal links',
        'Orphan pages with no path from homepage',
        'Crawl budget exhausted on low-value pages'
      );
    } else if (mycelialExpansion < 50) {
      // Moderate weakness - discoverability issues
      possibleCauses.push(
        'Incomplete sitemap coverage',
        'Weak internal linking structure',
        'Deep pages requiring many clicks to reach',
        'Sitemap contains non-indexable URLs'
      );
    } else {
      // Minor weakness - optimization needed
      possibleCauses.push(
        'Some pages not included in sitemap',
        'Internal linking could be improved',
        'New content not yet crawled',
        'Priority pages buried in site architecture'
      );
    }
    
    insights.push({
      type: 'WEAK_MYCELIUM',
      severity: 'medium',
      message: `Mycelial network is underdeveloped - only ${mycelialExpansion.toFixed(1)}% average indexation`,
      possibleCauses,
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
      totalExcluded
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
