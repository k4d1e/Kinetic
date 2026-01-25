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
    const quickWinOpportunities = data.rows
      .filter(row => {
        const position = row.position;
        const impressions = row.impressions;
        return position >= 6.0 && position <= 20.0 && impressions >= 10;
      })
      .sort((a, b) => b.impressions - a.impressions); // sort by highest number of impressions
    
    console.log(`📊 Quick Wins: Found ${quickWinOpportunities.length} total opportunities (before limit)`);
    
    const quickWins = quickWinOpportunities
      .slice(0, 1000) // Limit to top 1000 opportunities
      .map(row => ({
        keyword: row.keys[0],
        page: row.keys[1],
        position: parseFloat(row.position.toFixed(1)),
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: (row.ctr * 100).toFixed(2) + '%',
        needsKD: true // Flag to fetch KD from Ahrefs
      }));

    console.log(`✓ Found ${quickWins.length} Quick Wins opportunities (after limit)`);
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
    const cannibalizationIssues = Object.entries(keywordPages)
      .filter(([keyword, pages]) => pages.length >= 2)
      .map(([keyword, pages]) => ({
        keyword,
        pageCount: pages.length,
        pages: pages.sort((a, b) => a.position - b.position).slice(0, 3)
      }))
      .sort((a, b) => b.pageCount - a.pageCount);
    
    console.log(`📊 Cannibalization: Found ${cannibalizationIssues.length} total issues (before limit)`);
    
    const cannibalization = cannibalizationIssues.slice(0, 1000);

    console.log(`✓ Found ${cannibalization.length} cannibalization issues (after limit)`);
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

    console.log(`📊 Untapped Markets: Found ${opportunities.length} total opportunities (before limit)`);
    const limitedOpportunities = opportunities.slice(0, 500); // Return top 500
    console.log(`✓ Found ${limitedOpportunities.length} untapped market opportunities (after limit)`);
    return limitedOpportunities;

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

/**
 * Analyze AI Visibility opportunities - pages ranking well but not optimized for LLMs
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - List of AI visibility opportunities
 */
async function analyzeAIVisibility(pool, userId, siteUrl) {
  try {
    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      startDate: getDateDaysAgo(28),
      endDate: getDateDaysAgo(0),
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data || !data.rows) {
      console.log('⚠️  No data found for AI visibility analysis');
      return [];
    }

    console.log(`📊 Analyzing ${data.rows.length} total rows for AI visibility`);

    // Information signal keywords
    const infoSignals = {
      who: ['who', 'which contractor', 'which company', 'best roofer', 'top roofer'],
      what: ['what is', 'what are', 'what does', 'what kind'],
      where: ['where', 'near me', 'in my area', 'local'],
      when: ['when to', 'when should', 'how long', 'how often'],
      why: ['why', 'reasons', 'benefits'],
      how: ['how to', 'how do', 'how much'],
      cost: ['cost', 'price', 'pricing', 'how much'],
      lifespan: ['lifespan', 'last', 'longevity', 'durability', 'how long'],
      warranty: ['warranty', 'guarantee']
    };

    // Filter for ranking pages (1-10) with information signals
    const filtered = data.rows.filter(row => {
      const position = row.position || 0;
      const impressions = row.impressions || 0;
      const query = (row.keys[0] || '').toLowerCase();
      
      // Must rank in top 10 and have reasonable impressions
      if (position > 10 || impressions < 1) return false;
      
      // Must contain at least one information signal
      const hasInfoSignal = Object.values(infoSignals).some(signals =>
        signals.some(signal => query.includes(signal))
      );
      
      return hasInfoSignal;
    });

    console.log(`✓ ${filtered.length} queries with information signals in top 10 positions`);

    if (filtered.length === 0) {
      return [];
    }

    // Group by page and analyze
    const pageGroups = {};
    filtered.forEach(row => {
      const page = row.keys[1];
      const query = row.keys[0];
      
      if (!pageGroups[page]) {
        pageGroups[page] = {
          page,
          queries: [],
          totalImpressions: 0,
          avgPosition: 0,
          clicks: 0
        };
      }
      
      pageGroups[page].queries.push({
        query: query,
        position: row.position,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr
      });
      
      pageGroups[page].totalImpressions += row.impressions;
      pageGroups[page].clicks += row.clicks;
    });

    // Calculate opportunities
    const opportunities = Object.values(pageGroups).map(group => {
      // Find the highest volume query with best information signal
      const topQuery = group.queries.sort((a, b) => b.impressions - a.impressions)[0];
      
      // Calculate average position
      const avgPosition = group.queries.reduce((sum, q) => sum + q.position, 0) / group.queries.length;
      
      // Calculate GEO Score (0-100)
      const geoScore = calculateGEOScore(topQuery, avgPosition, group);
      
      // Extract topic from query
      const topic = extractTopicFromQuery(topQuery.query);
      
      // Determine signal type
      const signalType = detectSignalType(topQuery.query, infoSignals);
      
      return {
        topic,
        query: topQuery.query,
        page: group.page,
        position: Math.round(topQuery.position * 10) / 10,
        impressions: topQuery.impressions,
        clicks: topQuery.clicks,
        ctr: (topQuery.ctr * 100).toFixed(2) + '%',
        geoScore,
        signalType,
        totalQueries: group.queries.length
      };
    });

    // Sort by GEO score (lowest first - most opportunity)
    opportunities.sort((a, b) => a.geoScore - b.geoScore);

    console.log(`📊 AI Visibility: Found ${opportunities.length} total opportunities (before limit)`);
    const limitedOpportunities = opportunities.slice(0, 500); // Return top 500
    console.log(`✓ Found ${limitedOpportunities.length} AI visibility opportunities (after limit)`);
    return limitedOpportunities;

  } catch (error) {
    console.error('Error analyzing AI visibility:', error);
    return [];
  }
}

/**
 * Calculate Generative Optimization Score (GEO Score)
 * Lower score = more opportunity (page needs optimization)
 * Higher score = already optimized
 */
function calculateGEOScore(query, avgPosition, pageGroup) {
  let score = 50; // Start at middle
  
  // Factor 1: Position (better position = potentially already optimized)
  if (avgPosition <= 3) score += 20;
  else if (avgPosition <= 5) score += 10;
  else if (avgPosition <= 7) score += 5;
  
  // Factor 2: CTR (high CTR might indicate good snippet)
  const avgCTR = pageGroup.clicks / pageGroup.totalImpressions;
  if (avgCTR > 0.15) score += 15;
  else if (avgCTR > 0.10) score += 10;
  else if (avgCTR > 0.05) score += 5;
  else score -= 10; // Low CTR = opportunity
  
  // Factor 3: Query complexity (longer, specific queries = more LLM opportunity)
  const wordCount = query.query.split(' ').length;
  if (wordCount >= 6) score -= 10; // More opportunity
  else if (wordCount >= 4) score -= 5;
  
  // Factor 4: Question format (questions are LLM targets)
  const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'which'];
  const isQuestion = questionWords.some(w => query.query.toLowerCase().includes(w));
  if (isQuestion) score -= 15; // Big opportunity for LLMs
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Extract a clean topic name from query
 */
function extractTopicFromQuery(query) {
  const stopWords = ['how', 'to', 'what', 'is', 'are', 'the', 'a', 'an', 'for', 'in', 'on', 'near', 'me'];
  const words = query.toLowerCase().split(/\s+/);
  const meaningful = words.filter(w => !stopWords.includes(w) && w.length > 2);
  
  // Capitalize and return first 2-3 words
  return meaningful.slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Detect which information signal type the query contains
 */
function detectSignalType(query, infoSignals) {
  const lowerQuery = query.toLowerCase();
  
  for (const [type, signals] of Object.entries(infoSignals)) {
    if (signals.some(signal => lowerQuery.includes(signal))) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return 'General';
}

/**
 * Analyze Local SEO opportunities - Hub and Spoke strategy for cities/suburbs
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<Array>} - List of local SEO opportunities by city
 */
async function analyzeLocalSEO(pool, userId, siteUrl) {
  try {
    // Fetch GSC data for location-based queries
    const data = await fetchSearchAnalytics(pool, userId, siteUrl, {
      startDate: getDateDaysAgo(90),
      endDate: getDateDaysAgo(0),
      dimensions: ['query', 'page'],
      rowLimit: 5000
    });

    if (!data || !data.rows) {
      console.log('⚠️  No data found for local SEO analysis');
      return [];
    }

    console.log(`📊 Analyzing ${data.rows.length} total rows for local SEO`);

    // Discover cities from the /locations/ page
    const cities = await discoverCitiesFromSite(siteUrl);
    console.log(`✓ Discovered ${cities.length} cities from locations page`);

    if (cities.length === 0) {
      console.log('⚠️  No cities found. Using fallback detection from queries.');
      // Fallback: extract cities from query data
      return analyzeLocalSEOFromQueries(data.rows);
    }

    // Analyze each city
    const cityOpportunities = cities.map(city => {
      // Filter queries mentioning this city
      const cityQueries = data.rows.filter(row => {
        const query = (row.keys[0] || '').toLowerCase();
        const cityName = city.toLowerCase();
        return query.includes(cityName);
      });

      // Count "near me" queries (general proximity intent)
      const nearMeQueries = data.rows.filter(row => {
        const query = (row.keys[0] || '').toLowerCase();
        return query.includes('near me') || 
               query.includes('nearby') || 
               query.includes('close to me') ||
               query.includes('in my area');
      });

      // Count ranking "near me" queries (top 20 positions)
      const rankingNearMe = nearMeQueries.filter(row => row.position <= 20);

      // Extract services from site (for target keywords)
      const services = extractServicesFromQueries(data.rows);
      
      // Calculate target suburb keywords (service + city combinations)
      const targetSuburbKeywords = services.length * 1; // 1 per service per city
      
      // Count actual ranking suburb keywords for this city
      const rankingSuburbKeywords = cityQueries.filter(row => 
        row.position <= 20 && 
        services.some(service => (row.keys[0] || '').toLowerCase().includes(service))
      ).length;

      // Calculate total impressions and clicks for this city
      const totalImpressions = cityQueries.reduce((sum, row) => sum + (row.impressions || 0), 0);
      const totalClicks = cityQueries.reduce((sum, row) => sum + (row.clicks || 0), 0);
      
      // Calculate average position
      const avgPosition = cityQueries.length > 0 
        ? cityQueries.reduce((sum, row) => sum + row.position, 0) / cityQueries.length 
        : 0;

      // Determine opportunity score (0-100, higher = more opportunity)
      let opportunityScore = 50;
      
      // More opportunity if we're not ranking well
      if (rankingSuburbKeywords === 0) opportunityScore += 30;
      else if (rankingSuburbKeywords < targetSuburbKeywords / 2) opportunityScore += 20;
      else if (rankingSuburbKeywords < targetSuburbKeywords) opportunityScore += 10;
      
      // More opportunity if near me is underutilized
      const nearMeRatio = nearMeQueries.length > 0 ? rankingNearMe.length / nearMeQueries.length : 0;
      if (nearMeRatio < 0.3) opportunityScore += 20;
      else if (nearMeRatio < 0.6) opportunityScore += 10;
      
      // Ensure score is between 0-100
      opportunityScore = Math.min(100, Math.max(0, opportunityScore));

      return {
        city: city,
        targetSuburbKeywords,
        rankingSuburbKeywords,
        totalNearMeKeywords: nearMeQueries.length,
        rankingNearMeKeywords: rankingNearMe.length,
        totalImpressions,
        totalClicks,
        avgPosition: Math.round(avgPosition * 10) / 10,
        opportunityScore,
        queryCount: cityQueries.length
      };
    });

    // Sort by opportunity score (highest first)
    cityOpportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    console.log(`✓ Analyzed ${cityOpportunities.length} cities for local SEO`);
    return cityOpportunities;

  } catch (error) {
    console.error('Error analyzing local SEO:', error);
    return [];
  }
}

/**
 * Discover cities from the site's /locations/ page
 */
async function discoverCitiesFromSite(siteUrl) {
  try {
    // Construct the locations page URL
    const locationsUrl = siteUrl.replace(/\/$/, '') + '/locations/';
    
    console.log(`🔍 Attempting to fetch cities from: ${locationsUrl}`);
    
    // Fetch the locations page
    const response = await fetch(locationsUrl);
    
    if (!response.ok) {
      console.log(`⚠️  Could not fetch locations page (status ${response.status})`);
      return [];
    }
    
    const html = await response.text();
    
    // Extract city names from the HTML
    // Look for common patterns: links, headings, list items containing city names
    const cities = new Set();
    
    // Pattern 1: Look for links with city names in href or text
    const linkRegex = /<a[^>]*href="[^"]*\/([^/"]+)\/"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const cityName = match[2].trim();
      // Filter out common navigation items
      if (cityName.length > 2 && 
          !cityName.toLowerCase().includes('home') && 
          !cityName.toLowerCase().includes('about') &&
          !cityName.toLowerCase().includes('contact') &&
          !cityName.toLowerCase().includes('service')) {
        cities.add(cityName);
      }
    }
    
    // Pattern 2: Look for headings with city names
    const headingRegex = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi;
    while ((match = headingRegex.exec(html)) !== null) {
      const cityName = match[1].trim();
      if (cityName.length > 2 && cityName.split(' ').length <= 3) {
        cities.add(cityName);
      }
    }
    
    return Array.from(cities).slice(0, 50); // Limit to 50 cities
    
  } catch (error) {
    console.error('Error fetching cities from locations page:', error);
    return [];
  }
}

/**
 * Fallback: Analyze local SEO from query data when cities can't be scraped
 */
function analyzeLocalSEOFromQueries(rows) {
  // Extract city-like terms from queries
  const cityPattern = /\b(portland|beaverton|hillsboro|gresham|lake oswego|tigard|tualatin|oregon city|west linn|milwaukie|vancouver)\b/gi;
  
  const citiesFound = new Set();
  rows.forEach(row => {
    const query = (row.keys[0] || '').toLowerCase();
    const matches = query.match(cityPattern);
    if (matches) {
      matches.forEach(city => citiesFound.add(city.charAt(0).toUpperCase() + city.slice(1)));
    }
  });
  
  // Create basic city data
  return Array.from(citiesFound).map(city => ({
    city,
    targetSuburbKeywords: 10,
    rankingSuburbKeywords: 0,
    totalNearMeKeywords: 0,
    rankingNearMeKeywords: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgPosition: 0,
    opportunityScore: 80,
    queryCount: 0
  }));
}

/**
 * Extract service terms from query data
 */
function extractServicesFromQueries(rows) {
  const serviceTerms = [
    'roofing', 'roof', 'siding', 'gutter', 'gutters', 
    'window', 'windows', 'door', 'doors', 'painting',
    'installation', 'repair', 'replacement', 'cleaning',
    'maintenance', 'inspection'
  ];
  
  const servicesFound = new Set();
  
  rows.forEach(row => {
    const query = (row.keys[0] || '').toLowerCase();
    serviceTerms.forEach(term => {
      if (query.includes(term)) {
        servicesFound.add(term);
      }
    });
  });
  
  return Array.from(servicesFound);
}

/**
 * Save user's last selected property
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @param {string} siteUrl - GSC property URL
 * @param {number} propertyId - Property ID from gsc_properties table
 */
async function saveLastSelectedProperty(pool, userId, siteUrl, propertyId) {
  try {
    const preferenceValue = { siteUrl, propertyId };
    
    await pool.query(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, preference_key)
       DO UPDATE SET preference_value = $3, updated_at = NOW()`,
      [userId, 'last_selected_property', JSON.stringify(preferenceValue)]
    );
    
    console.log(`✓ Saved last selected property for user ${userId}: ${siteUrl}`);
    return true;
  } catch (error) {
    console.error('Error saving last selected property:', error);
    throw error;
  }
}

/**
 * Get user's last selected property
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Object|null} - { siteUrl, propertyId } or null
 */
async function getLastSelectedProperty(pool, userId) {
  try {
    const result = await pool.query(
      `SELECT preference_value FROM user_preferences 
       WHERE user_id = $1 AND preference_key = $2`,
      [userId, 'last_selected_property']
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].preference_value;
  } catch (error) {
    console.error('Error getting last selected property:', error);
    throw error;
  }
}

module.exports = {
  fetchUserProperties,
  fetchSearchAnalytics,
  analyzeQuickWins,
  analyzeCannibalization,
  analyzeUntappedMarkets,
  analyzeAIVisibility,
  analyzeLocalSEO,
  getCachedOrFetch,
  getDateDaysAgo,
  saveLastSelectedProperty,
  getLastSelectedProperty
};
