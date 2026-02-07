# E.V.O. Intelligence System - AI Decision-Making Architecture

## System Overview

E.V.O. (Evolving Optimization) is the AI analysis engine that continuously monitors Google Search Console data, detects optimization opportunities, and procedurally generates Sprint Plan Action Cards with customized insights and data-driven recommendations.

## Complete E.V.O. System Architecture

```mermaid
graph TB
    subgraph "Data Collection Layer"
        GSC[Google Search Console API]
        SiteCrawl[Site Crawler]
        SchemaAnalysis[Schema Parser]
        
        GSC --> Coverage[Coverage Report]
        GSC --> CrawlStats[Crawl Stats]
        GSC --> Queries[Search Queries]
        GSC --> Sitemaps[Sitemaps Report]
        
        SiteCrawl --> LinkGraph[Link Graph Data]
        SiteCrawl --> ContentPages[Page Inventory]
        
        SchemaAnalysis --> SchemaData[Structured Data]
    end
    
    subgraph "E.V.O. Analysis Engine"
        Dimension1[Dimension: substrate<br/>Indexation foundation]
        Dimension2[Dimension: crawl<br/>Crawler behavior]
        Dimension3[Dimension: sitemap<br/>Discovery mechanism]
        Dimension4[Dimension: redirect<br/>Navigation efficiency]
        Dimension5[Dimension: inventory<br/>Content baseline]
        Dimension6[Dimension: keyword_opportunities<br/>GSC query analysis]
        Dimension7[Dimension: content_coverage_gaps<br/>Gap identification]
        
        Coverage --> Dimension1
        CrawlStats --> Dimension2
        Sitemaps --> Dimension3
        SiteCrawl --> Dimension4
        ContentPages --> Dimension5
        Queries --> Dimension6
        Dimension5 --> Dimension7
        Dimension6 --> Dimension7
    end
    
    subgraph "Diagnostic Evaluation"
        Trigger1[Meta Surgeon Trigger]
        Trigger2[Index Diagnostic Trigger]
        Trigger3[Link Architecture Trigger]
        Trigger4[Content Opportunity Trigger]
        
        SchemaData --> Trigger1
        Dimension1 --> Trigger2
        Dimension2 --> Trigger2
        Dimension3 --> Trigger2
        Dimension4 --> Trigger2
        LinkGraph --> Trigger3
        Dimension6 --> Trigger4
        Dimension7 --> Trigger4
    end
    
    subgraph "Intelligent Decision System"
        TriggerEval[Evaluate All Triggers]
        ScoreCalc[Calculate Trigger Scores]
        ConflictRes[Conflict Resolution]
        PrioritySelect[Select Highest Priority]
        
        Trigger1 --> TriggerEval
        Trigger2 --> TriggerEval
        Trigger3 --> TriggerEval
        Trigger4 --> TriggerEval
        
        TriggerEval --> ScoreCalc
        ScoreCalc --> ConflictRes
        ConflictRes --> PrioritySelect
    end
    
    subgraph "Card Generation"
        PreAnalysis[Pre-Analysis Phase]
        DynamicInsight[Generate Dynamic Insight]
        CardCreation[Create Action Card]
        UserNotify[Notify User]
        
        PrioritySelect --> PreAnalysis
        PreAnalysis --> DynamicInsight
        DynamicInsight --> CardCreation
        CardCreation --> UserNotify
    end
    
    subgraph "User Interaction"
        Dashboard[Sprint Plan Dashboard]
        OpenCard[User Opens Card]
        AutoFetch[Auto-Fetch E.V.O. Dimensions]
        DisplayAnalysis[Display Analysis]
        CompleteCard[User Completes Card]
        
        UserNotify --> Dashboard
        Dashboard --> OpenCard
        OpenCard --> AutoFetch
        
        Dimension1 --> DisplayAnalysis
        Dimension2 --> DisplayAnalysis
        Dimension3 --> DisplayAnalysis
        Dimension4 --> DisplayAnalysis
        Dimension5 --> DisplayAnalysis
        Dimension6 --> DisplayAnalysis
        Dimension7 --> DisplayAnalysis
        
        AutoFetch --> DisplayAnalysis
        DisplayAnalysis --> CompleteCard
    end
    
    subgraph "Database Persistence"
        CardDB[(sprint_action_cards)]
        CompletionDB[(sprint_card_completions)]
        CacheDB[(E.V.O. cache)]
        
        CardCreation --> CardDB
        CompleteCard --> CompletionDB
        DisplayAnalysis --> CacheDB
    end
    
    style GSC fill:#fc9,stroke:#333,stroke-width:2px
    style Dimension1 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension2 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension3 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension4 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension5 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension6 fill:#9cf,stroke:#333,stroke-width:2px
    style Dimension7 fill:#9cf,stroke:#333,stroke-width:2px
    style ConflictRes fill:#f96,stroke:#333,stroke-width:3px
    style DynamicInsight fill:#9f9,stroke:#333,stroke-width:2px
```

## E.V.O. Dimension Analysis System

```mermaid
graph TD
    DimensionRequest[E.V.O. Dimension Request] --> CheckCache{Check Cache}
    
    CheckCache -->|Hit| ReturnCached[Return Cached Data]
    CheckCache -->|Miss or Force Refresh| FetchFresh[Fetch Fresh Data]
    
    FetchFresh --> DimensionType{Dimension Type?}
    
    DimensionType -->|substrate| SubstrateAnalysis["SUBSTRATE ANALYSIS:<br/>Data: GSC Coverage Report<br/>Metrics:<br/>- rootDensity: indexed pages<br/>- exclusionRate: % excluded<br/>- mycelialExpansion: growth rate<br/>- soilQuality: health %<br/>Algorithm:<br/>score = 100 - (exclusionRate * 2)<br/>       - (errorPageRatio * 3)"]
    
    DimensionType -->|crawl| CrawlAnalysis["CRAWL ANALYSIS:<br/>Data: GSC Crawl Stats<br/>Metrics:<br/>- crawlRequests: daily requests<br/>- responseTime: avg ms<br/>- serverErrors: 5xx count<br/>Algorithm:<br/>score = 100 - (serverErrorRate * 5)<br/>       - (slowPageRatio * 2)"]
    
    DimensionType -->|sitemap| SitemapAnalysis["SITEMAP ANALYSIS:<br/>Data: GSC Sitemaps Report<br/>Metrics:<br/>- sitemapIndexation: % indexed<br/>- submittedVsIndexed: ratio<br/>Algorithm:<br/>score = sitemapCoverage * 0.7<br/>      + cleanSitemap * 0.3"]
    
    DimensionType -->|redirect| RedirectAnalysis["REDIRECT ANALYSIS:<br/>Data: Site crawl + GSC<br/>Metrics:<br/>- errorPages: 404 count<br/>- redirectChains: multi-hop<br/>Algorithm:<br/>score = 100 - (errorPageRatio * 3)<br/>       - (chainRatio * 2)"]
    
    DimensionType -->|inventory| InventoryAnalysis["INVENTORY ANALYSIS:<br/>Data: Site crawl + GSC<br/>Metrics:<br/>- totalPages: page count<br/>- rankingKeywords: keyword count<br/>- avgPosition: average rank<br/>- contentCoverage: % with pages<br/>Algorithm:<br/>score = informational only"]
    
    DimensionType -->|keyword_opportunities| KeywordAnalysis["KEYWORD ANALYSIS:<br/>Data: GSC Search Analytics<br/>Metrics:<br/>- totalQueries: all queries<br/>- lowCTROpportunities: poor CTR<br/>- page2QuickWins: positions 11-20<br/>- potentialTrafficGain: estimate<br/>Algorithm:<br/>potential = impressions *<br/>           (expectedCTR - currentCTR) * 30"]
    
    DimensionType -->|content_coverage_gaps| GapAnalysis["GAP ANALYSIS:<br/>Data: inventory + keyword_opportunities<br/>Metrics:<br/>- totalGaps: all opportunities<br/>- positionGaps: 11-20 ranks<br/>- contentGaps: no page exists<br/>- ctrGaps: low CTR<br/>- totalOpportunityClicks: sum<br/>Algorithm:<br/>opportunityScore = impressions *<br/>                  (expectedCTR - currentCTR)"]
    
    SubstrateAnalysis --> CalculateHealth[Calculate Health Score]
    CrawlAnalysis --> CalculateHealth
    SitemapAnalysis --> CalculateHealth
    RedirectAnalysis --> CalculateHealth
    InventoryAnalysis --> BuildMetrics[Build Metrics Only]
    KeywordAnalysis --> BuildMetrics
    GapAnalysis --> BuildMetrics
    
    CalculateHealth --> DiagnoseCauses[Diagnose Causes]
    DiagnoseCauses --> BuildInsights[Build Insights]
    BuildInsights --> ReturnData[Return Dimension Data]
    
    BuildMetrics --> ReturnData
    
    ReturnData --> CacheResult[Cache for 24 hours]
    CacheResult --> Return[Return to UI]
    
    style SubstrateAnalysis fill:#9cf,stroke:#333,stroke-width:2px
    style CalculateHealth fill:#fc9,stroke:#333,stroke-width:2px
    style DiagnoseCauses fill:#f96,stroke:#333,stroke-width:2px
```

## Intelligent Trigger Detection & Scoring

```mermaid
graph TD
    DailyEval[Daily Evaluation<br/>3:00 AM UTC] --> GetProperties[Get All GSC Properties]
    
    GetProperties --> ForEach[For Each Property]
    
    ForEach --> CheckCompleted[Check Completed Protocols]
    CheckCompleted --> RunTriggers[Run All Trigger Detections]
    
    RunTriggers --> T1["Meta Surgeon Trigger<br/>Checks:<br/>- No Organization schema: +100<br/>- No LocalBusiness: +80<br/>- Weak entity signals: +75<br/>Threshold: 70"]
    
    RunTriggers --> T2["Index Diagnostic Trigger<br/>Checks:<br/>- Exclusion rate > 20%: +100<br/>- Error pages > 50: +95<br/>- Crawl budget waste: +80<br/>Threshold: 70"]
    
    RunTriggers --> T3["Link Architecture Trigger<br/>Checks:<br/>- Orphaned pages > 30: +100<br/>- Money pages underlinked: +90<br/>- Poor link distribution: +70<br/>Threshold: 65"]
    
    RunTriggers --> T4["Content Opportunity Trigger<br/>Checks:<br/>- Low CTR keywords > 100: +100<br/>- Page 2 keywords > 50: +95<br/>- Content gaps > 30: +80<br/>Threshold: 60"]
    
    T1 --> FilterCompleted[Filter Out Completed]
    T2 --> FilterCompleted
    T3 --> FilterCompleted
    T4 --> FilterCompleted
    
    FilterCompleted --> FilterThreshold[Filter: Score >= Threshold]
    FilterThreshold --> HasTriggers{Has Active Triggers?}
    
    HasTriggers -->|No| NoAction[No Action Needed]
    HasTriggers -->|Yes| ConflictResolution[Conflict Resolution]
    
    ConflictResolution --> Rule1{Meta Surgeon + Score >= 90?}
    Rule1 -->|Yes| SelectMeta[Select Meta Surgeon]
    Rule1 -->|No| Rule2{Index Diagnostic + Errors > 100?}
    
    Rule2 -->|Yes| SelectIndex[Select Index Diagnostic]
    Rule2 -->|No| Rule3[Sort by Priority + Score]
    
    Rule3 --> SelectHighest[Select Highest]
    
    SelectMeta --> SelectedTrigger[Selected Trigger]
    SelectIndex --> SelectedTrigger
    SelectHighest --> SelectedTrigger
    
    SelectedTrigger --> GenerateCard[Generate Card]
    
    style ConflictResolution fill:#f96,stroke:#333,stroke-width:3px
    style SelectedTrigger fill:#9f9,stroke:#333,stroke-width:2px
```

## Priority Hierarchy & Conflict Resolution

```mermaid
graph TD
    MultipleTriggers[Multiple Protocols Triggered] --> PriorityCheck[Check Priority Hierarchy]
    
    PriorityCheck --> Level1["LEVEL 1: Critical Foundation<br/>- Meta Surgeon (no schema)<br/>- Index Diagnostic (errors > 100)"]
    
    PriorityCheck --> Level2["LEVEL 2: Critical Optimization<br/>- Index Diagnostic (exclusion > 30%)"]
    
    PriorityCheck --> Level3["LEVEL 3: High Impact<br/>- Link Architecture (orphaned > 50)<br/>- Content Opportunity (potential > 1000)"]
    
    PriorityCheck --> Level4["LEVEL 4: Medium Impact<br/>- Content Opportunity<br/>- Link Architecture"]
    
    Level1 --> Decision1{Meta Surgeon<br/>Score >= 90?}
    Decision1 -->|Yes| ChooseMeta["✓ Choose Meta Surgeon<br/>Reason: Entity foundation required"]
    Decision1 -->|No| CheckIndex1
    
    CheckIndex1{Index Diagnostic<br/>Errors > 100?} -->|Yes| ChooseIndex1["✓ Choose Index Diagnostic<br/>Reason: Critical indexation crisis"]
    
    CheckIndex1 -->|No| Level2
    
    Level2 --> CheckExclusion{Exclusion Rate > 30%?}
    CheckExclusion -->|Yes| ChooseIndex2["✓ Choose Index Diagnostic<br/>Reason: Severe indexation problems"]
    CheckExclusion -->|No| Level3
    
    Level3 --> CheckOrphaned{Orphaned Pages > 50?}
    CheckOrphaned -->|Yes| ChooseLink["✓ Choose Link Architecture<br/>Reason: Major authority distribution issue"]
    CheckOrphaned -->|No| CheckOpportunity
    
    CheckOpportunity{Content Opportunity<br/>> 1000 clicks?} -->|Yes| ChooseContent["✓ Choose Content Opportunity<br/>Reason: Massive traffic opportunity"]
    CheckOpportunity -->|No| Level4
    
    Level4 --> SortByScore["Sort Remaining by:<br/>1. Priority level<br/>2. Trigger score<br/>3. Potential impact"]
    
    SortByScore --> SelectTop[Select Top Scorer]
    
    ChooseMeta --> Final[Final Selection]
    ChooseIndex1 --> Final
    ChooseIndex2 --> Final
    ChooseLink --> Final
    ChooseContent --> Final
    SelectTop --> Final
    
    Final --> LogDecision["Log Decision:<br/>- Selected protocol<br/>- Reason<br/>- Competing triggers<br/>- Scores"]
    
    style Decision1 fill:#f96,stroke:#333,stroke-width:2px
    style Final fill:#0f0,stroke:#333,stroke-width:3px
```

## Dynamic Insight Generation Intelligence

```mermaid
graph TD
    SelectedProtocol[Selected Protocol] --> GatherData[Gather Site-Specific Data]
    
    GatherData --> DataPoints["Data Points:<br/>- Site metrics<br/>- Trigger severity<br/>- Specific counts<br/>- Business context"]
    
    DataPoints --> ProtocolType{Protocol Type?}
    
    ProtocolType -->|Meta Surgeon| MetaInsight["Meta Surgeon Logic:<br/>IF no_org_schema:<br/>  'Google is guessing who {company} is...'<br/>IF schema_percentage < 10:<br/>  '{company} exists in schema void...'<br/>ELSE:<br/>  Default: 'Introduce to algorithm...'"]
    
    ProtocolType -->|Index Diagnostic| IndexInsight["Index Diagnostic Logic:<br/>IF exclusion_rate > 30:<br/>  'Indexation is bleeding. Google rejecting<br/>   {rate}%—{count} URLs invisible...'<br/>IF server_errors_per_day > 50:<br/>  'Googlebot hitting {errors} errors daily...'<br/>IF exclusion_rate > 20:<br/>  'Google crawlers visit daily but<br/>   {rate}% pages excluded...'"]
    
    ProtocolType -->|Link Architecture| LinkInsight["Link Architecture Logic:<br/>IF orphaned_pages > 50:<br/>  '{count} orphaned pages—content<br/>   Google and users can barely find...'<br/>IF money_pages_underlinked > 15:<br/>  '{count} highest-value pages have<br/>   almost no internal links...'<br/>IF link_concentration > 70:<br/>  '{concentration}% of links concentrated<br/>   in 10% of pages...'"]
    
    ProtocolType -->|Content Opportunity| ContentInsight["Content Opportunity Logic:<br/>IF total_opportunity > 1000:<br/>  'GSC shows {clicks} potential clicks wasted...'<br/>IF page_2_keywords > 100:<br/>  '{count} keywords stuck on page 2...'<br/>IF low_ctr_opportunities > 150:<br/>  'Google showing for {count} high-volume<br/>   keywords but terrible CTR...'"]
    
    MetaInsight --> InsertData[Insert Actual Data]
    IndexInsight --> InsertData
    LinkInsight --> InsertData
    ContentInsight --> InsertData
    
    InsertData --> Replace["Replace Placeholders:<br/>- {company}<br/>- {rate}<br/>- {count}<br/>- {errors}<br/>- {clicks}<br/>- {concentration}"]
    
    Replace --> GeneratedInsight["Generated Insight:<br/>Contextual, data-driven,<br/>compelling, specific"]
    
    GeneratedInsight --> StoreInCard[Store in Action Card]
    
    style InsertData fill:#fc9,stroke:#333,stroke-width:2px
    style GeneratedInsight fill:#9f9,stroke:#333,stroke-width:2px
```

## Pre-Analysis Phase Intelligence

```mermaid
graph TD
    CardSelected[Card Selected for Generation] --> PreAnalyze{Protocol Type?}
    
    PreAnalyze -->|Meta Surgeon| PreMeta["Pre-Analyze Schema:<br/>1. Crawl homepage<br/>2. Extract existing schemas<br/>3. Identify missing types<br/>4. Prioritize by importance<br/>Return:<br/>- missingSchemas: [...]<br/>- existingSchemas: [...]<br/>- priority: critical/high/medium"]
    
    PreAnalyze -->|Index Diagnostic| PreIndex["Pre-Fetch All Dimensions:<br/>1. substrate (indexation)<br/>2. crawl (crawler behavior)<br/>3. sitemap (discovery)<br/>4. redirect (navigation)<br/>For Each:<br/>- Calculate health score<br/>- Identify diagnosed causes<br/>- Extract specific URLs<br/>Return:<br/>- preAnalyzed: true<br/>- All 4 dimensions cached"]
    
    PreAnalyze -->|Link Architecture| PreLink["Pre-Build Link Graph:<br/>1. Crawl all pages<br/>2. Build link graph<br/>3. Identify orphaned pages<br/>4. Find underlinked pages<br/>5. Calculate opportunities<br/>Return:<br/>- orphanedPages: [...]<br/>- underlinkedPages: [...]<br/>- topOpportunities: [...]"]
    
    PreAnalyze -->|Content Opportunity| PreContent["Pre-Cluster Keywords:<br/>1. Fetch all GSC queries<br/>2. Categorize opportunities<br/>3. Cluster by topic/intent<br/>4. Calculate opportunity scores<br/>Return:<br/>- clusters: [...]<br/>- topOpportunities: [...]<br/>- totalPotential: X clicks"]
    
    PreMeta --> EnrichCard[Enrich Action Card]
    PreIndex --> EnrichCard
    PreLink --> EnrichCard
    PreContent --> EnrichCard
    
    EnrichCard --> CustomData["Add Custom Data:<br/>- Pre-analyzed metrics<br/>- Specific URLs/issues<br/>- Opportunity details<br/>- Priority ordering"]
    
    CustomData --> CreateCard[Create Card in Database]
    
    CreateCard --> UserReady["Card Ready for User:<br/>- Analysis buttons show 'Ready'<br/>- Data pre-loaded<br/>- No waiting for analysis"]
    
    style PreIndex fill:#9cf,stroke:#333,stroke-width:2px
    style EnrichCard fill:#fc9,stroke:#333,stroke-width:2px
    style UserReady fill:#9f9,stroke:#333,stroke-width:2px
```

## Diagnosed Cause Generation Algorithm

```mermaid
graph TD
    DimensionAnalysis[E.V.O. Dimension Analysis Complete] --> ExtractIssues[Extract Issues from Data]
    
    ExtractIssues --> Issue1["Issue Type 1: 404 Errors<br/>Data: GSC Coverage Report<br/>Extract: URLs with 404 status"]
    
    ExtractIssues --> Issue2["Issue Type 2: Exclusions<br/>Data: GSC Coverage Report<br/>Extract: Excluded page reasons"]
    
    ExtractIssues --> Issue3["Issue Type 3: Server Errors<br/>Data: GSC Crawl Stats<br/>Extract: 5xx error logs"]
    
    ExtractIssues --> Issue4["Issue Type 4: Redirect Chains<br/>Data: Site Crawl<br/>Extract: Multi-hop redirects"]
    
    Issue1 --> BuildCause1["Build Diagnosed Cause:<br/>reason: '404 errors blocking indexation'<br/>count: 23<br/>severity: calculate_severity(23)<br/>fix: 'Update or remove broken links'<br/>urls: [url1, url2, ...] (limit 10)<br/>strategies: [...]"]
    
    Issue2 --> BuildCause2["Build Diagnosed Cause:<br/>reason: 'Pages excluded by robots.txt'<br/>count: 15<br/>severity: calculate_severity(15)<br/>fix: 'Review robots.txt directives'<br/>urls: [...]<br/>strategies: [...]"]
    
    Issue3 --> BuildCause3["Build Diagnosed Cause:<br/>reason: 'Server errors preventing crawl'<br/>count: 45<br/>severity: calculate_severity(45)<br/>fix: 'Fix server configuration'<br/>urls: [...]<br/>strategies: [...]"]
    
    Issue4 --> BuildCause4["Build Diagnosed Cause:<br/>reason: 'Redirect chains wasting budget'<br/>count: 12<br/>severity: calculate_severity(12)<br/>fix: 'Consolidate redirects'<br/>urls: [...]<br/>strategies: [...]"]
    
    BuildCause1 --> CalculateSeverity["Calculate Severity:<br/>IF count > 50: 'critical'<br/>ELSE IF count > 20: 'high'<br/>ELSE IF count > 10: 'medium'<br/>ELSE: 'low'"]
    
    BuildCause2 --> CalculateSeverity
    BuildCause3 --> CalculateSeverity
    BuildCause4 --> CalculateSeverity
    
    CalculateSeverity --> GenerateStrategies["Generate Fix Strategies:<br/>1. Immediate Actions:<br/>   - Specific tactical fixes<br/>   - Quick wins<br/>2. Prevention:<br/>   - Long-term solutions<br/>   - Process improvements"]
    
    GenerateStrategies --> SortBySeverity[Sort by Severity]
    SortBySeverity --> LimitURLs[Limit URLs to 10 per cause]
    
    LimitURLs --> ReturnCauses["Return Diagnosed Causes:<br/>Array of cause objects<br/>with URLs, fixes, strategies"]
    
    ReturnCauses --> IncludeInPrompt[Include in Execution Assist Prompt]
    
    style BuildCause1 fill:#fc9,stroke:#333,stroke-width:2px
    style GenerateStrategies fill:#9f9,stroke:#333,stroke-width:2px
```

## Monitoring & Alert System

```mermaid
graph TD
    Schedule[Daily Schedule: 3:00 AM UTC] --> SyncGSC[Sync GSC Data]
    
    SyncGSC --> RunDiagnostics[Run Diagnostic Evaluation]
    
    RunDiagnostics --> AllProperties[For All Properties]
    
    AllProperties --> Evaluate["Evaluate Triggers:<br/>- Meta Surgeon<br/>- Index Diagnostic<br/>- Link Architecture<br/>- Content Opportunity"]
    
    Evaluate --> CheckScore{Trigger Score?}
    
    CheckScore -->|>= 90| Critical["CRITICAL ALERT<br/>Action:<br/>1. Generate card immediately<br/>2. Send email alert<br/>3. Send Slack notification<br/>4. Dashboard banner"]
    
    CheckScore -->|80-89| High["HIGH PRIORITY<br/>Action:<br/>1. Generate card<br/>2. Dashboard notification<br/>3. Email summary"]
    
    CheckScore -->|60-79| Medium["MEDIUM PRIORITY<br/>Action:<br/>1. Dashboard notification<br/>2. Add to recommendations"]
    
    CheckScore -->|< 60| Monitor["MONITOR ONLY<br/>Action:<br/>1. Log for trending<br/>2. No user notification"]
    
    Critical --> SendEmail["Email Subject:<br/>'🚨 Critical SEO Issue: {protocol}'<br/>Body:<br/>- Specific issue description<br/>- Impact estimate<br/>- Action link"]
    
    Critical --> SendSlack["Slack Message:<br/>'Critical issue detected'<br/>- Property name<br/>- Issue summary<br/>- Trigger score<br/>- Link to dashboard"]
    
    High --> DashboardNotif["Dashboard Notification:<br/>- Badge on Sprint Plan section<br/>- Highlight affected circle<br/>- Show preview of issue"]
    
    SendEmail --> LogEvent[Log Notification Event]
    SendSlack --> LogEvent
    DashboardNotif --> LogEvent
    
    Monitor --> TrendAnalysis[Trend Analysis]
    TrendAnalysis --> PredictFuture["Predictive Alerts:<br/>IF trending toward threshold:<br/>  Pre-warn user<br/>  'Approaching issue...'"]
    
    style Critical fill:#f66,stroke:#333,stroke-width:3px
    style High fill:#f96,stroke:#333,stroke-width:2px
    style PredictFuture fill:#fc9,stroke:#333,stroke-width:2px
```

## Complete E.V.O. Intelligence Flow

```mermaid
sequenceDiagram
    participant Cron as Scheduled Job
    participant EVO as E.V.O. Engine
    participant GSC as Google Search Console
    participant DB as Database
    participant User as User Dashboard
    
    Note over Cron,User: Daily Monitoring (3:00 AM UTC)
    
    Cron->>EVO: Trigger diagnostic evaluation
    
    activate EVO
    EVO->>DB: Get all properties with GSC
    DB-->>EVO: Properties list
    
    loop For Each Property
        EVO->>GSC: Fetch latest GSC data
        GSC-->>EVO: Coverage, crawl, queries data
        
        EVO->>EVO: Analyze dimensions
        Note over EVO: Calculate health scores<br/>Identify issues<br/>Generate insights
        
        EVO->>EVO: Run all trigger detections
        Note over EVO: Meta Surgeon: 45<br/>Index Diagnostic: 87<br/>Link Architecture: 62<br/>Content Opportunity: 71
        
        EVO->>DB: Check completed protocols
        DB-->>EVO: Completed: [meta_surgeon]
        
        EVO->>EVO: Filter out completed
        Note over EVO: Remaining triggers:<br/>Index Diagnostic: 87<br/>Content Opportunity: 71<br/>Link Architecture: 62
        
        EVO->>EVO: Conflict resolution
        Note over EVO: Apply priority hierarchy<br/>Check special rules<br/>Sort by score
        
        EVO->>EVO: Select: Index Diagnostic
        Note over EVO: Reason: Score > 85 (high priority)<br/>Errors > 100 (critical rule)
        
        EVO->>EVO: Generate dynamic insight
        Note over EVO: Template: exclusion_rate context<br/>Insert actual data: 32% excluded<br/>Result: "Your indexation is bleeding..."
        
        EVO->>EVO: Pre-analysis phase
        Note over EVO: Pre-fetch 4 dimensions:<br/>- substrate<br/>- crawl<br/>- sitemap<br/>- redirect
        
        EVO->>DB: Create action card
        DB-->>EVO: Card ID: 123
        
        EVO->>DB: Cache E.V.O. results
        
        EVO->>User: Send notification
        Note over User: Email: Critical issue<br/>Dashboard: New card badge<br/>Slack: Alert message
    end
    
    deactivate EVO
    
    Note over Cron,User: User Opens Card
    
    User->>DB: Load card
    DB-->>User: Card with pre-analysis
    
    User->>User: Navigate to Step 1
    User->>DB: Get E.V.O. dimension (from cache)
    DB-->>User: Dimension data (instant)
    
    Note over User: Analysis button shows "Ready"<br/>No loading delay<br/>Data pre-computed
    
    User->>User: Click Analysis
    User->>User: Display health + diagnosed causes
    
    alt Health < 70
        User->>User: Show Execution Assist
        User->>User: Generate data-driven prompt
        Note over User: Includes actual URLs<br/>Specific fixes<br/>Real metrics
    else Health >= 70
        User->>User: Auto-enable Next Step
        Note over User: No fixes needed<br/>Skip Execution Assist
    end
```

## Key Intelligence Capabilities

### 1. Adaptive Trigger Detection
- Monitors multiple data sources simultaneously
- Calculates weighted scores based on severity and count
- Dynamically adjusts thresholds based on site characteristics

### 2. Intelligent Conflict Resolution
- Hierarchical priority system (foundation > optimization > growth)
- Special rules for critical issues (errors > 100, no schema)
- Considers completed protocols to avoid duplication

### 3. Context-Aware Insight Generation
- Analyzes site-specific metrics
- Selects appropriate insight template
- Injects actual data for compelling narrative

### 4. Predictive Pre-Analysis
- Pre-computes dimension data before user opens card
- Caches results for instant display
- Reduces user wait time from minutes to seconds

### 5. Data-Driven Recommendations
- Extracts specific URLs with issues
- Generates actionable fix strategies
- Prioritizes by impact and effort

### 6. Continuous Learning
- Tracks completion rates and success metrics
- Adjusts trigger thresholds based on outcomes
- Improves insight generation from user feedback
