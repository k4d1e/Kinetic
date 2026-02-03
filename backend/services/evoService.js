// services/evoService.js - E.V.O. (Emergent Virtual Oracle) Synthesis Engine

const { 
  fetchIndexCoverage, 
  fetchSitemapStatus, 
  analyzeSubstrateHealth 
} = require('./gscIndexService');

const {
  fetchCrawlStats,
  analyzeCrawlHealth
} = require('./gscCrawlService');

const {
  validateSitemaps,
  analyzeSitemapHealth
} = require('./gscSitemapService');

const {
  analyzeRedirectsAndErrors,
  analyzeRedirectHealth
} = require('./gscRedirectService');

const {
  analyzeCannibalization,
  analyzeLatticeHealth,
  analyzeQuickWins,
  analyzeCognitiveDissonance,
  analyzeSynapseHealth,
  analyzeResonanceContext,
  analyzeResonanceHealth,
  analyzeCatalysts,
  analyzeElixirHealth,
  analyzeContentInventory,
  analyzeKeywordDiscovery,
  getDateDaysAgo
} = require('./gscService');

const {
  getDomainMetrics,
  getReferringDomains,
  getAnchorTextProfile,
  getTopLinkedPages,
  analyzeWeaveHealth,
  getDomainFromUrl
} = require('./ahrefsBacklinksService');

// In-memory progress tracking (use Redis in production for multi-server deployments)
const analysisProgress = {};

function setProgress(userId, dimension, progressData) {
  const key = `${userId}:${dimension}`;
  analysisProgress[key] = {
    ...progressData,
    lastUpdated: Date.now()
  };
}

function getProgress(userId, dimension) {
  const key = `${userId}:${dimension}`;
  return analysisProgress[key] || null;
}

function clearProgress(userId, dimension) {
  const key = `${userId}:${dimension}`;
  delete analysisProgress[key];
}

/**
 * E.V.O. SYNTHESIS ENGINE
 * 
 * The Prism of E.V.O. - Six Dimensional SEO Mapping
 * 
 * Emergence: When higher intelligence arises from simple parts
 * The system's intelligence isn't just built; it arises from data complexity
 */

/**
 * Emergence Pattern Types
 * Defines the patterns detected across dimensional boundaries
 */
const EmergencePatterns = {
  // Positive emergence (synergies)
  CRYSTALLIZATION: 'Strong lattice + strong weave = authority amplification',
  NEUROPLASTICITY: 'Synaptic optimization + resonance alignment = CTR breakthrough',
  ALCHEMICAL_READINESS: 'Substrate health + catalyst presence = rapid transmutation',
  
  // Negative emergence (cascading failures)
  ROOT_ROT_SPREAD: 'Substrate decay causing lattice fractures',
  COGNITIVE_CASCADE: 'Intent misalignment causing synaptic blockage across clusters',
  THREAD_DISSOLUTION: 'Weak weave allowing lattice drift (authority decay)',
  
  // Neutral emergence (opportunities)
  UNTAPPED_RESONANCE: 'Strong substrate + no resonance tuning = dormant frequency',
  CATALYST_GAP: 'Striking distance + no structured data = unrealized transmutation',
  MYCELIAL_POTENTIAL: 'Indexed pages + no internal linking = isolated roots'
};

/**
 * Main E.V.O. Synthesis Function
 * Analyzes all 6 dimensions and generates emergent insights
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Object>} - Complete E.V.O. analysis
 */
async function synthesizeDimensions(pool, userId, siteUrl) {
  try {
    console.log(`\n🌟 E.V.O. SYNTHESIS INITIATED for ${siteUrl}`);
    console.log('═'.repeat(80));
    
    const startTime = Date.now();
    
    // Analyze all 6 dimensions in parallel where possible
    console.log('📊 Analyzing dimensional data streams...\n');
    
    const [
      substrateData,
      latticeData,
      synapseData,
      resonanceData,
      weaveData,
      elixirData
    ] = await Promise.all([
      analyzeSubstrateDimension(pool, userId, siteUrl),
      analyzeLatticeDimension(pool, userId, siteUrl),
      analyzeSynapseDimension(pool, userId, siteUrl),
      analyzeResonanceDimension(pool, userId, siteUrl),
      analyzeWeaveDimension(siteUrl),
      analyzeElixirDimension(pool, userId, siteUrl)
    ]);
    
    // Detect emergence patterns across dimensions
    console.log('\n🔮 Detecting emergence patterns...\n');
    const emergencePatterns = await detectEmergencePatterns({
      substrate: substrateData,
      lattice: latticeData,
      synapse: synapseData,
      resonance: resonanceData,
      weave: weaveData,
      elixir: elixirData
    });
    
    // Generate unified system intelligence
    console.log('🧠 Generating system intelligence...\n');
    const systemIntelligence = await generateSystemIntelligence({
      substrate: substrateData,
      lattice: latticeData,
      synapse: synapseData,
      resonance: resonanceData,
      weave: weaveData,
      elixir: elixirData
    }, emergencePatterns);
    
    // Generate action priorities
    const actionPriorities = await generateActionPriorities(emergencePatterns, {
      substrate: substrateData,
      lattice: latticeData,
      synapse: synapseData,
      resonance: resonanceData,
      weave: weaveData,
      elixir: elixirData
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log('═'.repeat(80));
    console.log(`✓ E.V.O. SYNTHESIS COMPLETE in ${elapsed}ms\n`);
    
    return {
      siteUrl,
      analyzedAt: new Date().toISOString(),
      synthesisTime: elapsed,
      
      // Individual dimensional health scores
      dimensionalHealth: {
        substrate: substrateData.health,
        lattice: latticeData.health,
        synapse: synapseData.health,
        resonance: resonanceData.health,
        weave: weaveData.health,
        elixir: elixirData.health
      },
      
      // Raw dimensional data
      dimensionalData: {
        substrate: substrateData,
        lattice: latticeData,
        synapse: synapseData,
        resonance: resonanceData,
        weave: weaveData,
        elixir: elixirData
      },
      
      // Cross-dimensional emergence patterns
      emergencePatterns,
      
      // Unified system intelligence
      systemIntelligence,
      
      // Actionable insights in priority order
      actionPriorities
    };
  } catch (error) {
    console.error('❌ E.V.O. synthesis error:', error);
    throw new Error('Failed to synthesize dimensional data');
  }
}

/**
 * DIMENSION 1: SUBSTRATE (Mycology/Forest Ecology)
 * Analyze root health and soil quality
 */
async function analyzeSubstrateDimension(pool, userId, siteUrl) {
  console.log('🌱 Analyzing SUBSTRATE (Root Health)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'substrate', {
      status: 'fetching_sitemaps',
      message: 'Fetching sitemap data...',
      percent: 5
    });
    
    const sitemaps = await fetchSitemapStatus(pool, userId, siteUrl);
    
    // Update progress
    setProgress(userId, 'substrate', {
      status: 'inspecting_urls',
      message: 'Starting URL inspection...',
      percent: 10
    });
    
    // Pass progress callback to fetchIndexCoverage
    const progressCallback = (progress) => {
      // Convert inspection progress to overall progress (10% to 90%)
      const overallPercent = 10 + Math.round((progress.percent / 100) * 80);
      setProgress(userId, 'substrate', {
        status: 'inspecting_urls',
        message: `Inspecting URLs: ${progress.completed}/${progress.total}`,
        percent: overallPercent,
        urlsCompleted: progress.completed,
        urlsTotal: progress.total,
        estimatedSecondsRemaining: progress.estimatedSecondsRemaining
      });
    };
    
    const indexCoverage = await fetchIndexCoverage(pool, userId, siteUrl, progressCallback);
    
    // Update progress
    setProgress(userId, 'substrate', {
      status: 'analyzing',
      message: 'Analyzing health metrics...',
      percent: 95
    });
    
    const health = await analyzeSubstrateHealth(indexCoverage, sitemaps);
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'substrate');
    
    return {
      sitemaps,
      indexCoverage,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    
    // Update progress with error
    setProgress(userId, 'substrate', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    return {
      sitemaps: [],
      indexCoverage: {},
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * CRAWL DIMENSION - Crawl Budget & Server Health
 * Analyzes crawl frequency, response times, and server errors
 * 
 * NOTE: GSC API limitation - crawl stats not available programmatically
 * This provides informational insights directing users to manual monitoring
 */
async function analyzeCrawlDimension(pool, userId, siteUrl) {
  console.log('🤖 Analyzing CRAWL (Crawl Budget Efficiency)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'crawl', {
      status: 'fetching_crawl_stats',
      message: 'Checking crawl statistics...',
      percent: 10
    });
    
    const crawlData = await fetchCrawlStats(pool, userId, siteUrl);
    
    setProgress(userId, 'crawl', {
      status: 'analyzing_crawl_health',
      message: 'Analyzing crawl efficiency...',
      percent: 60
    });
    
    const health = await analyzeCrawlHealth(crawlData);
    
    setProgress(userId, 'crawl', {
      status: 'complete',
      message: 'Crawl analysis complete',
      percent: 100
    });
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'crawl');
    
    return {
      crawlStats: crawlData,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    
    // Update progress with error
    setProgress(userId, 'crawl', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    clearProgress(userId, 'crawl');
    
    return {
      crawlStats: {},
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * SITEMAP DIMENSION - Sitemap Structure & Quality
 * Validates sitemap.xml files and ensures proper page discovery
 */
async function analyzeSitemapDimension(pool, userId, siteUrl) {
  console.log('🗺️  Analyzing SITEMAP (Sitemap Quality)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'sitemap', {
      status: 'validating_sitemaps',
      message: 'Validating sitemap structure...',
      percent: 20
    });
    
    const sitemapData = await validateSitemaps(pool, userId, siteUrl);
    
    setProgress(userId, 'sitemap', {
      status: 'analyzing_sitemap_health',
      message: 'Analyzing sitemap health...',
      percent: 70
    });
    
    const health = await analyzeSitemapHealth(sitemapData);
    
    setProgress(userId, 'sitemap', {
      status: 'complete',
      message: 'Sitemap analysis complete',
      percent: 100
    });
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'sitemap');
    
    return {
      sitemapData,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    
    // Update progress with error
    setProgress(userId, 'sitemap', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    clearProgress(userId, 'sitemap');
    
    return {
      sitemapData: { sitemaps: [], totalURLs: 0, validation: {} },
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * REDIRECT DIMENSION - Redirect Chain & Error Management
 * Analyzes 404 errors, server errors, and redirect issues
 */
async function analyzeRedirectDimension(pool, userId, siteUrl) {
  console.log('🔗 Analyzing REDIRECT (Redirect & Error Management)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'redirect', {
      status: 'starting',
      message: 'Starting redirect analysis...',
      percent: 5
    });
    
    // Pass progress callback to track URL inspection
    const progressCallback = (progress) => {
      // Convert inspection progress to overall progress (5% to 90%)
      const overallPercent = 5 + Math.round((progress.percent / 100) * 85);
      setProgress(userId, 'redirect', {
        status: 'inspecting_urls',
        message: `Inspecting URLs: ${progress.completed}/${progress.total}`,
        percent: overallPercent,
        urlsCompleted: progress.completed,
        urlsTotal: progress.total,
        estimatedSecondsRemaining: progress.estimatedSecondsRemaining
      });
    };
    
    const redirectData = await analyzeRedirectsAndErrors(pool, userId, siteUrl, progressCallback);
    
    setProgress(userId, 'redirect', {
      status: 'analyzing_redirect_health',
      message: 'Calculating redirect health...',
      percent: 95
    });
    
    const health = await analyzeRedirectHealth(redirectData);
    
    setProgress(userId, 'redirect', {
      status: 'complete',
      message: 'Redirect analysis complete',
      percent: 100
    });
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'redirect');
    
    return {
      redirectData,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    
    // Update progress with error
    setProgress(userId, 'redirect', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    clearProgress(userId, 'redirect');
    
    return {
      redirectData: { totalErrors: 0, notFound: {}, serverError: {}, accessDenied: {}, redirect: {} },
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * DIMENSION 2: LATTICE (Mineralogy/Crystal Order)
 * Analyze topic cluster structure
 */
async function analyzeLatticeDimension(pool, userId, siteUrl) {
  console.log('💎 Analyzing LATTICE (Topic Clusters)...');
  
  try {
    const cannibalization = await analyzeCannibalization(pool, userId, siteUrl);
    const health = await analyzeLatticeHealth(cannibalization);
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    return {
      cannibalization,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    return {
      cannibalization: [],
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * DIMENSION 3: SYNAPSE (Neuroscience/Systems Theory)
 * Analyze CTR efficiency and neural pathways
 */
async function analyzeSynapseDimension(pool, userId, siteUrl) {
  console.log('🧠 Analyzing SYNAPSE (CTR Neural Pathways)...');
  
  try {
    const quickWins = await analyzeQuickWins(pool, userId, siteUrl);
    const cognitiveDissonance = await analyzeCognitiveDissonance(pool, userId, siteUrl);
    const health = await analyzeSynapseHealth(quickWins, cognitiveDissonance);
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    return {
      quickWins,
      cognitiveDissonance,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    return {
      quickWins: [],
      cognitiveDissonance: [],
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * DIMENSION 4: RESONANCE (Acoustic Physics/Harmonics)
 * Analyze intent alignment and device/country context
 */
async function analyzeResonanceDimension(pool, userId, siteUrl) {
  console.log('🎵 Analyzing RESONANCE (Intent Frequency)...');
  
  try {
    const context = await analyzeResonanceContext(pool, userId, siteUrl);
    const health = await analyzeResonanceHealth(context);
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    return {
      context,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    return {
      context: {},
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * DIMENSION 5: WEAVE (Grand Tapestry/The Fates)
 * Analyze backlink profile and external link structure
 */
async function analyzeWeaveDimension(siteUrl) {
  console.log('🕸️  Analyzing WEAVE (Backlink Tapestry)...');
  
  try {
    const domain = getDomainFromUrl(siteUrl);
    
    const [domainMetrics, referringDomains, anchorProfile, topLinkedPages] = await Promise.all([
      getDomainMetrics(domain),
      getReferringDomains(domain),
      getAnchorTextProfile(domain),
      getTopLinkedPages(domain)
    ]);
    
    const health = await analyzeWeaveHealth({
      domainMetrics,
      referringDomains,
      anchorProfile,
      topLinkedPages
    });
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    return {
      domainMetrics,
      referringDomains,
      anchorProfile,
      topLinkedPages,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    return {
      domainMetrics: {},
      referringDomains: {},
      anchorProfile: {},
      topLinkedPages: [],
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * DIMENSION 6: ELIXIR (Alchemy/Transmutation)
 * Analyze transmutation potential and catalyst opportunities
 */
async function analyzeElixirDimension(pool, userId, siteUrl) {
  console.log('⚗️  Analyzing ELIXIR (Transmutation Alchemy)...');
  
  try {
    const quickWins = await analyzeQuickWins(pool, userId, siteUrl);
    const catalysts = await analyzeCatalysts(pool, userId, siteUrl);
    const health = await analyzeElixirHealth(catalysts, quickWins);
    
    console.log(`   └─ Score: ${health.score}/100 (${health.status})`);
    
    return {
      quickWins,
      catalysts,
      health
    };
  } catch (error) {
    console.error('   └─ Error:', error.message);
    return {
      quickWins: [],
      catalysts: [],
      health: { score: 0, status: 'error', metrics: {}, insights: [] }
    };
  }
}

/**
 * INVENTORY DIMENSION (Content Performance)
 * Analyze content inventory and keyword performance
 * Used by Content Opportunity Protocol - Step 1
 */
async function analyzeInventoryDimension(pool, userId, siteUrl) {
  console.log('📚 Analyzing INVENTORY (Content Performance)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'inventory', {
      status: 'fetching_gsc_data',
      message: 'Fetching GSC query data...',
      percent: 10
    });
    
    // Calculate date range (last 16 months for maximum GSC data)
    const endDate = getDateDaysAgo(1); // Yesterday
    const startDate = getDateDaysAgo(480); // ~16 months ago
    
    // Update progress
    setProgress(userId, 'inventory', {
      status: 'analyzing_content',
      message: 'Analyzing content performance...',
      percent: 50
    });
    
    // Analyze content inventory
    const inventoryAnalysis = await analyzeContentInventory(pool, userId, siteUrl, startDate, endDate);
    
    // Update progress
    setProgress(userId, 'inventory', {
      status: 'complete',
      message: 'Content inventory analysis complete',
      percent: 100
    });
    
    console.log(`   └─ Score: ${inventoryAnalysis.healthScore}/100 (${inventoryAnalysis.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'inventory');
    
    // Format response to match E.V.O. dimension structure
    return {
      health: {
        score: inventoryAnalysis.healthScore,
        status: inventoryAnalysis.status,
        metrics: inventoryAnalysis.metrics,
        insights: inventoryAnalysis.insights
      }
    };
  } catch (error) {
    // Enhanced error logging with full context
    console.error('❌ Error in analyzeInventoryDimension:');
    console.error('   └─ User ID:', userId);
    console.error('   └─ Site URL:', siteUrl);
    console.error('   └─ Error Message:', error.message);
    console.error('   └─ Error Stack:', error.stack);
    if (error.response) {
      console.error('   └─ Response Data:', error.response.data);
    }
    
    // Update progress with error
    setProgress(userId, 'inventory', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    // Determine if this is an authentication issue or a data issue
    const isAuthError = error.message?.includes('authentication') || 
                       error.message?.includes('expired') || 
                       error.message?.includes('log back in');
    const isPermissionError = error.message?.includes('Access denied') || 
                             error.message?.includes('permission');
    const isNoDataError = error.message?.includes('No search data') || 
                         error.message?.includes('not received any search traffic');
    const isNoDataInRange = error.message?.includes('No user data') ||
                           error.message?.includes('no data in date range');
    
    let recommendation = 'Check your Google Search Console connection and try again.';
    
    if (isAuthError) {
      recommendation = 'Please log out of Kinetic and log back in to reconnect your Google Search Console account.';
    } else if (isPermissionError) {
      recommendation = 'Verify that the property is verified in Google Search Console and you have "Owner" or "Full User" permission level.';
    } else if (isNoDataError || isNoDataInRange) {
      recommendation = 'Wait for Google Search Console to collect search data for this property (typically 1-2 days after verification), or select a different property that has existing data.';
    }
    
    return {
      health: { 
        score: 0, 
        status: 'error', 
        metrics: {
          totalPages: 0,
          rankingKeywords: 0,
          avgPosition: 0,
          contentCoverage: 0
        }, 
        insights: [{
          type: 'ERROR',
          severity: 'critical',
          message: `Failed to analyze content inventory: ${error.message}`,
          recommendation
        }]
      }
    };
  }
}

/**
 * KEYWORD OPPORTUNITIES DIMENSION (Keyword Discovery)
 * Analyze keyword opportunities from GSC query data
 * Used by Content Opportunity Protocol - Step 2
 */
async function analyzeKeywordOpportunitiesDimension(pool, userId, siteUrl) {
  console.log('🔍 Analyzing KEYWORD OPPORTUNITIES (Keyword Discovery)...');
  
  try {
    // Initialize progress
    setProgress(userId, 'keyword_opportunities', {
      status: 'fetching_gsc_data',
      message: 'Fetching GSC query data...',
      percent: 10
    });
    
    // Calculate date range (last 16 months for maximum GSC data)
    const endDate = getDateDaysAgo(1); // Yesterday
    const startDate = getDateDaysAgo(480); // ~16 months ago
    
    // Update progress
    setProgress(userId, 'keyword_opportunities', {
      status: 'analyzing_keywords',
      message: 'Analyzing keyword opportunities...',
      percent: 50
    });
    
    // Analyze keyword opportunities
    const keywordAnalysis = await analyzeKeywordDiscovery(pool, userId, siteUrl, startDate, endDate);
    
    // Update progress
    setProgress(userId, 'keyword_opportunities', {
      status: 'complete',
      message: 'Keyword discovery analysis complete',
      percent: 100
    });
    
    console.log(`   └─ Score: ${keywordAnalysis.healthScore}/100 (${keywordAnalysis.status})`);
    
    // Clear progress on completion
    clearProgress(userId, 'keyword_opportunities');
    
    // Format response to match E.V.O. dimension structure
    return {
      health: {
        score: keywordAnalysis.healthScore,
        status: keywordAnalysis.status,
        metrics: keywordAnalysis.metrics,
        insights: keywordAnalysis.insights
      }
    };
  } catch (error) {
    // Enhanced error logging with full context
    console.error('❌ Error in analyzeKeywordOpportunitiesDimension:');
    console.error('   └─ User ID:', userId);
    console.error('   └─ Site URL:', siteUrl);
    console.error('   └─ Error Message:', error.message);
    console.error('   └─ Error Stack:', error.stack);
    if (error.response) {
      console.error('   └─ Response Data:', error.response.data);
    }
    
    // Update progress with error
    setProgress(userId, 'keyword_opportunities', {
      status: 'error',
      message: `Error: ${error.message}`,
      percent: 0
    });
    
    // Determine if this is an authentication issue or a data issue
    const isAuthError = error.message?.includes('authentication') || 
                       error.message?.includes('expired') || 
                       error.message?.includes('log back in');
    const isPermissionError = error.message?.includes('Access denied') || 
                             error.message?.includes('permission');
    const isNoDataError = error.message?.includes('No search data') || 
                         error.message?.includes('not received any search traffic');
    const isNoDataInRange = error.message?.includes('No user data') ||
                           error.message?.includes('no data in date range');
    
    let recommendation = 'Check your Google Search Console connection and try again.';
    
    if (isAuthError) {
      recommendation = 'Please log out of Kinetic and log back in to reconnect your Google Search Console account.';
    } else if (isPermissionError) {
      recommendation = 'Verify that the property is verified in Google Search Console and you have "Owner" or "Full User" permission level.';
    } else if (isNoDataError || isNoDataInRange) {
      recommendation = 'Wait for Google Search Console to collect search data for this property (typically 1-2 days after verification), or select a different property that has existing data.';
    }
    
    return {
      health: { 
        score: 0, 
        status: 'error', 
        metrics: {
          totalQueries: 0,
          lowCTROpportunities: 0,
          page2QuickWins: 0,
          highVolumeOpportunities: 0,
          zeroClickQueries: 0,
          totalImpressions: 0,
          avgCTR: 0,
          avgPosition: 0,
          potentialTrafficGain: 0
        }, 
        insights: [{
          type: 'ERROR',
          severity: 'critical',
          message: `Failed to analyze keyword opportunities: ${error.message}`,
          recommendation
        }]
      }
    };
  }
}

/**
 * Detect Emergence Patterns Across Dimensions
 * Identifies interconnections and cascading effects
 */
async function detectEmergencePatterns(dimensionalData) {
  const patterns = [];
  
  const { substrate, lattice, synapse, resonance, weave, elixir } = dimensionalData;
  
  // Pattern 1: ROOT_ROT_SPREAD (Substrate → Lattice)
  if (substrate.health.score < 50 && lattice.health.score < 60) {
    patterns.push({
      type: 'ROOT_ROT_SPREAD',
      severity: 'high',
      dimensions: ['substrate', 'lattice'],
      insight: `Substrate decay (${substrate.health.score}/100) is fracturing the lattice (${lattice.health.score}/100) - indexation issues affecting topic structure`,
      affectedMetrics: {
        excludedPages: substrate.health.metrics.totalExcluded,
        fractures: lattice.health.metrics.totalFractures
      },
      recommendation: 'Fix substrate issues before optimizing topic clusters - root rot must be treated first'
    });
  }
  
  // Pattern 2: COGNITIVE_CASCADE (Synapse → Resonance)
  if (synapse.health.score < 60 && resonance.health.score < 60) {
    patterns.push({
      type: 'COGNITIVE_CASCADE',
      severity: 'medium',
      dimensions: ['synapse', 'resonance'],
      insight: `Synaptic blockage (${synapse.health.metrics.cognitiveDissonanceCount} pages) combined with resonance misalignment creates cascading CTR failure`,
      affectedMetrics: {
        cognitiveDissonance: synapse.health.metrics.cognitiveDissonanceCount,
        mobileDesktopRatio: resonance.health.metrics.mobileDesktopRatio
      },
      recommendation: 'Optimize SERP snippets for mobile devices - address both title/meta and mobile UX'
    });
  }
  
  // Pattern 3: THREAD_DISSOLUTION (Weave → Lattice)
  if (weave.health.score < 50 && lattice.health.metrics.totalFractures > 20) {
    patterns.push({
      type: 'THREAD_DISSOLUTION',
      severity: 'high',
      dimensions: ['weave', 'lattice'],
      insight: `Weak backlink profile (DR ${weave.health.metrics.domainRating}) allows lattice drift - authority decay enabling cannibalization`,
      affectedMetrics: {
        domainRating: weave.health.metrics.domainRating,
        referringDomains: weave.health.metrics.referringDomains,
        fractures: lattice.health.metrics.totalFractures
      },
      recommendation: 'Build external links to strengthen authority before consolidating topics'
    });
  }
  
  // Pattern 4: CRYSTALLIZATION (Lattice + Weave synergy)
  if (lattice.health.score >= 70 && weave.health.score >= 70) {
    patterns.push({
      type: 'CRYSTALLIZATION',
      severity: 'positive',
      dimensions: ['lattice', 'weave'],
      insight: `Strong topic structure (coherence ${lattice.health.metrics.avgCoherence}%) + strong backlinks (DR ${weave.health.metrics.domainRating}) = authority amplification`,
      affectedMetrics: {
        coherence: lattice.health.metrics.avgCoherence,
        domainRating: weave.health.metrics.domainRating
      },
      recommendation: 'Leverage this synergy - internal link pillar pages and build backlinks to cluster hubs'
    });
  }
  
  // Pattern 5: ALCHEMICAL_READINESS (Substrate + Elixir synergy)
  if (substrate.health.score >= 70 && elixir.health.metrics.highPotentialTransmutations >= 10) {
    patterns.push({
      type: 'ALCHEMICAL_READINESS',
      severity: 'positive',
      dimensions: ['substrate', 'elixir'],
      insight: `Healthy substrate (${substrate.health.score}/100) + ${elixir.health.metrics.highPotentialTransmutations} high-potential transmutations = rapid ranking gains possible`,
      affectedMetrics: {
        substrateScore: substrate.health.score,
        transmutations: elixir.health.metrics.highPotentialTransmutations,
        expectedGain: elixir.health.metrics.expectedTrafficGain
      },
      recommendation: 'Implement structured data on high-potential pages immediately - foundation is solid'
    });
  }
  
  // Pattern 6: CATALYST_GAP (Elixir opportunity)
  if (elixir.health.metrics.highPotentialTransmutations < 5 && elixir.catalysts.length > 50) {
    patterns.push({
      type: 'CATALYST_GAP',
      severity: 'opportunity',
      dimensions: ['elixir'],
      insight: `${elixir.catalysts.length} striking distance keywords but only ${elixir.health.metrics.highPotentialTransmutations} have high transmutation scores`,
      affectedMetrics: {
        catalysts: elixir.catalysts.length,
        highPotential: elixir.health.metrics.highPotentialTransmutations
      },
      recommendation: 'Focus on low-difficulty, high-volume keywords first for quick wins'
    });
  }
  
  // Pattern 7: UNTAPPED_RESONANCE (Substrate + Resonance)
  if (substrate.health.score >= 70 && resonance.health.metrics.geographicReach >= 10 && synapse.health.score < 60) {
    patterns.push({
      type: 'UNTAPPED_RESONANCE',
      severity: 'opportunity',
      dimensions: ['substrate', 'resonance', 'synapse'],
      insight: `Strong indexation + global reach (${resonance.health.metrics.geographicReach} countries) but weak CTR = dormant frequency not being heard`,
      affectedMetrics: {
        substrateScore: substrate.health.score,
        geographicReach: resonance.health.metrics.geographicReach,
        synapseScore: synapse.health.score
      },
      recommendation: 'Optimize SERP snippets to convert impressions into clicks - the infrastructure is ready'
    });
  }
  
  return patterns;
}

/**
 * Generate Unified System Intelligence
 * Creates higher-order insights about overall SEO health
 */
async function generateSystemIntelligence(dimensionalData, emergencePatterns) {
  const { substrate, lattice, synapse, resonance, weave, elixir } = dimensionalData;
  
  // Calculate overall emergence score
  const dimensionScores = [
    substrate.health.score,
    lattice.health.score,
    synapse.health.score,
    resonance.health.score,
    weave.health.score,
    elixir.health.score
  ];
  
  const avgScore = dimensionScores.reduce((sum, s) => sum + s, 0) / dimensionScores.length;
  
  // Determine overall emergence level
  let overallEmergence = 'high';
  if (avgScore < 40) overallEmergence = 'low';
  else if (avgScore < 70) overallEmergence = 'moderate';
  
  // Identify primary blockage (lowest scoring dimension)
  const dimensionNames = ['substrate', 'lattice', 'synapse', 'resonance', 'weave', 'elixir'];
  const minScore = Math.min(...dimensionScores);
  const primaryBlockage = dimensionNames[dimensionScores.indexOf(minScore)];
  
  // Identify cascade risks
  const cascadeRisks = emergencePatterns
    .filter(p => ['ROOT_ROT_SPREAD', 'COGNITIVE_CASCADE', 'THREAD_DISSOLUTION'].includes(p.type))
    .map(p => p.type.toLowerCase());
  
  // Identify synergy opportunities
  const synergyOpportunities = emergencePatterns
    .filter(p => ['CRYSTALLIZATION', 'ALCHEMICAL_READINESS', 'UNTAPPED_RESONANCE'].includes(p.type))
    .map(p => p.type.toLowerCase());
  
  // Calculate readiness for transmutation
  const readinessForTransmutation = Math.round(
    (substrate.health.score * 0.2) +
    (lattice.health.score * 0.15) +
    (synapse.health.score * 0.15) +
    (weave.health.score * 0.2) +
    (elixir.health.score * 0.3)
  );
  
  return {
    overallEmergence,
    avgHealthScore: Math.round(avgScore),
    primaryBlockage,
    readinessForTransmutation,
    cascadeRisks,
    synergyOpportunities,
    dimensionScores: {
      substrate: substrate.health.score,
      lattice: lattice.health.score,
      synapse: synapse.health.score,
      resonance: resonance.health.score,
      weave: weave.health.score,
      elixir: elixir.health.score
    }
  };
}

/**
 * Generate Action Priorities
 * Orders recommendations by impact and urgency
 */
async function generateActionPriorities(emergencePatterns, dimensionalData) {
  const actions = [];
  
  // Extract insights from all dimensions
  Object.entries(dimensionalData).forEach(([dimension, data]) => {
    if (data.health && data.health.insights) {
      data.health.insights.forEach(insight => {
        actions.push({
          dimension,
          type: insight.type,
          severity: insight.severity,
          message: insight.message,
          recommendation: insight.recommendation,
          priority: calculateActionPriority(insight.severity, dimension, data.health.score)
        });
      });
    }
  });
  
  // Add emergence pattern actions
  emergencePatterns.forEach(pattern => {
    actions.push({
      dimension: 'cross-dimensional',
      type: pattern.type,
      severity: pattern.severity,
      message: pattern.insight,
      recommendation: pattern.recommendation,
      priority: calculateEmergencePriority(pattern.severity, pattern.dimensions.length),
      dimensionsAffected: pattern.dimensions
    });
  });
  
  // Sort by priority (highest first)
  actions.sort((a, b) => b.priority - a.priority);
  
  return actions;
}

/**
 * Calculate action priority score
 */
function calculateActionPriority(severity, dimension, healthScore) {
  let score = 50;
  
  // Severity impact
  if (severity === 'high') score += 30;
  else if (severity === 'medium') score += 15;
  else if (severity === 'info') score -= 10;
  
  // Dimension criticality (substrate and weave are foundational)
  if (dimension === 'substrate') score += 15;
  else if (dimension === 'weave') score += 10;
  
  // Health score impact (lower health = higher priority)
  score += (100 - healthScore) / 5;
  
  return Math.round(score);
}

/**
 * Calculate emergence pattern priority
 */
function calculateEmergencePriority(severity, dimensionCount) {
  let score = 60; // Emergence patterns are generally high priority
  
  if (severity === 'high') score += 30;
  else if (severity === 'medium') score += 15;
  else if (severity === 'positive') score = 40; // Lower priority than issues
  else if (severity === 'opportunity') score = 35;
  
  // More dimensions affected = higher priority
  score += dimensionCount * 5;
  
  return Math.round(score);
}

module.exports = {
  synthesizeDimensions,
  analyzeSubstrateDimension,
  analyzeCrawlDimension,
  analyzeSitemapDimension,
  analyzeRedirectDimension,
  analyzeLatticeDimension,
  analyzeSynapseDimension,
  analyzeResonanceDimension,
  analyzeWeaveDimension,
  analyzeElixirDimension,
  analyzeInventoryDimension,
  analyzeKeywordOpportunitiesDimension,
  detectEmergencePatterns,
  generateSystemIntelligence,
  generateActionPriorities,
  EmergencePatterns,
  getProgress  // Export progress getter
};
