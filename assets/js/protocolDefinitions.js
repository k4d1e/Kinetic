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
    missionTitle: "GSC Health Monitor",
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
          evoDimension: "substrate",
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
          evoDimension: "substrate",
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
          evoDimension: "substrate",
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
