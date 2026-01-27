// services/ahrefsBacklinksService.js - Ahrefs Backlinks API via MCP (Weave Dimension)

/**
 * WEAVE DIMENSION: The Grand Tapestry
 * Maps backlink profile to warp/weft thread structure
 * 
 * Metaphor: External links are the Warp (structure); our content is the Weft (action)
 * Backlinks provide the tensile strength for the pattern to hold
 */

/**
 * Call MCP Ahrefs tool
 * Note: This is a helper that would integrate with the MCP system
 * In production, this would use the actual MCP CallMcpTool functionality
 * @param {string} toolName - Ahrefs MCP tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} - Tool response
 */
async function callAhrefsMCP(toolName, args) {
  // Placeholder for MCP integration
  // In production, this would call the actual MCP tool via the MCP server
  console.log(`📡 Would call MCP tool: ${toolName} with args:`, args);
  
  // For now, return mock structure
  return {
    backlinks: [],
    domains: [],
    note: 'MCP integration required - replace this with actual CallMcpTool calls'
  };
}

/**
 * Get domain from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain
 */
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

/**
 * Fetch backlinks for a domain or URL (WEAVE DIMENSION)
 * @param {string} target - Domain or URL to analyze
 * @param {string} mode - 'domain' or 'subdomains' (use 'subdomains' for domains)
 * @returns {Promise<Object>} - Backlinks data
 */
async function getBacklinks(target, mode = 'subdomains') {
  try {
    console.log(`🔗 Fetching backlinks for ${target}...`);
    
    // Use MCP Ahrefs tool: site-explorer-all-backlinks
    const result = await callAhrefsMCP('site-explorer-all-backlinks', {
      target,
      mode,
      select: 'url_from,url_to,anchor,domain_rating,url_rating,ahrefs_rank,first_seen,last_visited',
      limit: 1000,
      order_by: 'domain_rating:desc'
    });
    
    return {
      backlinks: result.backlinks || [],
      totalBacklinks: result.backlinks?.length || 0
    };
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return { backlinks: [], totalBacklinks: 0 };
  }
}

/**
 * Get top linked pages (highest warp tension)
 * @param {string} domain - Domain to analyze
 * @returns {Promise<Array>} - Top linked pages
 */
async function getTopLinkedPages(domain) {
  try {
    console.log(`📊 Fetching top linked pages for ${domain}...`);
    
    // Use MCP Ahrefs tool: site-explorer-best-by-external-links
    const result = await callAhrefsMCP('site-explorer-best-by-external-links', {
      target: domain,
      mode: 'subdomains',
      select: 'url,external_links,refdomains,url_rating,ahrefs_rank,traffic',
      limit: 100,
      order_by: 'external_links:desc'
    });
    
    const topPages = (result.pages || []).map(page => ({
      url: page.url,
      externalLinks: page.external_links || 0,
      referringDomains: page.refdomains || 0,
      urlRating: page.url_rating || 0,
      traffic: page.traffic || 0,
      warpTension: calculateWarpTension(page)
    }));
    
    return topPages;
  } catch (error) {
    console.error('Error fetching top linked pages:', error);
    return [];
  }
}

/**
 * Calculate warp tension (link strength score)
 * @param {Object} page - Page data
 * @returns {number} - Warp tension score (0-100)
 */
function calculateWarpTension(page) {
  const externalLinks = page.external_links || 0;
  const refDomains = page.refdomains || 0;
  const urlRating = page.url_rating || 0;
  
  // Warp tension formula: combination of link count, domain diversity, and authority
  const linkScore = Math.min(externalLinks / 10, 30); // Max 30 points
  const domainScore = Math.min(refDomains / 5, 40); // Max 40 points
  const authorityScore = urlRating / 100 * 30; // Max 30 points
  
  return Math.min(100, Math.round(linkScore + domainScore + authorityScore));
}

/**
 * Analyze anchor text distribution (pattern/iconography)
 * @param {string} target - Domain or URL
 * @returns {Promise<Object>} - Anchor text profile
 */
async function getAnchorTextProfile(target) {
  try {
    console.log(`🏷️  Fetching anchor text profile for ${target}...`);
    
    // Use MCP Ahrefs tool: site-explorer-anchors
    const result = await callAhrefsMCP('site-explorer-anchors', {
      target,
      mode: 'subdomains',
      select: 'anchor,backlinks,refdomains,anchor_type',
      limit: 500,
      order_by: 'backlinks:desc'
    });
    
    const anchors = result.anchors || [];
    
    // Categorize anchor types
    const anchorTypes = {
      branded: anchors.filter(a => a.anchor_type === 'branded').length,
      exact: anchors.filter(a => a.anchor_type === 'exact').length,
      partial: anchors.filter(a => a.anchor_type === 'partial').length,
      generic: anchors.filter(a => a.anchor_type === 'generic').length,
      url: anchors.filter(a => a.anchor_type === 'url').length,
      image: anchors.filter(a => a.anchor_type === 'image').length,
      other: anchors.filter(a => !a.anchor_type).length
    };
    
    // Calculate anchor diversity (pattern complexity)
    const totalAnchors = anchors.length;
    const anchorDiversity = totalAnchors > 0 
      ? (new Set(anchors.map(a => a.anchor)).size / totalAnchors * 100)
      : 0;
    
    return {
      topAnchors: anchors.slice(0, 50),
      anchorTypes,
      anchorDiversity: Math.round(anchorDiversity),
      totalUniqueAnchors: new Set(anchors.map(a => a.anchor)).size
    };
  } catch (error) {
    console.error('Error fetching anchor text profile:', error);
    return {
      topAnchors: [],
      anchorTypes: {},
      anchorDiversity: 0,
      totalUniqueAnchors: 0
    };
  }
}

/**
 * Get referring domains quality (thread quality)
 * @param {string} domain - Domain to analyze
 * @returns {Promise<Object>} - Referring domains data
 */
async function getReferringDomains(domain) {
  try {
    console.log(`🌐 Fetching referring domains for ${domain}...`);
    
    // Use MCP Ahrefs tool: site-explorer-referring-domains
    const result = await callAhrefsMCP('site-explorer-referring-domains', {
      target: domain,
      mode: 'subdomains',
      select: 'domain_from,backlinks,domain_rating,ahrefs_rank,traffic',
      limit: 500,
      order_by: 'domain_rating:desc'
    });
    
    const domains = result.domains || [];
    
    // Categorize by domain rating (thread quality tiers)
    const qualityTiers = {
      premium: domains.filter(d => d.domain_rating >= 70).length, // DR 70+
      strong: domains.filter(d => d.domain_rating >= 40 && d.domain_rating < 70).length, // DR 40-69
      moderate: domains.filter(d => d.domain_rating >= 20 && d.domain_rating < 40).length, // DR 20-39
      weak: domains.filter(d => d.domain_rating < 20).length // DR < 20
    };
    
    // Calculate average domain rating
    const avgDR = domains.length > 0
      ? domains.reduce((sum, d) => sum + (d.domain_rating || 0), 0) / domains.length
      : 0;
    
    // Calculate average traffic (thread vitality)
    const avgTraffic = domains.length > 0
      ? domains.reduce((sum, d) => sum + (d.traffic || 0), 0) / domains.length
      : 0;
    
    return {
      topDomains: domains.slice(0, 100),
      totalDomains: domains.length,
      qualityTiers,
      avgDomainRating: Math.round(avgDR),
      avgTraffic: Math.round(avgTraffic)
    };
  } catch (error) {
    console.error('Error fetching referring domains:', error);
    return {
      topDomains: [],
      totalDomains: 0,
      qualityTiers: {},
      avgDomainRating: 0,
      avgTraffic: 0
    };
  }
}

/**
 * Get domain metrics (overall weave strength)
 * @param {string} domain - Domain to analyze
 * @returns {Promise<Object>} - Domain metrics
 */
async function getDomainMetrics(domain) {
  try {
    console.log(`📈 Fetching domain metrics for ${domain}...`);
    
    // Use MCP Ahrefs tool: site-explorer-metrics
    const result = await callAhrefsMCP('site-explorer-metrics', {
      target: domain,
      mode: 'subdomains',
      select: 'domain_rating,ahrefs_rank,backlinks,refdomains,refips,referring_subnets,linked_root_domains'
    });
    
    return {
      domainRating: result.domain_rating || 0,
      ahrefsRank: result.ahrefs_rank || 0,
      backlinks: result.backlinks || 0,
      referringDomains: result.refdomains || 0,
      referringIPs: result.refips || 0,
      referringSubnets: result.referring_subnets || 0,
      linkedRootDomains: result.linked_root_domains || 0
    };
  } catch (error) {
    console.error('Error fetching domain metrics:', error);
    return {
      domainRating: 0,
      ahrefsRank: 0,
      backlinks: 0,
      referringDomains: 0,
      referringIPs: 0,
      referringSubnets: 0,
      linkedRootDomains: 0
    };
  }
}

/**
 * WEAVE HEALTH ANALYSIS
 * Calculate tensile strength and pattern coherence
 * @param {Object} weaveData - Combined weave data
 * @returns {Object} - Weave health metrics
 */
async function analyzeWeaveHealth(weaveData) {
  const { domainMetrics, referringDomains, anchorProfile, topLinkedPages } = weaveData;
  
  // Calculate weave health score (0-100)
  let score = 50; // Start at moderate
  
  // Boost for domain rating
  score += (domainMetrics.domainRating || 0) / 2; // Max +50 points
  
  // Adjust for referring domain quality
  const premiumRatio = referringDomains.totalDomains > 0
    ? (referringDomains.qualityTiers?.premium || 0) / referringDomains.totalDomains
    : 0;
  score += premiumRatio * 20; // Max +20 points for high-quality links
  
  // Deduct for poor anchor diversity (over-optimization)
  if (anchorProfile.anchorDiversity < 30) {
    score -= 15; // Low diversity = possible penalty risk
  }
  
  // Deduct for lack of backlinks
  if (domainMetrics.referringDomains < 10) {
    score -= 20; // Very weak weave
  } else if (domainMetrics.referringDomains < 50) {
    score -= 10;
  }
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  let status = 'strong';
  if (score < 40) status = 'weak';
  else if (score < 60) status = 'moderate';
  
  const insights = [];
  
  if (domainMetrics.referringDomains < 10) {
    insights.push({
      type: 'WEAK_WEAVE',
      severity: 'high',
      message: `Only ${domainMetrics.referringDomains} referring domains - weave lacks tensile strength`,
      recommendation: 'Build quality backlinks through outreach, content marketing, and PR'
    });
  }
  
  if (topLinkedPages.length > 0) {
    const loosThreads = topLinkedPages.filter(p => p.externalLinks === 0);
    if (loosThreads.length > 10) {
      insights.push({
        type: 'LOOSE_THREADS',
        severity: 'medium',
        message: `${loosThreads.length} pages have no external backlinks - loose threads in the pattern`,
        recommendation: 'Internal link these pages to stronger authority pages, or build external links'
      });
    }
  }
  
  if (anchorProfile.anchorDiversity < 30) {
    insights.push({
      type: 'ANCHOR_OVER_OPTIMIZATION',
      severity: 'medium',
      message: `Anchor diversity at ${anchorProfile.anchorDiversity}% - pattern may appear unnatural`,
      recommendation: 'Diversify anchor text to include more branded and natural variations'
    });
  }
  
  return {
    score,
    status,
    metrics: {
      domainRating: domainMetrics.domainRating,
      referringDomains: domainMetrics.referringDomains,
      backlinks: domainMetrics.backlinks,
      avgDomainRating: referringDomains.avgDomainRating,
      anchorDiversity: anchorProfile.anchorDiversity + '%',
      warpTension: topLinkedPages.length > 0 
        ? Math.round(topLinkedPages.reduce((sum, p) => sum + p.warpTension, 0) / topLinkedPages.length)
        : 0
    },
    insights
  };
}

module.exports = {
  getBacklinks,
  getTopLinkedPages,
  getAnchorTextProfile,
  getReferringDomains,
  getDomainMetrics,
  analyzeWeaveHealth,
  getDomainFromUrl
};
