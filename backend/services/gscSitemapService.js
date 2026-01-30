// services/gscSitemapService.js - GSC Sitemap Validation and Optimization

const axios = require('axios');
const xml2js = require('xml2js');
const { fetchSitemapStatus } = require('./gscIndexService');

/**
 * Fetch and validate sitemap structure
 * Analyzes sitemap.xml files for quality and completeness
 * 
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Object>} - Sitemap validation data
 */
async function validateSitemaps(pool, userId, siteUrl) {
  try {
    console.log(`📊 Validating sitemaps for ${siteUrl}...`);
    
    // Get sitemap data from GSC
    const sitemaps = await fetchSitemapStatus(pool, userId, siteUrl);
    
    if (!sitemaps || sitemaps.length === 0) {
      console.log('⚠️  No sitemaps found in GSC');
      return {
        sitemaps: [],
        totalURLs: 0,
        validation: {
          hasErrors: true,
          errorCount: 1,
          issues: ['No sitemaps submitted to Google Search Console']
        }
      };
    }
    
    console.log(`✓ Found ${sitemaps.length} sitemap(s)`);
    
    let totalURLs = 0;
    const validation = {
      hasErrors: false,
      errorCount: 0,
      warningCount: 0,
      issues: [],
      warnings: []
    };
    
    // Analyze each sitemap
    for (const sitemap of sitemaps) {
      const urlCount = sitemap.submitted || 0;
      totalURLs += urlCount;
      
      // Check for common issues
      if (sitemap.errors > 0) {
        validation.hasErrors = true;
        validation.errorCount += sitemap.errors;
        validation.issues.push(`Sitemap ${sitemap.path} has ${sitemap.errors} error(s) reported by GSC`);
      }
      
      if (sitemap.warnings > 0) {
        validation.warningCount += sitemap.warnings;
        validation.warnings.push(`Sitemap ${sitemap.path} has ${sitemap.warnings} warning(s)`);
      }
      
      // Check URL count (flag if too large)
      if (urlCount > 50000) {
        validation.warnings.push(`Sitemap ${sitemap.path} contains ${urlCount} URLs (exceeds recommended 50,000 limit)`);
        validation.warningCount++;
      }
      
      // Check if sitemap has been processed
      if (!sitemap.lastDownloaded && !sitemap.lastSubmitted) {
        validation.warnings.push(`Sitemap ${sitemap.path} may not have been discovered by Google yet`);
        validation.warningCount++;
      }
    }
    
    console.log(`✓ Validation complete: ${validation.errorCount} errors, ${validation.warningCount} warnings`);
    
    return {
      sitemaps,
      totalURLs,
      validation
    };
  } catch (error) {
    console.error('Error validating sitemaps:', error.message);
    throw new Error('Failed to validate sitemaps');
  }
}

/**
 * Analyze Sitemap Health
 * Provides health score and insights based on sitemap quality
 * 
 * @param {Object} sitemapData - Sitemap validation data
 * @returns {Promise<Object>} - Health analysis with insights
 */
async function analyzeSitemapHealth(sitemapData) {
  console.log('🔍 Analyzing sitemap health...');
  
  const { sitemaps, totalURLs, validation } = sitemapData;
  
  // Calculate health score
  let score = 100;
  
  // Deduct points for errors
  score -= validation.errorCount * 10;
  
  // Deduct points for warnings
  score -= validation.warningCount * 5;
  
  // Deduct points if no sitemaps
  if (sitemaps.length === 0) {
    score = 40;
  }
  
  // Cap at 0-100
  score = Math.max(0, Math.min(100, score));
  
  const health = {
    score,
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    metrics: {
      totalSitemaps: sitemaps.length,
      totalURLs: String(totalURLs).padStart(5, '0'),
      errors: validation.errorCount,
      warnings: validation.warningCount
    },
    insights: []
  };
  
  // Generate insights based on findings
  if (sitemaps.length === 0) {
    health.insights.push({
      type: 'ALERT',
      severity: 'critical',
      message: 'No Sitemaps Submitted to Google Search Console',
      details: 'Your site does not have any sitemaps submitted to GSC. Sitemaps help Google discover and index your pages more efficiently.',
      possibleCauses: [
        'No sitemap.xml file exists on your website',
        'Sitemap exists but not submitted to Google Search Console',
        'Sitemap blocked by robots.txt',
        'Sitemap URL is incorrect or inaccessible'
      ],
      recommendation: 'Create a sitemap.xml file listing all important pages, submit it to GSC via Sitemaps section, and reference it in your robots.txt file (Sitemap: https://yourdomain.com/sitemap.xml).'
    });
  } else if (validation.hasErrors) {
    health.insights.push({
      type: 'ALERT',
      severity: 'high',
      message: `Sitemap Errors Detected (${validation.errorCount} error${validation.errorCount > 1 ? 's' : ''})`,
      details: 'Google Search Console has reported errors in your sitemap(s). These errors prevent proper indexation of affected URLs.',
      diagnosedCauses: validation.issues.map(issue => ({
        reason: issue,
        count: 1,
        severity: 'high',
        fix: 'Review the sitemap file and fix reported errors. Common fixes: remove 404 URLs, fix malformed XML, ensure all URLs are accessible.'
      })),
      recommendation: 'Visit Google Search Console > Sitemaps section to view specific error details. Fix each error by updating your sitemap file, then resubmit to GSC.'
    });
  } else if (validation.warningCount > 0) {
    health.insights.push({
      type: 'WARNING',
      severity: 'medium',
      message: `Sitemap Warnings (${validation.warningCount} warning${validation.warningCount > 1 ? 's' : ''})`,
      details: 'Your sitemaps have warnings that may affect crawl efficiency but are not blocking indexation.',
      possibleCauses: validation.warnings,
      recommendation: 'Review warnings in GSC and optimize your sitemaps. Common optimizations: split large sitemaps (>50k URLs), remove low-value pages, ensure consistent last-modified dates.'
    });
  } else {
    health.insights.push({
      type: 'SUCCESS',
      severity: 'info',
      message: 'Sitemaps Are Healthy',
      details: `Your ${sitemaps.length} sitemap(s) containing ${totalURLs} URLs are properly configured with no errors or warnings.`,
      possibleCauses: [
        'Clean XML structure',
        'All URLs are accessible',
        'Proper submission to Google Search Console',
        'Regular updates being processed'
      ],
      recommendation: 'Continue monitoring your sitemaps weekly in GSC. When adding new pages, ensure they are added to your sitemap and the sitemap is resubmitted or automatically discovered.'
    });
  }
  
  // Add best practices insight
  health.insights.push({
    type: 'GUIDE',
    severity: 'info',
    message: 'Sitemap Best Practices',
    details: 'Follow these guidelines to maintain optimal sitemap quality and crawl efficiency.',
    possibleCauses: [
      'Include only canonical URLs (no duplicates or alternate versions)',
      'Remove 404s, redirects, and noindex pages',
      'Update <lastmod> dates when content changes',
      'Use <priority> to indicate important pages',
      'Split into multiple sitemaps if over 50,000 URLs',
      'Submit sitemap index for sites with multiple sitemaps'
    ],
    recommendation: 'Audit your sitemap monthly. Remove low-value pages (tags, archives, search results). Ensure high-priority pages (products, services, key content) are included. Use robots.txt to reference your sitemap location.'
  });
  
  console.log(`✓ Sitemap Health Score: ${score}/100 (${health.status})`);
  
  return health;
}

module.exports = {
  validateSitemaps,
  analyzeSitemapHealth
};
