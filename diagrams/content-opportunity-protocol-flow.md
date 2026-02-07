# Content Opportunity Protocol - Flow Diagram

## Protocol Overview
**Type**: Analysis-Based (E.V.O. Integrated + GSC-Driven)
**Sprint Circle**: 3 (Growth)
**E.V.O. Dimensions**: inventory, keyword_opportunities, content_coverage_gaps

## Complete Flow with Sequential E.V.O. Analysis

```mermaid
graph TD
    Start[User Clicks Sprint Circle 3] --> LoadCard[Load Content Opportunity Card]
    
    LoadCard --> Page1[Page 1: Strategist Insight]
    Page1 --> P1Content["'Google is already showing your site...'<br/>Impression opportunities"]
    P1Content --> Continue[User Clicks Continue]
    
    Continue --> Page2[Page 2: Step 1 - Content Inventory]
    
    Page2 --> AutoFetch1["Auto-Fetch: inventory dimension"]
    AutoFetch1 --> ShowLoading1[Analysis Button: Loading]
    ShowLoading1 --> FetchComplete1[Analysis Button: Ready]
    
    FetchComplete1 --> UserAnalysis1[User Clicks Analysis]
    UserAnalysis1 --> Modal1["Display Inventory:<br/>- Total pages: 247<br/>- Ranking keywords: 1,823<br/>- Avg position: 18.4<br/>- Content coverage: 62%"]
    
    Modal1 --> NoExecNeeded1[No Execution Assist Needed]
    NoExecNeeded1 --> AutoEnable1[Auto-Enable Next Step]
    
    AutoEnable1 --> NextClick1[User Clicks Next]
    NextClick1 --> Page3[Page 3: Step 2 - Keyword Discovery]
    
    Page3 --> AutoFetch2["Auto-Fetch: keyword_opportunities"]
    AutoFetch2 --> ShowLoading2[Analysis Button: Loading]
    ShowLoading2 --> FetchComplete2[Analysis Button: Ready]
    
    FetchComplete2 --> UserAnalysis2[User Clicks Analysis]
    UserAnalysis2 --> Modal2["Display Opportunities:<br/>- Low CTR: 156 keywords<br/>- Page 2 wins: 89 keywords<br/>- High volume: 34 keywords<br/>- Potential gain: 847 clicks/mo"]
    
    Modal2 --> CheckOpportunities{Has Opportunities?}
    
    CheckOpportunities -->|Yes| ShowExec2[Show Execution Assist]
    ShowExec2 --> UserClicksExec2[User Clicks Execution Assist]
    
    UserClicksExec2 --> SpecialPrompt["Generate Keyword Optimization Prompt<br/>WITH DATA:<br/>1. 'roof repair near me'<br/>   Page: /roof-repair<br/>   Position: 4, CTR: 2.1% (Expected: 13%)<br/>   Potential: +45 clicks/month<br/>2. 'metal roofing cost'<br/>   Page: /metal-roofing<br/>   Position: 6, CTR: 1.8% (Expected: 8%)<br/>   Potential: +67 clicks/month"]
    
    SpecialPrompt --> UserCopies2[User Copies Title Optimization Prompt]
    UserCopies2 --> NextClick2[User Clicks Next]
    
    NextClick2 --> Page4[Page 4: Step 3 - Coverage Gap Analysis]
    
    Page4 --> AutoFetch3["Auto-Fetch: content_coverage_gaps"]
    AutoFetch3 --> ShowLoading3[Analysis Button: Loading]
    ShowLoading3 --> FetchComplete3[Analysis Button: Ready]
    
    FetchComplete3 --> UserAnalysis3[User Clicks Analysis]
    UserAnalysis3 --> Modal3["Display Gaps:<br/>- Position gaps: 89 (11-20)<br/>- Content gaps: 34 (no page)<br/>- CTR gaps: 156 (low CTR)<br/>- Total opportunity: 847 clicks/mo"]
    
    Modal3 --> GapCategories["Show by Type:<br/>📍 Position gap: optimize existing<br/>📄 Content gap: create new page<br/>👁️ CTR gap: optimize meta<br/>⚔️ Cannibalization: consolidate"]
    
    GapCategories --> NoExecNeeded3[No Execution Assist Needed]
    NoExecNeeded3 --> AutoEnable3[Auto-Enable Next Step]
    
    AutoEnable3 --> NextClick3[User Clicks Next]
    NextClick3 --> Page5[Page 5: Step 4 - Content Planning]
    
    Page5 --> ShowExec4[Show Execution Assist]
    ShowExec4 --> UserClicksExec4[User Clicks Execution Assist]
    
    UserClicksExec4 --> LoadAllData["Load Cached Data:<br/>- Step 1: Content inventory<br/>- Step 2: Keyword opportunities<br/>- Step 3: Coverage gaps"]
    
    LoadAllData --> GenContentPlan[Generate Content Planning Prompt]
    
    GenContentPlan --> ComprehensivePlan["COMPREHENSIVE PLAN:<br/>1. Opportunity Summary<br/>   - 279 total gaps<br/>   - 847 potential clicks/month<br/>2. Keyword Clusters<br/>   - Metal Roofing (245 clicks)<br/>   - Roof Repair (189 clicks)<br/>3. Content Briefs<br/>   - Target URL<br/>   - Primary keyword<br/>   - Related queries<br/>   - Content structure<br/>   - Internal links<br/>   - Schema markup<br/>4. Priority Matrix<br/>   - Quick wins (Week 1)<br/>   - High impact (Week 2-3)<br/>   - Long-term (Month 2+)"]
    
    ComprehensivePlan --> UserCopies4[User Copies Plan]
    UserCopies4 --> EnableComplete[Complete Button: ENABLED]
    
    EnableComplete --> CompleteClick[User Clicks Complete]
    CompleteClick --> Page6[Page 6: Completion]
    
    Page6 --> Status1["Analyzing Coverage Gaps..."]
    Status1 -->|2s| Status2["Content Strategy Complete"]
    Status2 -->|2s| Status3["Opportunity pages identified"]
    
    Status3 --> SaveDB[Save Completion]
    SaveDB --> UnlockNext[All Circles Complete!]
    UnlockNext --> CloseCard[Close Card]
    
    style Page2 fill:#9cf,stroke:#333,stroke-width:2px
    style Page3 fill:#9cf,stroke:#333,stroke-width:2px
    style Page4 fill:#9cf,stroke:#333,stroke-width:2px
    style Page5 fill:#bbf,stroke:#333,stroke-width:2px
    style SpecialPrompt fill:#f96,stroke:#333,stroke-width:2px
    style GenContentPlan fill:#9f9,stroke:#333,stroke-width:2px
```

## Sequential E.V.O. Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Sprint Card UI
    participant API as Kinetic API
    participant EVO as E.V.O. Engine
    participant GSC as Google Search Console
    
    Note over User,GSC: STEP 1: Content Inventory
    User->>UI: Navigate to Step 1
    UI->>API: GET /evo/dimension/inventory
    API->>EVO: Analyze content baseline
    EVO->>GSC: Fetch site pages + ranking data
    GSC-->>EVO: Pages + keyword mappings
    EVO-->>API: Inventory data
    API-->>UI: Display metrics
    UI->>UI: Cache as evoDataCache[1]
    UI->>UI: Auto-enable Next (analysis only)
    
    Note over User,GSC: STEP 2: Keyword Opportunities
    User->>UI: Navigate to Step 2
    UI->>API: GET /evo/dimension/keyword_opportunities
    API->>EVO: Analyze GSC queries
    EVO->>GSC: Fetch all queries (3 months)
    GSC-->>EVO: Query data (impressions, clicks, CTR, position)
    EVO->>EVO: Categorize opportunities
    Note over EVO: - Low CTR<br/>- Page 2 quick wins<br/>- High volume<br/>- Zero click
    EVO-->>API: Opportunity data
    API-->>UI: Display opportunities
    UI->>UI: Cache as evoDataCache[2]
    
    User->>UI: Click Analysis
    UI->>UI: Display keyword opportunities
    UI->>UI: Show Execution Assist (for title optimization)
    User->>UI: Click Execution Assist
    UI->>UI: Generate prompt with specific URLs + titles
    User->>UI: Copy prompt
    
    Note over User,GSC: STEP 3: Coverage Gap Analysis
    User->>UI: Navigate to Step 3
    UI->>API: GET /evo/dimension/content_coverage_gaps
    API->>EVO: Cross-reference Steps 1 & 2 data
    EVO->>EVO: Compare inventory vs opportunities
    Note over EVO: Identify:<br/>- Position gaps (11-20)<br/>- Content gaps (no page)<br/>- CTR gaps (low CTR)<br/>- Cannibalization
    EVO->>EVO: Calculate opportunity scores
    EVO-->>API: Gap data
    API-->>UI: Display gaps by type
    UI->>UI: Cache as evoDataCache[3]
    UI->>UI: Auto-enable Next (analysis only)
    
    Note over User,GSC: STEP 4: Content Planning
    User->>UI: Navigate to Step 4
    UI->>UI: Show Execution Assist
    User->>UI: Click Execution Assist
    UI->>UI: Load ALL cached E.V.O. data (Steps 1-3)
    UI->>UI: Generate comprehensive content plan
    Note over UI: Include:<br/>- Keyword clusters<br/>- Content briefs<br/>- Priority matrix<br/>- Implementation timeline
    User->>UI: Copy plan
    User->>UI: Click Complete
```

## Four-Step GSC Analysis Strategy

```mermaid
graph TD
    subgraph "Step 1: Content Inventory Audit"
        S1[Baseline Analysis]
        S1 --> S1A["Crawl all pages<br/>Extract target keywords<br/>Map pages → keywords"]
        S1A --> S1B["Pull GSC ranking data<br/>For each page:<br/>- Keywords it ranks for<br/>- Positions<br/>- Traffic data"]
        S1B --> S1C["Create Baseline:<br/>- Total pages: 247<br/>- Ranking keywords: 1,823<br/>- Avg position: 18.4<br/>- Top performers<br/>- Underperformers"]
    end
    
    subgraph "Step 2: Keyword Discovery"
        S2[GSC Query Analysis]
        S2 --> S2A["Pull ALL queries<br/>Last 3 months<br/>Impressions > 10"]
        S2A --> S2B[Categorize Opportunities]
        S2B --> S2C1["Low CTR: 156<br/>impressions > 100<br/>CTR < expected * 0.5"]
        S2B --> S2C2["Page 2: 89<br/>Position 11-20<br/>Impressions > 50"]
        S2B --> S2C3["High Volume: 34<br/>Impressions > 1000<br/>Position > 20"]
        S2C1 --> S2D["Calculate potential:<br/>impressions * (expected - current) * 30"]
        S2C2 --> S2D
        S2C3 --> S2D
    end
    
    subgraph "Step 3: Coverage Gap Analysis"
        S3[Cross-Reference]
        S3 --> S3A["Compare:<br/>Step 1 (what exists)<br/>vs<br/>Step 2 (what's possible)"]
        S3A --> S3B[Identify Gap Types]
        S3B --> S3C1["📍 Position Gap:<br/>Ranks 11-20<br/>Optimize existing"]
        S3B --> S3C2["📄 Content Gap:<br/>No dedicated page<br/>Create new"]
        S3B --> S3C3["👁️ CTR Gap:<br/>Ranks well, low CTR<br/>Optimize title/meta"]
        S3B --> S3C4["⚔️ Cannibalization:<br/>Multiple pages compete<br/>Consolidate"]
        S3C1 --> S3D["Total: 279 gaps<br/>Opportunity: 847 clicks/mo"]
        S3C2 --> S3D
        S3C3 --> S3D
        S3C4 --> S3D
    end
    
    subgraph "Step 4: Content Planning Strategy"
        S4[Cluster & Plan]
        S4 --> S4A["Group related keywords<br/>by topic + intent"]
        S4A --> S4B["Design content briefs:<br/>- Target URL<br/>- Primary keyword<br/>- Related queries<br/>- Content structure<br/>- Internal links<br/>- Schema markup"]
        S4B --> S4C["Prioritize:<br/>- Quick wins (optimize)<br/>- High impact (create)<br/>- Long-term (pillar pages)"]
        S4C --> S4D["Implementation Timeline:<br/>Week 1, Week 2-3, Month 2+"]
    end
    
    S1C --> S2
    S2D --> S3
    S3D --> S4
    S4D --> Execute[Execute Content Strategy]
    
    style Execute fill:#0f0,stroke:#333,stroke-width:3px
```

## Keyword Opportunity Categorization

```mermaid
graph TD
    GSCQueries[All GSC Queries<br/>Last 3 Months] --> Filter[Filter: Impressions > 10]
    
    Filter --> Categorize[Categorize by Type]
    
    Categorize --> LowCTR["LOW CTR OPPORTUNITIES<br/>Filter: impressions > 100 AND<br/>ctr < expected * 0.5<br/>Action: Optimize title/meta<br/>Priority: HIGH"]
    
    Categorize --> Page2["PAGE 2 QUICK WINS<br/>Filter: position 11-20 AND<br/>impressions > 50<br/>Action: Content + links<br/>Priority: HIGH"]
    
    Categorize --> HighVolume["HIGH VOLUME<br/>Filter: impressions > 1000 AND<br/>position > 20<br/>Action: New landing page<br/>Priority: MEDIUM"]
    
    Categorize --> ZeroClick["ZERO CLICK<br/>Filter: impressions > 20 AND<br/>clicks = 0<br/>Action: Intent investigation<br/>Priority: LOW"]
    
    LowCTR --> CalcPotential[Calculate Potential Gain]
    Page2 --> CalcPotential
    HighVolume --> CalcPotential
    ZeroClick --> CalcPotential
    
    CalcPotential --> Formula["Formula:<br/>potential = impressions *<br/>(expectedCTR - currentCTR) * 30"]
    
    Formula --> PrioritySort["Sort by Potential:<br/>High: > 100 clicks/mo<br/>Medium: 30-100<br/>Low: 10-30"]
    
    style LowCTR fill:#f96,stroke:#333,stroke-width:2px
    style Page2 fill:#9f9,stroke:#333,stroke-width:2px
```

## Gap Type Identification

```mermaid
graph TD
    CompareData["Compare:<br/>Content Inventory<br/>vs<br/>Keyword Opportunities"] --> IdentifyGaps[Identify Gaps]
    
    IdentifyGaps --> PositionGap["📍 POSITION GAP<br/>Definition: Ranks 11-20<br/>Detection: existing_position BETWEEN 11 AND 20<br/>Solution: Optimize page<br/>- Add content depth<br/>- Improve internal links<br/>- Enhance on-page SEO"]
    
    IdentifyGaps --> ContentGap["📄 CONTENT GAP<br/>Definition: No dedicated page<br/>Detection: query has impressions<br/>BUT no page targets keyword<br/>Solution: Create new page<br/>- Target query cluster<br/>- Follow content brief<br/>- Implement schema"]
    
    IdentifyGaps --> CTRGap["👁️ CTR GAP<br/>Definition: Low CTR for position<br/>Detection: position <= 10 AND<br/>ctr < expected * 0.7<br/>Solution: Optimize snippets<br/>- Rewrite title tag<br/>- Improve meta description<br/>- Add power words"]
    
    IdentifyGaps --> Cannibalization["⚔️ CANNIBALIZATION<br/>Definition: Multiple pages compete<br/>Detection: multiple pages rank for<br/>same query, all positions > 10<br/>Solution: Consolidate<br/>- Merge content<br/>- 301 redirect<br/>- Or clarify differentiation"]
    
    PositionGap --> ScoreGap[Score Each Gap]
    ContentGap --> ScoreGap
    CTRGap --> ScoreGap
    Cannibalization --> ScoreGap
    
    ScoreGap --> Prioritize["Prioritize by:<br/>opportunityScore =<br/>impressions *<br/>(expectedCTR - currentCTR) * 30"]
    
    style PositionGap fill:#fc9,stroke:#333,stroke-width:2px
    style ContentGap fill:#9cf,stroke:#333,stroke-width:2px
    style CTRGap fill:#f96,stroke:#333,stroke-width:2px
```

## Content Planning with Data from All Steps

```mermaid
graph TD
    Step4Planning[Step 4: Content Planning] --> LoadData[Load All Cached E.V.O. Data]
    
    LoadData --> Data1["Step 1 Data:<br/>- Total pages<br/>- Current rankings<br/>- Baseline metrics"]
    
    LoadData --> Data2["Step 2 Data:<br/>- All keyword opportunities<br/>- Categorized by type<br/>- Potential gains"]
    
    LoadData --> Data3["Step 3 Data:<br/>- Identified gaps<br/>- Gap types<br/>- Opportunity scores"]
    
    Data1 --> Cluster[Cluster Related Keywords]
    Data2 --> Cluster
    Data3 --> Cluster
    
    Cluster --> Example["Example Cluster:<br/>Metal Roofing Installation<br/>- Primary: 'metal roofing installation'<br/>- Related: 'how to install', 'cost', 'near me'<br/>- Total impressions: 5,400<br/>- Potential: 245 clicks/month<br/>- Gap type: Content gap"]
    
    Example --> ContentBrief["Generate Content Brief:<br/>Target URL: /services/metal-roofing-installation<br/>Primary Keyword: metal roofing installation<br/>Search Intent: commercial + informational<br/>Content Structure:<br/>  1. Introduction (150-200 words)<br/>  2. Installation Process (300-500 words)<br/>  3. Cost Guide (300 words)<br/>  4. DIY vs Professional (250 words)<br/>  5. Local Service Info (200 words)<br/>Internal Links: /services/roofing, /contact<br/>Schema: Service + HowTo + FAQPage"]
    
    ContentBrief --> PriorityMatrix["Priority Matrix:<br/>QUICK WINS (Week 1):<br/>- Optimize 5 existing pages<br/>  Effort: Low, Potential: 180 clicks<br/>HIGH IMPACT (Week 2-3):<br/>- Create 3 new pages<br/>  Effort: Medium, Potential: 420 clicks<br/>LONG-TERM (Month 2+):<br/>- Build pillar content<br/>  Effort: High, Potential: 680 clicks"]
    
    PriorityMatrix --> Timeline[Implementation Timeline]
    
    style Cluster fill:#fc9,stroke:#333,stroke-width:2px
    style ContentBrief fill:#9f9,stroke:#333,stroke-width:2px
    style PriorityMatrix fill:#6f6,stroke:#333,stroke-width:2px
```

## Special Step 2 Keyword Optimization Prompt

```mermaid
graph TD
    Step2Analysis[Step 2: Keyword Discovery Analysis] --> HasOpportunities{Has Low CTR Keywords?}
    
    HasOpportunities -->|Yes| ShowExecButton[Show Execution Assist]
    ShowExecButton --> UserClicks[User Clicks Execution Assist]
    
    UserClicks --> PullData[Pull Opportunity Data from E.V.O.]
    
    PullData --> BuildPrompt["Build Special Prompt:<br/>OBJECTIVE: Optimize titles and metas<br/>to improve CTR"]
    
    BuildPrompt --> IncludeKeywords["For Each Keyword:<br/>1. Query: 'roof repair near me'<br/>   Page: /roof-repair<br/>   Position: 4<br/>   Current CTR: 2.1%<br/>   Expected CTR: 13%<br/>   Potential: +45 clicks/month<br/>2. Query: 'metal roofing cost'<br/>   Page: /metal-roofing<br/>   Position: 6<br/>   Current CTR: 1.8%<br/>   Expected CTR: 8%<br/>   Potential: +67 clicks/month"]
    
    IncludeKeywords --> Instructions["INSTRUCTIONS:<br/>1. For each page:<br/>   - Locate HTML/template<br/>   - Find current title + meta<br/>   - Read page content<br/>2. Optimize title:<br/>   - Include keyword naturally<br/>   - Under 60 characters<br/>   - Compelling + click-worthy<br/>3. Optimize meta description:<br/>   - Include keyword<br/>   - Under 155 characters<br/>   - Include benefits + CTA<br/>4. Create optimization plan"]
    
    Instructions --> UserCopies[User Copies Prompt]
    UserCopies --> EnableNext[Enable Next Step]
    
    style BuildPrompt fill:#f96,stroke:#333,stroke-width:2px
    style IncludeKeywords fill:#9f9,stroke:#333,stroke-width:2px
```

## Future E.V.O. Auto-Generation

```mermaid
graph TD
    DailySync[Daily GSC Data Sync] --> AnalyzeQueries[Analyze Query Performance]
    
    AnalyzeQueries --> Check1{Low CTR Keywords > 100?}
    AnalyzeQueries --> Check2{Page 2 Keywords > 50?}
    AnalyzeQueries --> Check3{Content Gaps > 30?}
    AnalyzeQueries --> Check4{Total Opportunity > 500 clicks?}
    
    Check1 -->|Yes| Score100[Score +100]
    Check2 -->|Yes| Score95[Score +95]
    Check3 -->|Yes| Score80[Score +80]
    Check4 -->|Yes| Score70[Score +70]
    
    Score100 --> TotalScore[Calculate Total]
    Score95 --> TotalScore
    Score80 --> TotalScore
    Score70 --> TotalScore
    
    TotalScore --> Threshold{Score >= 60?}
    
    Threshold -->|Yes| GenerateCard[Generate Content Opportunity Card]
    
    GenerateCard --> CustomInsight["Dynamic Insight:<br/>'Your GSC data shows 847 potential<br/>monthly clicks being wasted...'<br/>Include actual numbers"]
    
    CustomInsight --> PreCluster["Pre-Compute:<br/>- Cluster keywords by topic<br/>- Generate content briefs<br/>- Calculate all opportunity scores"]
    
    PreCluster --> CacheResults["Cache all 3 dimensions:<br/>- inventory<br/>- keyword_opportunities<br/>- content_coverage_gaps"]
    
    CacheResults --> EnrichStep4["Enrich Step 4 Prompt:<br/>Include pre-generated:<br/>- Keyword clusters<br/>- Content briefs<br/>- Priority matrix<br/>- Implementation timeline"]
    
    EnrichStep4 --> NotifyUser[Notify User]
    
    style GenerateCard fill:#f66,stroke:#333,stroke-width:3px
    style PreCluster fill:#f96,stroke:#333,stroke-width:2px
    style EnrichStep4 fill:#9f9,stroke:#333,stroke-width:2px
```

## Success Metrics & Tracking

```mermaid
graph LR
    Before[Pre-Implementation] --> Baseline["Baseline:<br/>- Content pages: 247<br/>- Ranking keywords: 1,823<br/>- Avg position: 18.4<br/>- Monthly clicks: 2,145"]
    
    Implement[Implement Strategy] --> Actions["Actions:<br/>- Pages created: 12<br/>- Pages optimized: 8<br/>- Titles rewritten: 156<br/>- New content: 45,000 words"]
    
    Actions --> After3Mo[After 3 Months]
    
    After3Mo --> Results["Results:<br/>- Content pages: 259<br/>- Ranking keywords: 2,438<br/>- Avg position: 13.1<br/>- Monthly clicks: 3,682"]
    
    Results --> Impact["Impact:<br/>✓ 71% increase in clicks<br/>✓ 34% more ranking keywords<br/>✓ 5.3 position improvement<br/>✓ 58% of opportunity captured"]
    
    style Results fill:#9f9,stroke:#333,stroke-width:2px
    style Impact fill:#6f6,stroke:#333,stroke-width:2px
```
