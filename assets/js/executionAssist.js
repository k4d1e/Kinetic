/**
 * Execution Assist Module
 * Generates industry-agnostic Cursor prompts for Sprint Plan Action Cards
 */

const ExecutionAssist = {
  modal: null,
  closeBtn: null,
  copyBtn: null,
  currentPrompt: null,

  /**
   * Initialize the module
   */
  init() {
    this.modal = document.getElementById('execution-assist-modal');
    this.closeBtn = this.modal?.querySelector('.execution-assist-modal-close');
    this.copyBtn = document.getElementById('prompt-copy-icon');
    
    if (!this.modal) {
      console.warn('⚠ Execution Assist modal not found in DOM');
      return;
    }

    // Event listeners
    this.closeBtn?.addEventListener('click', () => this.closeModal());
    this.copyBtn?.addEventListener('click', () => this.copyPrompt());
    
    // Close on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.closeModal();
      }
    });

    console.log('✓ Execution Assist module initialized');
  },

  /**
   * Get Active Protocol
   * Detects which protocol is currently active based on the mission title
   * @returns {string} Protocol key (e.g., 'meta_surgeon_protocol', 'gsc_indexation_protocol')
   */
  getActiveProtocol() {
    // Check if protocolDefinitions is loaded
    if (typeof protocolDefinitions === 'undefined') {
      console.error('❌ protocolDefinitions not loaded');
      return 'meta_surgeon_protocol'; // Default fallback
    }

    // Get mission title from the card
    const missionTitle = document.querySelector('.mission-title')?.textContent.trim();
    
    if (!missionTitle) {
      console.warn('⚠ Could not detect mission title, using default protocol');
      return 'meta_surgeon_protocol';
    }

    // Map mission title to protocol key
    for (const [key, protocol] of Object.entries(protocolDefinitions)) {
      if (protocol.missionTitle === missionTitle) {
        console.log(`✓ Detected active protocol: ${key}`);
        return key;
      }
    }

    // Fallback to default if no match found
    console.warn(`⚠ No protocol found for mission "${missionTitle}", using default`);
    return 'meta_surgeon_protocol';
  },

  /**
   * Extract context from the current sprint card page
   * @param {HTMLElement} pageElement - The sprint card page element
   * @returns {Object} Context object with mission, step, and description
   */
  extractPageContext(pageElement) {
    // Get mission title from the shared header
    const missionTitle = document.querySelector('.mission-title')?.textContent.trim() || 'Unknown Mission';
    
    // Get step header (e.g., "Step 1: Global Identity")
    const stepHeader = pageElement.querySelector('.step-header')?.textContent.trim() || '';
    
    // Get step body description
    const stepBody = pageElement.querySelector('.step-body')?.textContent.trim() || '';
    
    // Extract step number from the header
    const stepMatch = stepHeader.match(/Step (\d+)/);
    const stepNumber = stepMatch ? parseInt(stepMatch[1]) : null;
    
    // Extract step name (text after "Step N: ")
    const stepName = stepHeader.replace(/Step \d+:\s*/, '').trim();
    
    // Get active protocol and load its instructions
    const protocolKey = this.getActiveProtocol();
    let executionInstructions = null;
    
    if (typeof protocolDefinitions !== 'undefined' && protocolKey) {
      const protocol = protocolDefinitions[protocolKey];
      if (protocol && protocol.steps && stepNumber) {
        const stepIndex = stepNumber - 1; // Steps are 1-indexed, array is 0-indexed
        if (protocol.steps[stepIndex]) {
          executionInstructions = protocol.steps[stepIndex].executionInstructions || null;
        }
      }
    }
    
    if (!executionInstructions) {
      console.warn(`⚠ No execution instructions found for ${protocolKey} step ${stepNumber}`);
    }
    
    return {
      mission: missionTitle,
      stepNumber,
      stepName,
      stepHeader,
      stepBody,
      protocolKey,
      executionInstructions
    };
  },

  /**
   * Generate protocol-specific Cursor prompt
   * @param {Object} context - Page context from extractPageContext
   * @returns {string} Generated prompt
   */
  generatePrompt(context) {
    const { mission, stepNumber, stepName, executionInstructions, protocolKey } = context;
    
    if (!executionInstructions) {
      return `Error: Unable to generate prompt for ${mission} - Step ${stepNumber}: ${stepName}

No execution instructions found for this protocol step. Please ensure protocolDefinitions.js is properly loaded and contains executionInstructions for this step.`;
    }

    const fileName = executionInstructions.deliverable || this.sanitizeFileName(stepName) + '-plan.md';
    
    // Determine if this is a schema-based or analysis-based protocol
    const isSchemaProtocol = executionInstructions.schemaType !== undefined;
    const isAnalysisProtocol = executionInstructions.dataSource !== undefined;
    const isLinkProtocol = protocolKey === 'internal_link_expansion_protocol';
    const isContentPlanningProtocol = protocolKey === 'keyword_coverage_gap_protocol' && stepNumber === 4;

    // Generate appropriate prompt based on protocol type
    if (isSchemaProtocol) {
      return this.generateSchemaPrompt(context, fileName);
    } else if (isAnalysisProtocol) {
      return this.generateAnalysisPrompt(context, fileName);
    } else if (isLinkProtocol) {
      return this.generateLinkExpansionPrompt(context, fileName);
    } else if (isContentPlanningProtocol) {
      return this.generateContentPlanningPrompt(context, fileName);
    } else {
      return this.generateGenericPrompt(context, fileName);
    }
  },

  /**
   * Generate Schema Implementation Prompt (for protocols like Meta Surgeon)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Schema-focused prompt
   */
  generateSchemaPrompt(context, fileName) {
    const { mission, stepName, executionInstructions } = context;

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

SCHEMA TYPE: ${executionInstructions.schemaType}

INSTRUCTIONS:
1. Analyze the current website structure in this workspace
   - Detect the technology stack (HTML, React, Vue, Next.js, static site, etc.)
   - Identify all pages/components where ${executionInstructions.concept} should be implemented
   - Determine the best location for schema markup injection

2. Create a comprehensive implementation plan that includes:
   - Current state analysis: What structure currently exists?
   - Files that need modification: List specific files and their paths
   - Code additions required: Outline the schema markup structure
   - Implementation approach: How to integrate with existing code
   - Dependencies and order: What needs to be done first?
   - Testing strategy: How to verify the implementation works

3. Adapt to the detected technology:
   - For static HTML: Add JSON-LD script tags to <head> or before </body>
   - For React/Vue/Next: Create reusable schema components or use head management
   - For template engines: Inject schema through layout templates
   - For CMSs: Provide plugin recommendations or custom code injection

CONTEXT & REQUIREMENTS:
- Work with ANY file structure and technology stack
- Use schema.org vocabulary for maximum compatibility
- Ensure JSON-LD format for easy implementation
- Make schema dynamic (pull from site data, not hardcoded)
- Follow Google's Structured Data guidelines
- Ensure mobile responsiveness and accessibility
- Validate schema markup can be tested with Google's Rich Results Test

DELIVERABLE:
Create a detailed implementation plan saved as: ${fileName}

The plan should be actionable, technology-agnostic, and ready for immediate implementation regardless of the website's industry (e-commerce, local service, SaaS, restaurant, etc.).`;
  },

  /**
   * Generate Analysis/Optimization Prompt (for protocols like GSC Indexation)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Analysis-focused prompt
   */
  generateAnalysisPrompt(context, fileName) {
    const { mission, stepName, executionInstructions, stepNumber, diagnosedCause, protocolKey } = context;
    
    // Check if this is Content Opportunity Protocol Step 1 - use content-focused prompt
    if (protocolKey === 'keyword_coverage_gap_protocol' && stepNumber === 1) {
      return this.generateContentInventoryPrompt(context, fileName);
    }
    
    // Check if this is Content Opportunity Protocol Step 2 - use keyword discovery prompt
    if (protocolKey === 'keyword_coverage_gap_protocol' && stepNumber === 2) {
      return this.generateKeywordDiscoveryPrompt(context, fileName);
    }
    
    // Check if we have specific diagnostic data with URLs and strategies
    if (diagnosedCause && diagnosedCause.urls && diagnosedCause.strategies) {
      console.log('✓ Using data-driven prompt with diagnosed cause data');
      return this.generateDataDrivenAnalysisPrompt(context, fileName);
    }
    
    // Otherwise, use standard E.V.O. metrics approach (for indexation protocols)
    console.log('✓ Using standard E.V.O. metrics prompt');
    
    // Try to get E.V.O. data from the page
    const evoData = this.getEVODataForStep(stepNumber);
    
    // Build actual metrics section if E.V.O. data is available
    let actualMetricsSection = '';
    if (evoData) {
      actualMetricsSection = this.buildActualMetricsSection(evoData, executionInstructions);
    }

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

DATA SOURCE: ${executionInstructions.dataSource}

${actualMetricsSection}

INSTRUCTIONS:
1. Understand the data collection process
   - Identify how to access or export the required data
   - Determine what tools or APIs are needed
   - Plan the data extraction workflow

2. Create a comprehensive analysis plan that includes:
   - Data collection method: How to obtain the necessary data
   - Analysis framework: What metrics and patterns to look for
   - Issue identification: What problems indicate optimization opportunities
   - Prioritization criteria: Which issues to address first
   - Action items: Specific fixes and optimizations needed

3. Adapt to the available tools and access:
   - If API access is available: Provide code for automated data extraction
   - If manual export is needed: Guide the export and import process
   - If tools are required: Recommend specific tools (Screaming Frog, etc.)
   - If scripts are helpful: Create data processing and analysis scripts

4. Generate actionable insights:
   - Identify specific pages/URLs with issues
   - Quantify the impact of each issue type
   - Provide clear, prioritized recommendations
   - Include before/after success metrics

CONTEXT & REQUIREMENTS:
- Work with real site data from Google Search Console or site crawls
- Focus on ${executionInstructions.concept}
- Provide concrete, measurable recommendations
- Include data visualization or summary tables where helpful
- Ensure recommendations are technically feasible
- Prioritize high-impact, low-effort wins
- Consider crawl budget, user experience, and SEO impact

DELIVERABLE:
Create a detailed analysis and optimization plan saved as: ${fileName}

The plan should include:
- Executive summary of findings
- Detailed issue breakdown with examples
- Prioritized action items with implementation steps
- Expected impact and success metrics
- Testing and validation approach

Make the analysis actionable and ready for immediate implementation.`;
  },

  /**
   * Generate Content Inventory Prompt (for Content Opportunity Protocol - Step 1)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Content inventory-focused prompt
   */
  generateContentInventoryPrompt(context, fileName) {
    const { mission, stepName, executionInstructions, stepNumber } = context;
    
    // Try to get E.V.O. data from the page
    const evoData = this.getEVODataForStep(stepNumber);
    
    // Build actual metrics section if E.V.O. data is available
    let actualMetricsSection = '';
    if (evoData) {
      actualMetricsSection = this.buildContentInventoryMetricsSection(evoData, executionInstructions);
    }

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

DATA SOURCE: ${executionInstructions.dataSource}

${actualMetricsSection}

INSTRUCTIONS:
1. Conduct a comprehensive content inventory
   - Crawl all pages on the site or identify pages from sitemap
   - Extract target keywords from title tags, meta descriptions, and H1 tags
   - Map each page to its primary content focus and intent

2. Pull GSC data to map actual keyword performance
   - Connect to Google Search Console API or guide manual export
   - For each page URL, extract all queries it ranks for (with impressions, clicks, position)
   - Create a mapping: Page URL → Keywords → Current Positions → Traffic Data

3. Analyze content coverage and performance:
   - Identify pages with strong keyword rankings (positions 1-10)
   - Find pages with moderate rankings (positions 11-20) that need optimization
   - Detect pages with weak rankings (positions 21+) or no significant traffic
   - Calculate average position per page and content quality indicators

4. Identify content inventory insights:
   - Which pages are capturing the most organic traffic?
   - Which pages have high impressions but low clicks (poor CTR)?
   - Which pages rank for many keywords vs single-focus pages?
   - What content gaps exist (keywords with impressions but no dedicated page)?

CONTENT INVENTORY DELIVERABLES:
Your analysis should produce:
- Complete page inventory with URLs and primary topics
- Keyword mapping for each page (what it ranks for today)
- Performance tiers: High performers, moderate performers, underperformers
- Content quality assessment based on ranking patterns
- Baseline metrics for comparison in future steps

CONTEXT & REQUIREMENTS:
- Work with Google Search Console API data (3-month window)
- Focus on ${executionInstructions.concept}
- Provide data in structured format (tables, CSV, or JSON)
- Include visualization recommendations (charts showing content distribution)
- Identify quick wins (pages close to page 1 that need small optimizations)

DELIVERABLE:
Create a detailed content inventory audit saved as: ${fileName}

The audit should include:
- Executive summary: Total pages, keyword coverage, performance overview
- Detailed page-by-page breakdown with rankings and traffic
- Content performance tiers with specific page examples
- Content gaps and opportunities for new pages
- Baseline metrics for measuring future improvement

This inventory will serve as the foundation for Steps 2-4 of the Content Opportunity Protocol.

Make the inventory comprehensive, data-driven, and ready to inform content strategy decisions.`;
  },

  /**
   * Generate Keyword Discovery Prompt (for Content Opportunity Protocol - Step 2)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Keyword discovery-focused prompt
   */
  generateKeywordDiscoveryPrompt(context, fileName) {
    const { mission, stepName, executionInstructions, stepNumber } = context;
    
    // Try to get E.V.O. data from the page
    const evoData = this.getEVODataForStep(stepNumber);
    
    // Build actual metrics section if E.V.O. data is available
    let actualMetricsSection = '';
    if (evoData) {
      actualMetricsSection = this.buildKeywordDiscoveryMetricsSection(evoData, executionInstructions);
    }

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

DATA SOURCE: ${executionInstructions.dataSource}

${actualMetricsSection}

INSTRUCTIONS:
1. Pull comprehensive GSC query data
   - Access Google Search Console API for the last 3 months of data
   - Extract all queries with impressions > 10 to filter noise
   - Collect metrics: query, impressions, clicks, CTR, average position
   - Include queries ranking anywhere (even page 5+) to find hidden opportunities

2. Categorize keyword opportunities into 4 groups:

   A. LOW CTR OPPORTUNITIES (Page 1 Rankings with Poor CTR)
      - Queries ranking positions 1-10
      - CTR significantly below expected rate for position
      - High impressions but low click-through
      - Action: Optimize title tags and meta descriptions
      - Calculate potential gain: impressions × (expected_CTR - current_CTR)

   B. PAGE 2 QUICK WINS (Positions 11-20)
      - Queries ranking on page 2
      - Minimum 30+ impressions per month
      - Close to page 1 breakthrough
      - Action: Content enhancement, internal linking, on-page SEO
      - Calculate potential: impressions × (top_5_CTR - current_CTR)

   C. HIGH VOLUME OPPORTUNITIES (Position 20+)
      - Queries with 100+ monthly impressions
      - Ranking beyond position 20
      - Significant search demand but weak visibility
      - Action: Create comprehensive, optimized content pages
      - Calculate potential: impressions × expected_CTR_position_10

   D. ZERO-CLICK QUERIES (Visible but Never Clicked)
      - Queries with 20+ impressions
      - Zero clicks despite visibility
      - Position < 30 (within reach)
      - Action: Investigate title/snippet appeal, featured snippets
      - Calculate potential: impressions × expected_CTR_for_position

3. Prioritize opportunities by:
   - Potential traffic gain (monthly click increase)
   - Implementation difficulty (page 2 = easy, position 50 = hard)
   - Search intent alignment (commercial > informational)
   - Competition level (lower is better)

4. For each opportunity category, provide:
   - Total opportunity count
   - Combined impression volume
   - Aggregate potential traffic gain
   - Top 10-15 specific keyword examples with full metrics
   - Recommended action strategy

5. Calculate overall keyword opportunity score:
   - Total untapped monthly clicks across all categories
   - Quick win ratio (page 2 opportunities / total queries)
   - CTR optimization potential (low CTR on page 1)
   - Content gap severity (high-volume queries with weak positions)

CONTEXT & REQUIREMENTS:
- Work with Google Search Console API data (3-month window)
- Focus on ${executionInstructions.concept}
- Provide data in structured tables or CSV format
- Include visualization recommendations (CTR gap charts, position distribution)
- Segment by search intent where possible (transactional, commercial, informational)
- Identify patterns: Are certain topic clusters underperforming?
- Consider seasonality in impression data

DELIVERABLE:
Create a detailed keyword discovery analysis saved as: ${fileName}

The analysis should include:
- Executive summary: Total opportunities and aggregate traffic potential
- Category-by-category breakdown with top opportunities
- Detailed keyword tables with all metrics (query, impressions, clicks, CTR, position, potential gain)
- Priority recommendations: Which keywords to optimize first
- Action plan: Specific next steps for each opportunity type
- Success metrics: How to measure improvement after implementation

This keyword discovery will inform Step 3 (Coverage Gap Analysis) and Step 4 (Content Planning Strategy).

Make the analysis comprehensive, data-driven, and actionable—ready to guide content optimization and creation decisions.`;
  },

  /**
   * Build Content Inventory Metrics Section
   * Formats E.V.O. data for Content Opportunity Protocol Step 1
   * @param {Object} evoData - E.V.O. dimension data
   * @param {Object} executionInstructions - Step execution instructions
   * @returns {string} Formatted metrics section
   */
  buildContentInventoryMetricsSection(evoData, executionInstructions) {
    const health = evoData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    let section = `\n═══════════════════════════════════════════════════════════
ACTUAL SITE DATA (Content Inventory Analysis)
═══════════════════════════════════════════════════════════\n\n`;
    
    section += `CONTENT HEALTH STATUS: ${health.status || 'unknown'} (Score: ${health.score || 'N/A'}/100)\n\n`;
    
    // Add key content metrics
    section += `CONTENT INVENTORY METRICS:\n`;
    
    // Prioritize content-specific metrics
    const priorityMetrics = ['totalPages', 'rankingKeywords', 'avgPosition', 'contentCoverage', 'topPerformingPages', 'underperformingPages'];
    const displayedMetrics = new Set();
    
    priorityMetrics.forEach(key => {
      if (metrics[key] !== undefined) {
        displayedMetrics.add(key);
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        section += `- ${formattedLabel}: ${metrics[key]}\n`;
      }
    });
    
    // Add remaining metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (!displayedMetrics.has(key)) {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        section += `- ${formattedLabel}: ${value}\n`;
      }
    });
    
    // Add content opportunities if available
    if (insights.length > 0) {
      section += `\nCONTENT OPPORTUNITIES:\n`;
      insights.forEach((insight, index) => {
        section += `${index + 1}. [${insight.severity?.toUpperCase() || 'INFO'}] ${insight.type}\n`;
        section += `   ${insight.message}\n`;
        
        if (insight.contentOpportunities && insight.contentOpportunities.length > 0) {
          insight.contentOpportunities.forEach(opp => {
            section += `   • ${opp.topic || opp.keyword}: ${opp.impressions || 0} impressions\n`;
            section += `     → ${opp.opportunity || opp.action}\n`;
          });
        }
        
        if (insight.recommendation) {
          section += `   → ${insight.recommendation}\n`;
        }
        section += `\n`;
      });
    }
    
    section += `═══════════════════════════════════════════════════════════\n\n`;
    section += `IMPORTANT: Use the actual content inventory metrics above when creating your analysis.\n`;
    section += `Reference specific page counts, keyword coverage, and performance tiers.\n`;
    section += `Your inventory should establish a baseline for the remaining steps of the Content Opportunity Protocol.\n\n`;
    
    return section;
  },

  /**
   * Build Keyword Discovery Metrics Section
   * Formats E.V.O. data for Content Opportunity Protocol Step 2
   * @param {Object} evoData - E.V.O. dimension data
   * @param {Object} executionInstructions - Step execution instructions
   * @returns {string} Formatted metrics section
   */
  buildKeywordDiscoveryMetricsSection(evoData, executionInstructions) {
    const health = evoData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    let section = `\n═══════════════════════════════════════════════════════════
ACTUAL SITE DATA (Keyword Discovery Analysis)
═══════════════════════════════════════════════════════════\n\n`;
    
    section += `KEYWORD OPPORTUNITY STATUS: ${health.status || 'unknown'} (Score: ${health.score || 'N/A'}/100)\n\n`;
    
    // Add key keyword opportunity metrics
    section += `KEYWORD OPPORTUNITY METRICS:\n`;
    
    // Prioritize keyword-specific metrics
    const priorityMetrics = ['totalQueries', 'lowCTROpportunities', 'page2QuickWins', 'highVolumeOpportunities', 'zeroClickQueries', 'potentialTrafficGain', 'avgPosition', 'avgCTR'];
    const displayedMetrics = new Set();
    
    priorityMetrics.forEach(key => {
      if (metrics[key] !== undefined) {
        displayedMetrics.add(key);
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        let value = metrics[key];
        
        // Format specific metrics
        if (key === 'avgCTR') {
          value = `${value}%`;
        } else if (key === 'potentialTrafficGain') {
          value = `+${value.toLocaleString()} clicks/month`;
        } else if (typeof value === 'number' && key !== 'avgPosition') {
          value = value.toLocaleString();
        }
        
        section += `- ${formattedLabel}: ${value}\n`;
      }
    });
    
    // Add remaining metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (!displayedMetrics.has(key)) {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        section += `- ${formattedLabel}: ${value}\n`;
      }
    });
    
    // Add keyword opportunities if available
    if (insights.length > 0) {
      section += `\nKEYWORD OPPORTUNITY CATEGORIES:\n`;
      insights.forEach((insight, index) => {
        if (insight.type !== 'ERROR' && insight.type !== 'NO_DATA') {
          section += `${index + 1}. [${insight.severity?.toUpperCase() || 'INFO'}] ${insight.type}\n`;
          section += `   ${insight.message}\n`;
          
          if (insight.keywordOpportunities && insight.keywordOpportunities.length > 0) {
            const topKeywords = insight.keywordOpportunities.slice(0, 5); // Show top 5 per category
            section += `   Top Opportunities:\n`;
            topKeywords.forEach(kw => {
              section += `   • "${kw.query}": ${kw.impressions} impressions, Position ${kw.position}, CTR ${kw.ctr}% (Expected: ${kw.expectedCTR}%)\n`;
              section += `     → ${kw.opportunity} [+${kw.potentialGain} clicks/mo]\n`;
            });
          }
          
          if (insight.recommendation) {
            section += `   → ${insight.recommendation}\n`;
          }
          section += `\n`;
        }
      });
    }
    
    section += `═══════════════════════════════════════════════════════════\n\n`;
    section += `IMPORTANT: Use the actual keyword opportunity metrics above when creating your analysis.\n`;
    section += `Reference specific queries, CTR gaps, position opportunities, and traffic potential calculations.\n`;
    section += `Your keyword discovery should identify the highest-value opportunities for optimization and content creation.\n\n`;
    
    return section;
  },

  /**
   * Generate Data-Driven Analysis Prompt (for diagnosed causes with specific URLs and strategies)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Data-driven analysis prompt
   */
  generateDataDrivenAnalysisPrompt(context, fileName) {
    const { mission, stepName, executionInstructions, diagnosedCause } = context;
    const urlCount = diagnosedCause.urls.length;
    const urlList = diagnosedCause.urls.map(url => `${url}`).join('\n');
    
    // Build strategies section (technology-agnostic)
    const strategyText = diagnosedCause.strategies.map(strategy => {
      const items = strategy.items.map(item => `- ${item}`).join('\n');
      return `${strategy.category}:\n${items}`;
    }).join('\n\n');
    
    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

CONTEXT:
E.V.O. has diagnosed ${urlCount} pages with the following issue: ${diagnosedCause.reason}

AFFECTED PAGES:
${urlList}

RECOMMENDED OPTIMIZATION STRATEGIES:
${strategyText}

INSTRUCTIONS:
1. Analyze the current workspace structure
   - Identify the technology stack and file structure
   - Locate the affected page files or templates
   - Determine the best approach for implementing fixes

2. Create a comprehensive implementation plan that includes:
   - Current state analysis: What issues exist on these pages?
   - Files that need modification: List specific files and their paths
   - Specific optimizations required: Reference the strategies above
   - Implementation approach: How to apply fixes efficiently across multiple pages
   - Dependencies and order: What needs to be done first?
   - Testing strategy: How to verify the fixes work

3. Adapt to the detected technology:
   - For static HTML: Provide direct file modifications
   - For template systems: Identify templates that generate these pages
   - For CMS/frameworks: Provide component or template changes
   - For dynamic pages: Identify the routing and rendering logic

4. Address the diagnosed issue:
   - Apply the recommended strategies to each affected page
   - Ensure fixes are technology-agnostic and scalable
   - Prioritize high-impact, low-effort optimizations first

CONTEXT & REQUIREMENTS:
- Work with ANY file structure and technology stack
- Focus on ${executionInstructions.concept}
- Use the recommended strategies as a guide, but adapt to the actual codebase
- Ensure all changes are production-ready and follow best practices
- Consider crawl budget, user experience, and SEO impact

DELIVERABLE:
Create a detailed implementation plan saved as: ${fileName}

The plan should include:
- Executive summary of the issue and affected pages
- Detailed step-by-step implementation guide
- File-by-file changes required
- Testing and validation approach
- Expected impact on indexation

Make the plan actionable, technology-agnostic, and ready for immediate implementation.`;
  },

  /**
   * Generate Internal Link Expansion Prompt (for internal_link_expansion_protocol)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Link expansion prompt with UX and architecture focus
   */
  generateLinkExpansionPrompt(context, fileName) {
    const { mission, stepName, stepNumber, executionInstructions } = context;
    
    // Special handling for Step 4 (Implementation Path) - emphasize UX preservation
    const isImplementationStep = stepNumber === 4;
    
    let basePrompt = `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

INSTRUCTIONS:
1. Analyze the current website structure in this workspace
   - Detect the technology stack (HTML, React, Vue, Next.js, static site, etc.)
   - Identify all pages and their current internal linking patterns
   - Map the site's information architecture and navigation structure

2. Create a comprehensive ${stepName.toLowerCase()} plan that includes:
   - Current state analysis: What is the existing link structure?
   - Files that need modification: List specific files and their paths
   - Link opportunities: Where should new internal links be added?
   - Implementation approach: How to add links without disrupting UX
   - Dependencies and order: What needs to be done first?
   - Testing strategy: How to verify the links work and enhance UX

3. Adapt to the detected technology:
   - For static HTML: Direct anchor tag modifications in content sections
   - For React/Vue/Next: Use Link components and ensure proper routing
   - For template engines: Identify templates that generate multiple pages
   - For CMSs: Provide guidance on adding links through the content editor

CONTEXT & REQUIREMENTS:
- Work with ANY file structure and technology stack
- Focus on ${executionInstructions.concept}
- Ensure links are contextually relevant to the surrounding content
- Maintain natural language flow (avoid keyword stuffing)
- Prioritize user value over SEO manipulation`;

    // Add special requirements for Implementation Path (Step 4)
    if (isImplementationStep) {
      basePrompt += `

CRITICAL REQUIREMENTS FOR IMPLEMENTATION:
⚠ UX PRESERVATION:
- DO NOT disrupt existing navigation patterns or user flows
- Links should enhance, not interrupt, the user journey
- Maintain the current site architecture and information hierarchy
- Avoid adding links that could confuse or overwhelm users

⚠ CONTEXTUAL PLACEMENT:
- Place links within content body where they add genuine value
- Avoid footer spam, sidebar stuffing, or artificial link sections
- Ensure each link has a clear purpose from the user's perspective
- Use descriptive anchor text that sets proper expectations

⚠ ARCHITECTURAL INTEGRITY:
- Respect the existing site structure and URL patterns
- Don't create circular dependencies or confusing link loops
- Maintain consistent link patterns across similar page types
- Consider the site's content hierarchy and parent-child relationships

⚠ SCALABILITY:
- Design patterns that can be replicated across content types
- Provide templates or rules for future content additions
- Consider maintenance burden (avoid brittle, hard-to-update links)`;
    }

    basePrompt += `

DELIVERABLE:
Create a detailed implementation plan saved as: ${fileName}

The plan should include:
- Executive summary of findings
- Specific file paths and line numbers for modifications
- Exact anchor text and target URLs for each new link
- Visual diagrams or lists showing link relationships
- Technology-specific implementation code examples
- Testing checklist to verify link functionality and UX impact

Make the plan actionable, technology-agnostic, and ready for immediate implementation${isImplementationStep ? ', with special attention to preserving UX and architectural integrity' : ''}.`;

    return basePrompt;
  },

  /**
   * Generate Content Planning Prompt (for keyword coverage gap protocol)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Content planning prompt
   */
  generateContentPlanningPrompt(context, fileName) {
    const { mission, stepName, executionInstructions } = context;
    
    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

CONTEXT:
You have access to:
1. Content Inventory Audit - List of existing pages and their ranking keywords from GSC
2. GSC Keyword Discovery - All queries with impressions, clicks, CTR, and positions
3. Coverage Gap Analysis - High-impression keywords with poor performance or no dedicated page

INSTRUCTIONS:
1. Analyze the coverage gaps and prioritize opportunities
   - Review high-impression queries with no dedicated targeting pages
   - Identify keyword clusters that can be grouped into single pages
   - Consider user intent and search journey from query data
   - Assess current position and potential improvement (page 2 to page 1 = highest ROI)

2. Create a comprehensive content plan that includes:
   - New page recommendations with specific URLs
   - Primary and secondary keyword targets for each page
   - Content structure and key sections to include
   - Internal linking strategy from existing pages
   - Priority ranking based on traffic potential and effort

3. For each recommended page, provide:
   - Suggested URL path (SEO-friendly)
   - Primary keyword (highest volume/relevance)
   - Secondary keywords to target (2-5 keywords)
   - Content outline with H2/H3 structure
   - Word count recommendation
   - Key topics and questions to address
   - Internal links from existing relevant pages

4. Adapt to the site's technology stack:
   - For static sites: Create new HTML files with proper structure
   - For CMSs: Provide content briefs for CMS entry
   - For frameworks (React/Next/Vue): Plan components and routing
   - For dynamic sites: Consider URL patterns and templates

DELIVERABLE:
Create a detailed content planning strategy saved as: ${fileName}

The plan should include:
- Executive summary of opportunity size (total potential impressions and estimated traffic gain)
- Prioritized list of 5-10 new or optimized pages based on GSC data
- Detailed brief for each page (URL, primary query, related queries from GSC, outline, links)
- Quick wins: Queries ranking 11-20 that need optimization (highest ROI)
- New content: High-impression queries with no dedicated page
- Success metrics to track (target positions, CTR improvements, click gains)

Make the plan actionable, prioritized by GSC impression data and position improvement potential, ready for immediate content creation.`;
  },

  /**
   * Generate Generic Prompt (fallback for protocols without specific type)
   * @param {Object} context - Page context
   * @param {string} fileName - Output file name
   * @returns {string} Generic prompt
   */
  generateGenericPrompt(context, fileName) {
    const { mission, stepName, executionInstructions } = context;

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${executionInstructions.action}

IMPLEMENTATION FOCUS:
${executionInstructions.implementation}

INSTRUCTIONS:
1. Analyze the current project structure and requirements
2. Create a comprehensive implementation plan
3. Identify files that need modification
4. Provide clear, actionable steps
5. Include testing and validation strategy

DELIVERABLE:
Create a detailed implementation plan saved as: ${fileName}

The plan should be actionable and ready for immediate implementation.`;
  },

  /**
   * Get E.V.O. Data for Current Step
   * Uses the global cache from sprintPlan.js
   * @param {number} stepNumber - Step number
   * @returns {Object|null} E.V.O. data or null
   */
  getEVODataForStep(stepNumber) {
    try {
      // Use global function from sprintPlan.js
      if (typeof window.getEVODataForStep === 'function') {
        const cachedData = window.getEVODataForStep(stepNumber);
        return cachedData ? cachedData.dimensionData : null;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving E.V.O. data:', error);
      return null;
    }
  },

  /**
   * Build Actual Metrics Section for Prompt
   * Formats E.V.O. data into a metrics summary for the Cursor instruction
   * @param {Object} evoData - E.V.O. dimension data
   * @param {Object} executionInstructions - Step execution instructions
   * @returns {string} Formatted metrics section
   */
  buildActualMetricsSection(evoData, executionInstructions) {
    const health = evoData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    let section = `\n═══════════════════════════════════════════════════════════
ACTUAL SITE DATA (E.V.O. Analysis from ${executionInstructions.evoDimension.toUpperCase()} dimension)
═══════════════════════════════════════════════════════════\n\n`;
    
    section += `HEALTH STATUS: ${health.status || 'unknown'} (Score: ${health.score || 'N/A'}/100)\n\n`;
    
    // Add key metrics
    section += `KEY METRICS:\n`;
    Object.entries(metrics).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      section += `- ${formattedLabel}: ${value}\n`;
    });
    
    // Add insights if available
    if (insights.length > 0) {
      section += `\nDETECTED ISSUES:\n`;
      insights.forEach((insight, index) => {
        section += `${index + 1}. [${insight.severity?.toUpperCase()}] ${insight.type}\n`;
        section += `   ${insight.message}\n`;
        if (insight.recommendation) {
          section += `   → ${insight.recommendation}\n`;
        }
        section += `\n`;
      });
    }
    
    section += `═══════════════════════════════════════════════════════════\n\n`;
    section += `IMPORTANT: Use the actual metrics above when creating your implementation plan.\n`;
    section += `Reference specific numbers, URLs, and issues identified in the E.V.O. analysis.\n`;
    section += `Your plan should address the detected issues listed above.\n\n`;
    
    return section;
  },

  /**
   * Sanitize step name for use as filename
   * @param {string} stepName - Original step name
   * @returns {string} Sanitized filename
   */
  sanitizeFileName(stepName) {
    return stepName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Open the modal with generated prompt
   * @param {HTMLElement} pageElement - The sprint card page element
   * @param {Object|null} diagnosedCause - Optional diagnosed cause data with URLs and strategies
   */
  openModal(pageElement, diagnosedCause = null) {
    const context = this.extractPageContext(pageElement);
    
    // Attach diagnosed cause data if provided
    if (diagnosedCause) {
      context.diagnosedCause = diagnosedCause;
      console.log('✓ Diagnosed cause data attached to context:', diagnosedCause.reason);
    }
    
    const prompt = this.generatePrompt(context);
    
    // Populate modal content
    document.getElementById('assist-mission').textContent = context.mission;
    document.getElementById('assist-step').textContent = context.stepHeader;
    document.getElementById('assist-prompt').textContent = prompt;
    
    // Store prompt for copying
    this.currentPrompt = prompt;
    
    // Show modal
    this.modal.classList.add('active');
    
    // Hide success message
    const successMsg = document.getElementById('copy-success');
    if (successMsg) {
      successMsg.style.display = 'none';
    }

    console.log(`✓ Execution Assist modal opened for: ${context.stepName}`);
  },

  /**
   * Close the modal
   */
  closeModal() {
    this.modal.classList.remove('active');
    this.currentStepNumber = null; // Clear step number for indexation modals
    console.log('✓ Execution Assist modal closed');
  },

  /**
   * Copy prompt to clipboard
   */
  async copyPrompt() {
    if (!this.currentPrompt) {
      console.error('No prompt to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.currentPrompt);
      
      // Show success message
      const successMsg = document.getElementById('copy-success');
      if (successMsg) {
        successMsg.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
          successMsg.style.display = 'none';
        }, 3000);
      }
      
      // Mark the instruction label as copied and enable the Next Step button
      const context = this.getCurrentStepContext();
      const stepNumber = context?.stepNumber || this.currentStepNumber;
      
      if (stepNumber) {
        const instructionLabel = document.querySelector(`.instruction-label[data-step="${stepNumber}"]`);
        if (instructionLabel) {
          instructionLabel.classList.add('copied');
          console.log(`✓ Step ${stepNumber} marked as copied`);
        }
        
        // Enable the Next Step button for this step
        const nextStepButton = document.querySelector(`.btn-next-step[data-step="${stepNumber}"]`);
        if (nextStepButton) {
          nextStepButton.disabled = false;
          console.log(`✓ Next Step button enabled for step ${stepNumber}`);
        }
        
        // Special handling for Step 4 - also enable Complete button
        if (stepNumber === 4) {
          const completeButton = document.querySelector('.btn-complete');
          if (completeButton) {
            completeButton.disabled = false;
            console.log(`✓ Complete button enabled for step ${stepNumber}`);
          }
        }
      }
      
      console.log('✓ Prompt copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  },

  /**
   * Get the current step context from the modal
   * @returns {Object|null} Context object or null if not available
   */
  getCurrentStepContext() {
    const stepText = document.getElementById('assist-step')?.textContent || '';
    const stepMatch = stepText.match(/Step (\d+)/);
    const stepNumber = stepMatch ? parseInt(stepMatch[1]) : null;
    
    return stepNumber ? { stepNumber } : null;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ExecutionAssist.init();
  
  // Expose globally for access from sprintPlan.js
  window.ExecutionAssist = ExecutionAssist;
});
