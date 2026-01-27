// services/ahrefsLinkIntersectService.js - Ahrefs Link Intersect Analysis (Loom's Gap Analysis)

/**
 * LOOM'S GAP ANALYSIS
 * Identifies "missing warp threads" - domains that link to 2+ competitors but not to the user
 * 
 * Metaphor: The loom shows where competing tapestries share threads, revealing structural gaps
 * in your own weave pattern. These are pre-aligned warp threads waiting for your content.
 */

/**
 * Call Ahrefs API via REST
 * Integrates with Ahrefs API v3 using the API key
 * @param {string} toolName - Ahrefs tool name (e.g., 'site-explorer-organic-competitors')
 * @param {Object} args - Tool arguments as per Ahrefs API spec
 * @returns {Promise<Object>} - Tool response data
 */
async function callAhrefsMCP(toolName, args) {
  try {
    // Ahrefs API token from environment
    const apiKey = process.env.AHREFS_API_TOKEN;
    
    if (!apiKey) {
      throw new Error('AHREFS_API_TOKEN not set in environment variables');
    }
    
    // Convert tool name to API endpoint format
    // 'site-explorer-organic-competitors' -> 'site-explorer/organic-competitors'
    // Split on the first hyphen group to get category/endpoint structure
    const parts = toolName.split('-');
    let endpoint;
    if (parts.length >= 3) {
      // Format: category-subcategory-action -> category-subcategory/action
      const category = parts.slice(0, 2).join('-'); // e.g., 'site-explorer'
      const action = parts.slice(2).join('-');        // e.g., 'organic-competitors'
      endpoint = `${category}/${action}`;
    } else {
      // Fallback: just use as-is with slash replacement
      endpoint = toolName.replace(/-/g, '/');
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    }
    
    const url = `https://api.ahrefs.com/v3/${endpoint}?${queryParams.toString()}`;
    
    console.log(`📡 Calling Ahrefs API: ${toolName}`);
    console.log(`   Target: ${args.target || 'N/A'}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Dashboard/1.0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ahrefs API error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✓ Ahrefs API response received for ${toolName}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error calling Ahrefs API ${toolName}:`, error.message);
    throw error;
  }
}

/**
 * Get domain from URL
 * @param {string} url - Full URL or domain (also handles GSC formats like 'sc-domain:example.com')
 * @returns {string} - Clean domain without protocol or www
 */
function getDomainFromUrl(url) {
  try {
    // Handle Google Search Console domain formats
    // e.g., 'sc-domain:example.com', 'sc-set:123456', or 'https://example.com/'
    let cleanUrl = url;
    
    // Strip GSC prefixes (sc-domain:, sc-set:, etc.)
    if (cleanUrl.startsWith('sc-domain:')) {
      cleanUrl = cleanUrl.replace('sc-domain:', '');
    } else if (cleanUrl.startsWith('sc-set:')) {
      // For sc-set, we can't extract a domain - throw error
      throw new Error('Cannot extract domain from GSC property set format (sc-set:)');
    }
    
    // Now process as normal URL/domain
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    // Fallback: strip common prefixes and extract domain
    return url
      .replace(/^sc-domain:/, '')
      .replace(/^https?:\/\/(www\.)?/, '')
      .split('/')[0];
  }
}

/**
 * Auto-discover top organic competitors using Ahrefs
 * @param {string} domain - User's domain
 * @param {string} country - Country code (default: 'us')
 * @param {number} limit - Number of competitors to fetch (default: 10)
 * @returns {Promise<Array>} - Array of competitor objects with metrics
 */
async function autoDiscoverCompetitors(domain, country = 'us', limit = 10) {
  try {
    console.log(`🔍 Auto-discovering top ${limit} competitors for ${domain}...`);
    
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Use MCP tool: site-explorer-organic-competitors
    const result = await callAhrefsMCP('site-explorer-organic-competitors', {
      target: domain,
      mode: 'subdomains',
      country: country,
      date: today,
      select: 'domain,common_keywords,intersections,common_traffic,domain_rating,organic_keywords,organic_traffic',
      limit: limit,
      order_by: 'common_keywords:desc'
    });
    
    const competitors = (result.competitors || []).map(comp => ({
      domain: comp.domain,
      commonKeywords: comp.common_keywords || 0,
      intersections: comp.intersections || 0,
      commonTraffic: comp.common_traffic || 0,
      domainRating: comp.domain_rating || 0,
      organicKeywords: comp.organic_keywords || 0,
      organicTraffic: comp.organic_traffic || 0
    }));
    
    console.log(`✓ Found ${competitors.length} competitors`);
    return competitors;
  } catch (error) {
    console.error('Error auto-discovering competitors:', error);
    return [];
  }
}

/**
 * Fetch referring domains for a target (user or competitor)
 * @param {string} domain - Domain to analyze
 * @param {number} limit - Max referring domains to fetch (default: 5000)
 * @returns {Promise<Array>} - Array of referring domain objects
 */
async function getReferringDomains(domain, limit = 5000) {
  try {
    console.log(`🔗 Fetching referring domains for ${domain}...`);
    
    // Use MCP tool: site-explorer-referring-domains
    const result = await callAhrefsMCP('site-explorer-referring-domains', {
      target: domain,
      mode: 'subdomains',
      select: 'domain,domain_rating,backlinks,refpages,first_seen,last_visited',
      limit: limit,
      order_by: 'domain_rating:desc'
    });
    
    const refDomains = (result.domains || []).map(d => ({
      domain: d.domain,
      domainRating: d.domain_rating || 0,
      backlinks: d.backlinks || 0,
      refPages: d.refpages || 0,
      firstSeen: d.first_seen || null,
      lastVisited: d.last_visited || null
    }));
    
    console.log(`✓ Found ${refDomains.length} referring domains for ${domain}`);
    return refDomains;
  } catch (error) {
    console.error(`Error fetching referring domains for ${domain}:`, error);
    return [];
  }
}

/**
 * Fetch referring domains for user
 * @param {string} userDomain - User's domain
 * @returns {Promise<Set>} - Set of referring domain names
 */
async function getUserReferringDomains(userDomain) {
  const refDomains = await getReferringDomains(userDomain);
  return new Set(refDomains.map(d => d.domain));
}

/**
 * Fetch referring domains for all competitors in parallel
 * @param {Array} competitors - Array of competitor objects
 * @returns {Promise<Map>} - Map of competitor domain -> Set of referring domains
 */
async function getCompetitorReferringDomains(competitors) {
  console.log(`\n📊 Fetching backlink profiles for ${competitors.length} competitors...`);
  
  const competitorBacklinks = new Map();
  
  // Fetch all competitor backlinks in parallel (this will make ~10 API calls)
  const promises = competitors.map(async (comp) => {
    const refDomains = await getReferringDomains(comp.domain);
    const refDomainSet = new Set(refDomains.map(d => d.domain));
    
    // Store full domain objects for later use
    competitorBacklinks.set(comp.domain, {
      refDomainSet: refDomainSet,
      refDomainObjects: refDomains
    });
    
    return { competitor: comp.domain, count: refDomainSet.size };
  });
  
  const results = await Promise.all(promises);
  results.forEach(r => {
    console.log(`  - ${r.competitor}: ${r.count} referring domains`);
  });
  
  return competitorBacklinks;
}

/**
 * Calculate link intersect: find domains linking to 2+ competitors but NOT user
 * @param {Set} userRefDomains - User's referring domains
 * @param {Map} competitorBacklinks - Map of competitor -> {refDomainSet, refDomainObjects}
 * @param {Array} competitors - Original competitor objects with metrics
 * @returns {Array} - Array of gap domain objects with metadata
 */
function calculateLinkIntersect(userRefDomains, competitorBacklinks, competitors) {
  console.log(`\n🔮 Calculating Link Intersect (Gap Analysis)...`);
  
  // Track which domains link to which competitors
  const domainToCompetitors = new Map();
  const domainObjects = new Map(); // Store full domain objects
  
  // Build reverse mapping: domain -> list of competitors that have it
  for (const [competitorDomain, data] of competitorBacklinks.entries()) {
    for (const refDomain of data.refDomainSet) {
      // Skip if user already has this domain
      if (userRefDomains.has(refDomain)) {
        continue;
      }
      
      if (!domainToCompetitors.has(refDomain)) {
        domainToCompetitors.set(refDomain, []);
      }
      domainToCompetitors.get(refDomain).push(competitorDomain);
      
      // Store domain object for later use
      if (!domainObjects.has(refDomain)) {
        const domainObj = data.refDomainObjects.find(d => d.domain === refDomain);
        if (domainObj) {
          domainObjects.set(refDomain, domainObj);
        }
      }
    }
  }
  
  // Filter to domains linking to 2+ competitors
  const gapDomains = [];
  for (const [domain, competitorsLinked] of domainToCompetitors.entries()) {
    if (competitorsLinked.length >= 2) {
      const domainObj = domainObjects.get(domain) || { 
        domain, 
        domainRating: 0, 
        backlinks: 0 
      };
      
      gapDomains.push({
        domain: domain,
        domainRating: domainObj.domainRating,
        backlinks: domainObj.backlinks,
        refPages: domainObj.refPages || 0,
        firstSeen: domainObj.firstSeen,
        lastVisited: domainObj.lastVisited,
        competitorsLinkedCount: competitorsLinked.length,
        competitorsLinked: competitorsLinked,
        // Will be calculated in next step
        threadResonance: 0
      });
    }
  }
  
  console.log(`✓ Found ${gapDomains.length} gap domains (linking to 2+ competitors, not user)`);
  console.log(`  - High Authority (DR 50+): ${gapDomains.filter(d => d.domainRating >= 50).length}`);
  console.log(`  - Medium Authority (DR 30-49): ${gapDomains.filter(d => d.domainRating >= 30 && d.domainRating < 50).length}`);
  
  return gapDomains;
}

/**
 * Calculate Thread Resonance score for a gap domain
 * Measures how well-aligned this missing thread is with the user's niche
 * @param {Object} gapDomain - Gap domain object
 * @param {Array} competitors - Original competitor objects with commonKeywords data
 * @returns {number} - Thread Resonance score (0-100)
 */
function calculateThreadResonance(gapDomain, competitors) {
  const competitorCount = gapDomain.competitorsLinkedCount;
  const domainRating = gapDomain.domainRating;
  
  // Calculate average common keywords across competitors this domain links to
  let totalCommonKeywords = 0;
  let compCount = 0;
  for (const compDomain of gapDomain.competitorsLinked) {
    const comp = competitors.find(c => c.domain === compDomain);
    if (comp && comp.commonKeywords) {
      totalCommonKeywords += comp.commonKeywords;
      compCount++;
    }
  }
  const avgCommonKeywords = compCount > 0 ? totalCommonKeywords / compCount : 0;
  
  // Relevance factor: how topically aligned are the competitors this domain links to
  // Scale: 0.0 to 1.0 (capped at 1.0)
  const relevanceFactor = Math.min(avgCommonKeywords / 100, 1.0);
  
  // Thread Resonance Formula:
  // (competitor_count × domain_rating × relevance_factor) / 100
  // This gives a score roughly 0-100
  const resonance = (competitorCount * domainRating * relevanceFactor) / 100;
  
  // Cap at 100
  return Math.min(Math.round(resonance), 100);
}

/**
 * Calculate Thread Starvation level based on gap analysis
 * @param {Array} gapDomains - Array of gap domains
 * @returns {string} - 'MILD', 'MODERATE', or 'SEVERE'
 */
function calculateThreadStarvation(gapDomains) {
  const highAuthorityGaps = gapDomains.filter(d => d.domainRating >= 50).length;
  
  if (highAuthorityGaps >= 50) {
    return 'SEVERE';
  } else if (highAuthorityGaps >= 20) {
    return 'MODERATE';
  } else {
    return 'MILD';
  }
}

/**
 * Main Loom's Gap Analysis function
 * Orchestrates the full competitor backlink gap analysis
 * @param {string} siteUrl - User's site URL
 * @param {string} country - Country code for competitor discovery (default: 'us')
 * @param {Array} manualCompetitors - Optional manually specified competitor domains
 * @returns {Promise<Object>} - Complete gap analysis results
 */
async function analyzeLoomsGap(siteUrl, country = 'us', manualCompetitors = []) {
  const startTime = Date.now();
  console.log(`\n🧵 LOOM'S GAP ANALYSIS INITIATED for ${siteUrl}`);
  console.log('═'.repeat(80));
  
  try {
    const userDomain = getDomainFromUrl(siteUrl);
    
    // Step 1: Competitor discovery
    let competitors = [];
    
    if (manualCompetitors && manualCompetitors.length > 0) {
      // Use manual competitors only (skip auto-discovery)
      console.log(`\n[Step 1/4] Using ${manualCompetitors.length} manual competitors...`);
      competitors = manualCompetitors.map(domain => ({
        domain: getDomainFromUrl(domain),
        commonKeywords: 0,
        intersections: 0,
        domainRating: 0,
        manual: true
      }));
      console.log(`✓ Manual competitors loaded: ${competitors.map(c => c.domain).join(', ')}`);
    } else {
      // Auto-discover competitors (requires higher-tier Ahrefs plan)
      console.log('\n[Step 1/4] Auto-discovering competitors...');
      competitors = await autoDiscoverCompetitors(userDomain, country, 10);
    }
    
    if (competitors.length === 0) {
      console.log('⚠️  No competitors found. Cannot perform gap analysis.');
      console.log('💡 Tip: Enter manual competitors in the textarea on Page 1 to bypass auto-discovery.');
      return {
        success: false,
        error: 'No competitors found. Please enter manual competitors.',
        userDomain,
        competitors: [],
        gapDomains: [],
        totalGaps: 0,
        highAuthorityGaps: 0,
        threadStarvation: 'MILD'
      };
    }
    
    // Step 2: Fetch user's referring domains (1 API call)
    console.log('\n[Step 2/4] Fetching user backlink profile...');
    const userRefDomains = await getUserReferringDomains(userDomain);
    console.log(`✓ User has ${userRefDomains.size} referring domains`);
    
    // Step 3: Fetch all competitor referring domains (10 API calls in parallel)
    console.log('\n[Step 3/4] Fetching competitor backlink profiles...');
    const competitorBacklinks = await getCompetitorReferringDomains(competitors);
    
    // Step 4: Calculate link intersect (local computation)
    console.log('\n[Step 4/4] Computing gap domains and Thread Resonance...');
    let gapDomains = calculateLinkIntersect(userRefDomains, competitorBacklinks, competitors);
    
    // Calculate Thread Resonance for each gap domain
    gapDomains = gapDomains.map(gapDomain => ({
      ...gapDomain,
      threadResonance: calculateThreadResonance(gapDomain, competitors)
    }));
    
    // Sort by Thread Resonance (highest first)
    gapDomains.sort((a, b) => b.threadResonance - a.threadResonance);
    
    // Calculate metrics
    const totalGaps = gapDomains.length;
    const highAuthorityGaps = gapDomains.filter(d => d.domainRating >= 50).length;
    const threadStarvation = calculateThreadStarvation(gapDomains);
    
    // Extract top resonance scores
    const threadResonanceScores = gapDomains.slice(0, 50).map(d => ({
      domain: d.domain,
      resonance: d.threadResonance,
      domainRating: d.domainRating,
      competitorsLinked: d.competitorsLinkedCount
    }));
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n═'.repeat(80));
    console.log('🎯 LOOM\'S GAP ANALYSIS COMPLETE');
    console.log(`   Total Gap Domains: ${totalGaps}`);
    console.log(`   High Authority Gaps (DR 50+): ${highAuthorityGaps}`);
    console.log(`   Thread Starvation: ${threadStarvation}`);
    console.log(`   Time Elapsed: ${elapsedTime}s`);
    console.log('═'.repeat(80) + '\n');
    
    return {
      success: true,
      userDomain,
      competitors: competitors.map(c => ({
        domain: c.domain,
        commonKeywords: c.commonKeywords,
        domainRating: c.domainRating,
        organicKeywords: c.organicKeywords
      })),
      gapDomains,
      totalGaps,
      highAuthorityGaps,
      threadStarvation,
      threadResonanceScores,
      analyzedAt: new Date().toISOString(),
      elapsedSeconds: parseFloat(elapsedTime)
    };
  } catch (error) {
    console.error('❌ Error in Loom\'s Gap Analysis:', error);
    throw error;
  }
}

module.exports = {
  analyzeLoomsGap,
  autoDiscoverCompetitors,
  getReferringDomains,
  calculateThreadResonance,
  calculateThreadStarvation,
  getDomainFromUrl
};
