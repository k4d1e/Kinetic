// services/gscRedirectService.js - GSC Redirect Chain and 404 Error Analysis

const { fetchIndexCoverage } = require('./gscIndexService');

/**
 * Analyze Redirects and 404 Errors from GSC
 * 
 * Uses GSC Coverage Report to identify:
 * - Pages with redirect errors
 * - 404 (Not Found) pages
 * - Server errors (5xx)
 * 
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Object>} - Redirect and error analysis data
 */
async function analyzeRedirectsAndErrors(pool, userId, siteUrl) {
  try {
    console.log(`📊 Analyzing redirects and errors for ${siteUrl}...`);
    
    // Get index coverage data which includes error pages
    const indexCoverage = await fetchIndexCoverage(pool, userId, siteUrl);
    
    // Extract redirect and error data from exclusion reasons
    const exclusionReasons = indexCoverage.exclusionReasons || {};
    
    const redirectData = {
      notFound: {
        count: exclusionReasons['NOT_FOUND']?.count || 0,
        urls: exclusionReasons['NOT_FOUND']?.urls || []
      },
      serverError: {
        count: exclusionReasons['SERVER_ERROR']?.count || 0,
        urls: exclusionReasons['SERVER_ERROR']?.urls || []
      },
      accessDenied: {
        count: exclusionReasons['ACCESS_DENIED']?.count || 0,
        urls: exclusionReasons['ACCESS_DENIED']?.urls || []
      },
      redirect: {
        count: exclusionReasons['REDIRECT']?.count || 0,
        urls: exclusionReasons['REDIRECT']?.urls || []
      },
      totalErrors: 0
    };
    
    // Calculate total error count
    redirectData.totalErrors = 
      redirectData.notFound.count + 
      redirectData.serverError.count + 
      redirectData.accessDenied.count +
      redirectData.redirect.count;
    
    console.log(`✓ Found ${redirectData.totalErrors} total error pages`);
    console.log(`   └─ 404 Errors: ${redirectData.notFound.count}`);
    console.log(`   └─ Server Errors: ${redirectData.serverError.count}`);
    console.log(`   └─ Redirects: ${redirectData.redirect.count}`);
    
    return redirectData;
  } catch (error) {
    console.error('Error analyzing redirects and errors:', error.message);
    throw new Error('Failed to analyze redirects and errors');
  }
}

/**
 * Analyze Redirect Health
 * Provides health score and insights based on error counts
 * 
 * @param {Object} redirectData - Redirect and error data
 * @returns {Promise<Object>} - Health analysis with insights
 */
async function analyzeRedirectHealth(redirectData) {
  console.log('🔍 Analyzing redirect health...');
  
  const { notFound, serverError, accessDenied, redirect, totalErrors } = redirectData;
  
  // Calculate health score
  let score = 100;
  
  // Deduct points based on error severity
  score -= notFound.count * 2;        // 404s are common but need fixing
  score -= serverError.count * 5;     // Server errors are more critical
  score -= accessDenied.count * 3;    // Access issues are important
  score -= redirect.count * 1;        // Redirects waste crawl budget
  
  // Cap at 0-100
  score = Math.max(0, Math.min(100, score));
  
  const health = {
    score,
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    metrics: {
      notFoundPages: String(notFound.count).padStart(3, '0'),
      serverErrors: String(serverError.count).padStart(3, '0'),
      redirectPages: String(redirect.count).padStart(3, '0'),
      totalErrors: String(totalErrors).padStart(3, '0')
    },
    insights: []
  };
  
  // Generate insights based on findings
  if (totalErrors === 0) {
    health.insights.push({
      type: 'SUCCESS',
      severity: 'info',
      message: 'No Redirect or Error Issues Detected',
      details: 'Google Search Console has not reported any 404 errors, server errors, or redirect issues for your site.',
      possibleCauses: [
        'Clean URL structure with no broken links',
        'Proper redirect management',
        'Stable server with no downtime',
        'Regular monitoring and maintenance'
      ],
      recommendation: 'Continue monitoring GSC Coverage Report monthly for any new errors. When restructuring URLs or moving content, implement proper 301 redirects and update internal links promptly.'
    });
  } else {
    // 404 Errors
    if (notFound.count > 0) {
      health.insights.push({
        type: 'ALERT',
        severity: notFound.count > 50 ? 'high' : 'medium',
        message: `404 (Not Found) Errors: ${notFound.count} page${notFound.count > 1 ? 's' : ''}`,
        details: 'Google is attempting to crawl URLs that return 404 errors. These waste crawl budget and create poor user experience when users land on dead pages.',
        diagnosedCauses: [
          {
            reason: '404 Not Found',
            count: notFound.count,
            urls: notFound.urls,
            severity: notFound.count > 50 ? 'high' : 'medium',
            fix: 'Fix broken internal links, implement 301 redirects for moved content, or remove dead URLs from sitemap'
          }
        ],
        possibleCauses: [
          'Deleted pages still linked internally or in sitemap',
          'Moved content without proper 301 redirects',
          'Typos in internal links',
          'External sites linking to deleted pages',
          'Old URLs from previous site structure'
        ],
        recommendation: 'Review the 404 URLs in GSC Coverage Report. For each: (1) If content moved, implement 301 redirect to new location, (2) If content no longer exists, remove internal links and update sitemap, (3) For important deleted content, consider recreating or redirecting to relevant alternative page.'
      });
    }
    
    // Server Errors
    if (serverError.count > 0) {
      health.insights.push({
        type: 'ALERT',
        severity: 'high',
        message: `Server Errors (5xx): ${serverError.count} page${serverError.count > 1 ? 's' : ''}`,
        details: 'Google encountered server errors (500, 502, 503, 504) when trying to crawl these pages. Server errors block indexation and waste crawl budget.',
        diagnosedCauses: [
          {
            reason: 'Server Error (5xx)',
            count: serverError.count,
            urls: serverError.urls,
            severity: 'high',
            fix: 'Investigate server logs, fix application errors, increase server resources, or optimize slow database queries'
          }
        ],
        possibleCauses: [
          'Server timeout or overload during high traffic',
          'Application code errors (PHP, Node.js, etc.)',
          'Database connection issues or slow queries',
          'Server resource limits (CPU, memory, connections)',
          'CDN or hosting provider issues'
        ],
        recommendation: 'URGENT: Check server error logs for these specific URLs. Common fixes: increase PHP memory limit, optimize database queries, fix broken code, upgrade hosting plan if resources are maxed out. Monitor server uptime and response times.'
      });
    }
    
    // Access Denied
    if (accessDenied.count > 0) {
      health.insights.push({
        type: 'WARNING',
        severity: 'medium',
        message: `Access Denied: ${accessDenied.count} page${accessDenied.count > 1 ? 's' : ''}`,
        details: 'Google is being blocked from accessing these pages due to permissions, authentication requirements, or server configuration.',
        possibleCauses: [
          'Password-protected pages or login-required content',
          'IP blocking or firewall rules blocking Googlebot',
          '.htaccess or server config restricting access',
          'Incorrect robots.txt or meta robots directives',
          'CDN security settings blocking crawlers'
        ],
        recommendation: 'If these pages should be indexed, verify: (1) No authentication requirements, (2) No IP blocks affecting Googlebot (verify Googlebot IPs are whitelisted), (3) Check .htaccess for overly restrictive rules, (4) Ensure robots.txt allows access. If pages should remain private, mark them as "noindex" or password-protect intentionally.'
      });
    }
    
    // Redirect Pages
    if (redirect.count > 0) {
      health.insights.push({
        type: 'WARNING',
        severity: 'medium',
        message: `Redirect Pages: ${redirect.count} URL${redirect.count > 1 ? 's' : ''}`,
        details: 'Google discovered redirect chains or unnecessary redirects that waste crawl budget and slow page load times.',
        possibleCauses: [
          'Redirect chains (A→B→C) instead of direct redirects (A→C)',
          'Temporary redirects (302, 307) where permanent (301) should be used',
          'Internal links pointing to redirected URLs',
          'Multiple redirects for HTTP→HTTPS and www→non-www',
          'Redirects still listed in sitemap.xml'
        ],
        recommendation: 'Audit redirect chains and consolidate multi-hop redirects into single 301 redirects. Update internal links to point directly to final destination URLs. Remove redirected URLs from sitemap. Use 301 (permanent) instead of 302 (temporary) for moved content.'
      });
    }
  }
  
  // Always add best practices
  health.insights.push({
    type: 'GUIDE',
    severity: 'info',
    message: 'Redirect & Error Management Best Practices',
    details: 'Follow these guidelines to maintain clean URL structure and efficient crawl budget usage.',
    possibleCauses: [
      'Monitor GSC Coverage Report weekly for new errors',
      'Implement 301 redirects immediately when moving/deleting content',
      'Update internal links instead of relying on redirects',
      'Test all redirects to ensure they lead to correct final destinations',
      'Remove old redirected URLs from sitemap.xml',
      'Set up server monitoring for 5xx errors',
      'Audit redirect chains and consolidate to single redirects'
    ],
    recommendation: 'Create a monthly maintenance checklist: check GSC for new 404s, audit redirect chains, review server error logs, test critical redirects, update sitemap after URL changes. Use tools like Screaming Frog or Sitebulb to crawl your site and identify redirect chains before Google does.'
  });
  
  console.log(`✓ Redirect Health Score: ${score}/100 (${health.status})`);
  
  return health;
}

module.exports = {
  analyzeRedirectsAndErrors,
  analyzeRedirectHealth
};
