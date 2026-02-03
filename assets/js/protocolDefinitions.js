/**
 * Protocol Definitions for Sprint Plan Cards
 * Defines the content structure for each protocol type
 */

const protocolDefinitions = {
  /**
   * Meta Surgeon Protocol
   * Focus: Entity signal establishment through structured data
   */
  meta_surgeon_protocol: {
    missionTitle: "Meta Surgeon Protocol",
    entityLabel: "Entity Signal Strength",
    page1: {
      insight: "Before we fight for keywords, we must introduce you to the algorithm. Right now, Google is guessing who you are. By injecting these 4 'Truth Layers' into your code, we force the search engines to recognize <span style=\"color: var(--color-accent-orange);\">{{COMPANY_NAME}}</span> as a verified local entity, not just another website.",
      companyName: "Oregon Exterior Experts"
    },
    steps: [
      {
        title: "Global Identity",
        description: "First, we hard-code your brand's DNA (Logo, Phone, Social Profiles) into the pages of your site.",
        executionInstructions: {
          concept: "global brand identity elements",
          action: "Add organization schema markup with logo, contact information, and social media profiles",
          schemaType: "Organization schema (schema.org/Organization)",
          implementation: "Inject structured data into all pages to establish brand identity in search engines",
          deliverable: "global-identity-plan.md"
        }
      },
      {
        title: "Territory Claim",
        description: "Next, we draw the digital borders. We will define the exact 'GEO Circle' for each city you service so Google knows exactly where your trucks go.",
        executionInstructions: {
          concept: "geographic service area definitions",
          action: "Define service areas using geographic schema markup",
          schemaType: "GeoCircle or ServiceArea schema (schema.org/GeoCircle)",
          implementation: "Specify exact locations where products/services are offered using latitude, longitude, and radius",
          deliverable: "territory-claim-plan.md"
        }
      },
      {
        title: "Commercial Definition",
        description: "Now, we define the product. We explicitly tell the bot that 'Roofing' is a Service you sell, with a specific price range, turning your page from a 'brochure' to a 'catalog'.",
        executionInstructions: {
          concept: "structured product/service catalog with pricing",
          action: "Transform content pages into catalog entries with Service/Product schema",
          schemaType: "Service or Product schema (schema.org/Service, schema.org/Product)",
          implementation: "Add structured data defining offerings with descriptions, pricing, and categories",
          deliverable: "commercial-definition-plan.md"
        }
      },
      {
        title: "Reputation Sync",
        description: "Finally, we aggregate your trust. Let's take your scattered 5-star reviews and format them into a 'CollectionPage' that search engines can count.",
        executionInstructions: {
          concept: "review aggregation and testimonial markup",
          action: "Aggregate customer reviews into structured CollectionPage format",
          schemaType: "Review and AggregateRating schema (schema.org/Review)",
          implementation: "Format testimonials as structured review data that search engines can index and display",
          deliverable: "reputation-sync-plan.md"
        }
      }
    ],
    completion: {
      scanning: "Status: Scanning Source Code",
      established: "Status: Entity Signal Established.",
      success: "Success: Your business is now a verified entity. 4 Schema Packs Active."
    }
  },

  /**
   * GSC Indexation Protocol
   * Focus: Crawl budget optimization and site health monitoring
   */
  gsc_indexation_protocol: {
    missionTitle: "Index Diagnostic Protocol",
    entityLabel: "Crawl Budget Efficiency",
    page1: {
      insight: "Google's crawlers visit your site daily, but are they wasting time on broken pages or focusing on your money-makers? Right now, googlebot might be burning crawl budget on redirect chains, duplicate content, and 404 black holes. Let's audit the raw GSC data and redirect their attention to pages that convert.",
      companyName: "{{PROPERTY_NAME}}" // This will be replaced dynamically with actual property name
    },
    steps: [
      {
        title: "Indexation Audit",
        description: "Pull all indexed pages versus submitted pages from GSC Coverage Report. We'll identify coverage gaps, unwanted indexed content (like staging URLs or parameter pages), and pages excluded by errors. This reveals what Google actually knows about your site.",
        executionInstructions: {
          concept: "GSC Coverage Report analysis",
          action: "Export and analyze indexed vs submitted pages from Google Search Console Coverage Report",
          dataSource: "Google Search Console API or manual CSV export from Coverage Report",
          implementation: "Connect to GSC API or guide manual export, parse coverage data (indexed, excluded, errors, valid with warnings), identify issues like excluded pages, 404s, duplicate content, soft 404s, and pages blocked by robots.txt",
          deliverable: "indexation-audit-report.md",
          evoDimension: "substrate",
          evoMetrics: ["rootDensity", "exclusionRate", "mycelialExpansion", "soilQuality"],
          healthThreshold: 70
        }
      },
      {
        title: "Crawl Stats Analysis",
        description: "Analyze crawl frequency, response times, and file sizes from GSC Crawl Stats. We'll identify which pages googlebot visits most, which ones are slow to respond, and where server errors are blocking indexation. This shows how efficiently we're using crawl budget.",
        executionInstructions: {
          concept: "Crawl budget efficiency analysis",
          action: "Export and analyze crawl frequency, response times, and resource consumption from GSC Crawl Stats",
          dataSource: "Google Search Console Crawl Stats section (last 90 days data)",
          implementation: "Extract crawl stats data showing total crawl requests, kilobytes downloaded, time spent downloading pages. Identify pages with slow response times (>500ms), server errors (5xx), and high-frequency crawls on low-value pages. Calculate crawl budget waste.",
          deliverable: "crawl-stats-analysis.md",
          evoDimension: "crawl",
          evoMetrics: ["crawlRequests", "responseTime", "serverErrors"],
          healthThreshold: 70
        }
      },
      {
        title: "Sitemap Optimization",
        description: "Validate sitemap.xml structure and ensure priority pages are properly mapped for crawler discovery. We'll remove any 404s, redirects, or noindex pages from sitemaps, and confirm your most important pages are submitted. Clean sitemaps = efficient crawling.",
        executionInstructions: {
          concept: "Sitemap validation and optimization",
          action: "Audit sitemap.xml files and cross-reference with GSC data to ensure clean, accurate sitemaps",
          dataSource: "Site's sitemap.xml files + GSC Sitemaps report",
          implementation: "Parse all sitemap files, validate XML structure, check each URL for: 404 errors, redirect chains, noindex tags, canonicalization issues. Cross-reference with GSC to identify submitted but not indexed URLs. Verify priority pages are included and low-value pages excluded.",
          deliverable: "sitemap-optimization-plan.md",
          evoDimension: "sitemap",
          evoMetrics: ["sitemapIndexation", "submittedVsIndexed"],
          healthThreshold: 70
        }
      },
      {
        title: "Redirect Chain Resolution",
        description: "Map all redirect chains and eliminate multi-hop redirects that waste crawl budget. We'll fix broken internal links creating 404 errors, consolidate redirect chains into single 301s, and ensure all critical pages are directly accessible. Every redirect costs crawl budget.",
        executionInstructions: {
          concept: "Redirect mapping and 404 elimination",
          action: "Map all redirect chains, identify 404 errors, and create optimization plan to fix redirect inefficiencies",
          dataSource: "Site crawl data + server logs + GSC Coverage errors",
          implementation: "Crawl the site to map all redirects (301, 302, 307, 308). Identify redirect chains (A→B→C) and consolidate to single redirects (A→C). Find broken internal links causing 404s. Check for redirect loops. Verify all critical pages are directly accessible without redirects.",
          deliverable: "redirect-resolution-plan.md",
          evoDimension: "redirect",
          evoMetrics: ["errorPages", "redirectChains"],
          healthThreshold: 70
        }
      }
    ],
    completion: {
      scanning: "Status: Analyzing GSC Coverage Data",
      established: "Status: Crawl Budget Optimized.",
      success: "Success: Your site is now prioritizing high-value pages. Crawl efficiency maximized."
    }
  },

  /**
   * Internal Link Expansion Protocol
   * Focus: Strategic internal linking for authority distribution and user guidance
   */
  internal_link_expansion_protocol: {
    missionTitle: "Link Architecture Protocol",
    entityLabel: "Link Distribution Strength",
    page1: {
      insight: "Internal links are the pathways that distribute authority and guide users through your site. Right now, you might have orphaned pages, weak topical signals, and missed opportunities to connect high-value content. Let's architect a strategic linking system that amplifies authority and enhances user experience.",
      companyName: "{{COMPANY_NAME}}"
    },
    steps: [
      {
        title: "Link Inventory Audit",
        description: "Map your current internal linking structure to understand how authority flows through your site. We'll identify orphan pages with no incoming links, analyze link distribution patterns, and reveal which pages are hoarding authority versus which are starved for it.",
        executionInstructions: {
          concept: "comprehensive link graph analysis",
          action: "Crawl and analyze all internal links across the entire site structure",
          implementation: "Scan all pages to map existing internal links, calculate incoming/outgoing link counts per page, identify orphaned pages, measure link depth from homepage, and create a visual representation of the current link architecture",
          deliverable: "link-inventory-audit.md"
        }
      },
      {
        title: "Strategic Link Opportunities",
        description: "Identify high-value pages that need authority boosts via internal links. We'll find contextual opportunities to strengthen topical clusters, connect related content, and prioritize pages based on conversion potential and search visibility goals.",
        executionInstructions: {
          concept: "strategic link placement for authority distribution",
          action: "Identify pages that need more internal links and determine optimal source pages",
          implementation: "Analyze page importance (conversion value, search traffic, business goals), identify topical clusters that need stronger connections, find contextually relevant pages that could link to target pages, and prioritize link opportunities by impact potential",
          deliverable: "strategic-link-opportunities.md"
        }
      },
      {
        title: "Anchor Text Optimization",
        description: "Audit your existing anchor text patterns to ensure diversity and relevance. We'll design descriptive, keyword-rich anchors that signal topical relationships to search engines while maintaining natural language flow for users.",
        executionInstructions: {
          concept: "anchor text diversity and relevance optimization",
          action: "Analyze current anchor text patterns and plan optimized anchor text strategy",
          implementation: "Extract all existing anchor text, identify over-optimization or generic text (like 'click here'), analyze keyword distribution in anchors, plan diverse, descriptive anchor text that signals content relationships, and ensure natural language while incorporating target keywords",
          deliverable: "anchor-text-optimization-plan.md"
        }
      },
      {
        title: "Implementation Path",
        description: "Design new link paths that enhance UX without disrupting your site's architecture. We'll create a non-invasive implementation roadmap that adds contextual links within existing content, respects user flows, and scales across content types—no footer spam, just strategic connections.",
        executionInstructions: {
          concept: "non-disruptive link implementation strategy",
          action: "Create an implementation plan that adds strategic links while preserving UX and site architecture",
          implementation: "Identify exact placement locations for new links (within content body, related content sections, contextual sidebars), specify which files need modification, ensure links enhance rather than disrupt user journey, maintain existing navigation patterns, plan for scalable linking patterns across content types, and provide technology-specific implementation guidance",
          deliverable: "link-implementation-path.md"
        }
      }
    ],
    completion: {
      scanning: "Status: Analyzing Link Architecture",
      established: "Status: Link Distribution Strategy Complete.",
      success: "Success: Your internal link network is now optimized. Strategic pathways established."
    }
  },

  /**
   * Keyword Coverage Gap Protocol
   * Focus: Identifying content opportunities through GSC impression data analysis
   */
  keyword_coverage_gap_protocol: {
    missionTitle: "Content Opportunity Protocol",
    entityLabel: "Content Coverage Strength",
    page1: {
      insight: "Google is already showing your site for thousands of search queries, but many are buried on page 2 or have terrible click-through rates. Right now, there's search demand finding you in impressions but never clicking through. Let's analyze your GSC data, map impression opportunities to your content inventory, and identify high-value gaps where new or optimized pages can capture that waiting traffic.",
      companyName: "{{PROPERTY_NAME}}"
    },
    steps: [
      {
        title: "Content Inventory Audit",
        description: "First, we map every page on your site to the keywords it's actually ranking for in GSC. We'll see which pages own which queries, how many clicks they get, and what positions they hold. This creates our baseline: what content exists and what it's capturing today.",
        executionInstructions: {
          concept: "comprehensive content and keyword inventory",
          action: "Audit existing pages and map them to their currently ranking keywords",
          dataSource: "Google Search Console API + site crawl",
          implementation: "Crawl all pages, extract target keywords from meta tags and content, pull GSC ranking data for each page, create mapping of pages → keywords → positions → traffic",
          deliverable: "content-inventory-audit.md",
          evoDimension: "inventory",
          evoMetrics: ["totalPages", "rankingKeywords", "avgPosition", "contentCoverage"],
          healthThreshold: 70
        }
      },
      {
        title: "Keyword Discovery from GSC",
        description: "Next, we pull every search query from GSC that generated impressions—even if you rank on page 5. We'll find queries with high impressions but terrible CTR, queries stuck on page 2, and queries where Google shows you but users never click. This is your hidden opportunity list.",
        executionInstructions: {
          concept: "GSC-based keyword discovery and opportunity mapping",
          action: "Extract all queries from GSC to identify keywords with impressions that could drive more traffic",
          dataSource: "Google Search Console Search Analytics API",
          implementation: "Pull GSC query data for last 3 months, filter for queries with impressions > 10, identify low-CTR queries (impressions > clicks ratio poor), find queries ranking positions 11-50, flag queries with high impressions but low clicks as quick wins, group by search intent",
          deliverable: "keyword-demand-research.md",
          evoDimension: "keyword_opportunities",
          evoMetrics: ["totalQueries", "lowCTROpportunities", "page2QuickWins", "highVolumeOpportunities", "potentialTrafficGain"],
          healthThreshold: 70,
          gscMetrics: ["query", "impressions", "clicks", "ctr", "position"]
        }
      },
      {
        title: "Coverage Gap Analysis",
        description: "Now we compare: What queries have impressions but no dedicated page? What queries rank on page 2 with a small push needed? What high-impression queries have embarrassing CTRs? We'll score each gap by traffic potential—impressions × expected CTR improvement = your content roadmap.",
        executionInstructions: {
          concept: "GSC-based coverage gap identification",
          action: "Compare GSC query performance against existing content to find coverage gaps and opportunities",
          dataSource: "Google Search Console Search Analytics API",
          implementation: "Cross-reference GSC query data with content inventory from Step 1, identify high-impression queries (>100) with poor positions (>10), find queries with multiple weak-ranking pages (cannibalization), detect queries with impressions but no clear target page, calculate opportunity score using (impressions × expected_CTR_improvement), prioritize by potential traffic gain",
          deliverable: "coverage-gap-analysis.md",
          opportunityMetrics: ["impressions", "current_position", "potential_position", "traffic_gain"]
        }
      },
      {
        title: "Content Planning Strategy",
        description: "Finally, we design the pages. For each gap, we'll cluster related GSC queries, plan URL structure, outline content sections based on search intent, and map internal links. You'll get a prioritized list of pages to create or optimize—ranked by traffic potential and effort required.",
        executionInstructions: {
          concept: "strategic content planning relative to keyword demand",
          action: "Plan new pages and content updates to capture identified keyword opportunities",
          implementation: "Group related keywords into topical clusters, design page structure and content briefs for each cluster, plan URL hierarchy and internal linking strategy, prioritize implementation by traffic potential and difficulty, provide specific page creation guidance",
          deliverable: "content-planning-strategy.md",
          promptType: "content_planning"
        }
      }
    ],
    completion: {
      scanning: "Status: Analyzing Coverage Gaps",
      established: "Status: Content Strategy Complete.",
      success: "Success: Your content roadmap is ready. Opportunity pages identified."
    }
  },

  /**
   * Template for future protocols
   * Copy this structure when adding new protocols
   */
  future_card_type: {
    missionTitle: "Future Protocol Name",
    entityLabel: "Progress Metric Label",
    page1: {
      insight: "Compelling insight that explains the 'why' behind this protocol and what problem it solves.",
      companyName: "{{COMPANY_NAME}}"
    },
    steps: [
      {
        title: "Step 1 Title",
        description: "Clear description of what this step accomplishes and why it matters."
      },
      {
        title: "Step 2 Title",
        description: "Clear description of what this step accomplishes and why it matters."
      },
      {
        title: "Step 3 Title",
        description: "Clear description of what this step accomplishes and why it matters."
      },
      {
        title: "Step 4 Title",
        description: "Clear description of what this step accomplishes and why it matters."
      }
    ],
    completion: {
      scanning: "Status: Processing Data",
      established: "Status: Process Complete.",
      success: "Success: Achievement unlocked message."
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { protocolDefinitions };
}
