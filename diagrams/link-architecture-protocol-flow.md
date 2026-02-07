# Link Architecture Protocol - Flow Diagram

## Protocol Overview
**Type**: Link Expansion (Hybrid: Analysis + Implementation)
**Sprint Circle**: 2 (Optimization)
**E.V.O. Integration**: None (Manual analysis protocol)

## Complete Flow

```mermaid
graph TD
    Start[User Clicks Sprint Circle 2] --> LoadCard[Load Link Architecture Card]
    
    LoadCard --> Page1[Page 1: Strategist Insight]
    Page1 --> P1Content["'Internal links distribute authority...'<br/>Orphaned pages, weak signals"]
    P1Content --> Continue[User Clicks Continue]
    
    Continue --> Page2[Page 2: Step 1 - Link Inventory]
    
    Page2 --> NoEVO[No E.V.O. Auto-Fetch]
    NoEVO --> ShowExec[Show Execution Assist]
    ShowExec --> NextDisabled[Next Step: DISABLED]
    
    NextDisabled --> UserClicksExec[User Clicks Execution Assist]
    UserClicksExec --> DetectLinkProtocol{Protocol = link_expansion?}
    
    DetectLinkProtocol -->|Yes| GenLinkPrompt[Generate Link Expansion Prompt]
    
    GenLinkPrompt --> Step1Prompt["OBJECTIVE: Crawl and analyze all internal links<br/>INSTRUCTIONS:<br/>- Map all internal links<br/>- Identify orphaned pages<br/>- Calculate link depth<br/>- Analyze link equity distribution<br/>TOOLS: Screaming Frog, Sitebulb, custom script<br/>DELIVERABLE: link-inventory-audit.md"]
    
    Step1Prompt --> Modal[Display Modal]
    Modal --> UserCopies[User Copies Prompt]
    UserCopies --> EnableNext[Next Step: ENABLED]
    
    EnableNext --> NextClick[User Clicks Next Step]
    NextClick --> Page3[Page 3: Step 2 - Strategic Opportunities]
    
    Page3 --> Step2Exec[Show Execution Assist]
    Step2Exec --> Step2Prompt["OBJECTIVE: Identify pages needing authority<br/>INSTRUCTIONS:<br/>- Identify target pages (money pages)<br/>- Find contextual source pages<br/>- Score opportunities by impact<br/>- Map topical clusters<br/>DELIVERABLE: strategic-link-opportunities.md"]
    
    Step2Prompt --> UserCopies2[User Copies]
    UserCopies2 --> Page4[Page 4: Step 3 - Anchor Optimization]
    
    Page4 --> Step3Exec[Show Execution Assist]
    Step3Exec --> Step3Prompt["OBJECTIVE: Optimize anchor text patterns<br/>INSTRUCTIONS:<br/>- Audit current anchor text<br/>- Identify over-optimization<br/>- Design diverse anchor variations<br/>- Plan natural language anchors<br/>DELIVERABLE: anchor-text-optimization-plan.md"]
    
    Step3Prompt --> UserCopies3[User Copies]
    UserCopies3 --> Page5[Page 5: Step 4 - Implementation]
    
    Page5 --> Step4Exec[Show Execution Assist]
    Step4Exec --> Step4Prompt["OBJECTIVE: Create implementation roadmap<br/>INSTRUCTIONS:<br/>- Identify exact placement locations<br/>- Specify file modifications<br/>- Ensure non-disruptive integration<br/>- Plan scalable linking patterns<br/>DELIVERABLE: link-implementation-path.md"]
    
    Step4Prompt --> UserCopies4[User Copies]
    UserCopies4 --> EnableComplete[Complete Button: ENABLED]
    
    EnableComplete --> CompleteClick[User Clicks Complete]
    CompleteClick --> Page6[Page 6: Completion]
    
    Page6 --> Status1["Analyzing Link Architecture..."]
    Status1 -->|2s| Status2["Link Distribution Strategy Complete"]
    Status2 -->|2s| Status3["Strategic pathways established"]
    
    Status3 --> SaveDB[Save Completion]
    SaveDB --> UnlockCircle3[Unlock Circle 3]
    UnlockCircle3 --> CloseCard[Close Card]
    
    style Page2 fill:#bbf,stroke:#333,stroke-width:2px
    style Page3 fill:#bbf,stroke:#333,stroke-width:2px
    style Page4 fill:#bbf,stroke:#333,stroke-width:2px
    style Page5 fill:#bbf,stroke:#333,stroke-width:2px
    style GenLinkPrompt fill:#f96,stroke:#333,stroke-width:2px
```

## Four-Step Link Strategy

```mermaid
graph TD
    subgraph "Step 1: Link Inventory Audit"
        S1[Crawl Site Structure]
        S1 --> S1A[Map All Internal Links]
        S1A --> S1B[Calculate Link Metrics]
        S1B --> S1C["Identify:<br/>- Orphaned pages (0 incoming)<br/>- Link depth from homepage<br/>- Link equity distribution<br/>- Hub pages"]
    end
    
    subgraph "Step 2: Strategic Opportunities"
        S2[Identify Target Pages]
        S2 --> S2A["Money pages needing links<br/>Orphaned valuable content<br/>Topical pillar pages"]
        S2A --> S2B[Find Source Pages]
        S2B --> S2C["High-authority pages<br/>High-traffic pages<br/>Contextually relevant pages"]
        S2C --> S2D["Score Opportunities:<br/>targetValue * 0.4<br/>+ relevance * 0.3<br/>+ sourceAuth * 0.2<br/>+ ease * 0.1"]
    end
    
    subgraph "Step 3: Anchor Text Optimization"
        S3[Audit Current Anchors]
        S3 --> S3A["Check distribution:<br/>- Exact match: 10-15%<br/>- Partial match: 30-40%<br/>- Branded: 15-20%<br/>- Generic: 10-15%<br/>- Descriptive: 20-30%"]
        S3A --> S3B[Design Anchor Variations]
        S3B --> S3C["Create diverse anchors<br/>Avoid over-optimization<br/>Natural language flow"]
    end
    
    subgraph "Step 4: Implementation Path"
        S4[Plan Placement Zones]
        S4 --> S4A["High value:<br/>- Main content body<br/>- Contextual mentions"]
        S4A --> S4B["Medium value:<br/>- Related resources<br/>- End-of-content sections"]
        S4B --> S4C[Create Implementation Roadmap]
        S4C --> S4D["Phase 1: Quick wins<br/>Phase 2: Topical clusters<br/>Phase 3: Anchor optimization"]
    end
    
    S1C --> S2
    S2D --> S3
    S3C --> S4
    S4D --> Complete[Link Architecture Complete]
    
    style Complete fill:#0f0,stroke:#333,stroke-width:3px
```

## Link Opportunity Scoring System

```mermaid
graph TD
    Opportunity[Link Opportunity Identified] --> CalculateScore[Calculate Opportunity Score]
    
    CalculateScore --> Factor1["Target Page Value (40%)<br/>- Conversion potential<br/>- Search traffic<br/>- Business goals"]
    
    CalculateScore --> Factor2["Contextual Relevance (30%)<br/>- Topic alignment<br/>- Same cluster?<br/>- User intent match"]
    
    CalculateScore --> Factor3["Source Page Authority (20%)<br/>- Incoming links<br/>- Traffic volume<br/>- Domain authority"]
    
    CalculateScore --> Factor4["Implementation Ease (10%)<br/>- File access<br/>- Content fit<br/>- Technical difficulty"]
    
    Factor1 --> TotalScore[Total Score = Σ * 100]
    Factor2 --> TotalScore
    Factor3 --> TotalScore
    Factor4 --> TotalScore
    
    TotalScore --> Priority{Score >= 70?}
    
    Priority -->|Yes| HighPriority[High Priority Opportunity]
    Priority -->|No| MediumLowPriority[Medium/Low Priority]
    
    HighPriority --> Implement[Add to Implementation Queue]
    
    style CalculateScore fill:#fc9,stroke:#333,stroke-width:2px
    style HighPriority fill:#9f9,stroke:#333,stroke-width:2px
```

## Topical Cluster Linking

```mermaid
graph TD
    subgraph "Roofing Services Cluster"
        Pillar["/roofing-services<br/>(Pillar Page)"]
        
        Pillar --> Sub1["/shingle-roofing"]
        Pillar --> Sub2["/metal-roofing"]
        Pillar --> Sub3["/roof-repair"]
        
        Sub1 -.->|Missing| Sub2
        Sub1 --> Pillar
        
        Sub2 -.->|Missing| Sub3
        Sub2 --> Pillar
        
        Sub3 --> Sub1
        Sub3 --> Pillar
    end
    
    AddLinks[Identify Missing Connections] --> Strategy["Strategy:<br/>1. Link Sub1 → Sub2<br/>   Anchor: 'metal roofing options'<br/>   Context: 'Users may also consider...'<br/>2. Link Sub2 → Sub3<br/>   Anchor: 'roof repair services'<br/>   Context: 'After installation, maintenance...'"]
    
    Strategy --> Implement[Implement Non-Disruptively]
    
    style Pillar fill:#fc9,stroke:#333,stroke-width:3px
    style Sub1 fill:#9cf,stroke:#333,stroke-width:2px
    style Sub2 fill:#9cf,stroke:#333,stroke-width:2px
    style Sub3 fill:#9cf,stroke:#333,stroke-width:2px
```

## Non-Disruptive Implementation Rules

```mermaid
graph TD
    Implementation[Implementation Planning] --> Rules{Check Rules}
    
    Rules --> Rule1[Max 3-5 new links per page]
    Rules --> Rule2[Natural sentence structure]
    Rules --> Rule3[No conversion content interruption]
    Rules --> Rule4[Link density < 5%]
    Rules --> Rule5[Mobile tappable (48px min)]
    
    Rule1 --> Validate{All Rules Pass?}
    Rule2 --> Validate
    Rule3 --> Validate
    Rule4 --> Validate
    Rule5 --> Validate
    
    Validate -->|Yes| PlacementZones[Choose Placement Zone]
    Validate -->|No| Reject[Reject or Adjust Plan]
    
    PlacementZones --> Zone1["High Value:<br/>- First 2 paragraphs<br/>- Contextual mentions<br/>- Problem → solution sections"]
    
    PlacementZones --> Zone2["Medium Value:<br/>- Related resources sidebar<br/>- End-of-content sections<br/>- Author bio"]
    
    PlacementZones --> Zone3["Low Value (Avoid):<br/>- Footer navigation<br/>- Header menu<br/>- Sidebar nav"]
    
    Zone1 --> Priority[High Priority Implementation]
    Zone2 --> Priority
    
    style Validate fill:#fc9,stroke:#333,stroke-width:2px
    style Priority fill:#9f9,stroke:#333,stroke-width:2px
```

## Technology-Specific Implementation

```mermaid
graph TD
    DetectStack[Detect Technology Stack] --> StackType{Stack Type?}
    
    StackType -->|Static HTML| HTML["Edit HTML files directly<br/>Add &lt;a href='/page'&gt;anchor&lt;/a&gt;<br/>Maintain existing structure"]
    
    StackType -->|React/Next.js| React["Create InternalLink component<br/>Use Next/Link for prefetching<br/>Add analytics tracking<br/>Ensure proper rel attributes"]
    
    StackType -->|WordPress| WP["Options:<br/>1. ACF for related_pages field<br/>2. Yoast SEO Premium<br/>3. Link Whisper plugin<br/>4. Custom shortcode"]
    
    StackType -->|Content-Heavy| ContentHeavy["Build scalable system:<br/>1. Related posts taxonomy<br/>2. Auto-link by shared tags<br/>3. NLP for topic similarity<br/>4. Link recommendation engine"]
    
    HTML --> Implement[Implement Links]
    React --> Implement
    WP --> Implement
    ContentHeavy --> Implement
    
    Implement --> Test["Test:<br/>- Links work<br/>- Mobile tappable<br/>- No broken links<br/>- Analytics tracking"]
    
    style DetectStack fill:#fc9,stroke:#333,stroke-width:2px
    style Implement fill:#9f9,stroke:#333,stroke-width:2px
```

## Anchor Text Distribution Strategy

```mermaid
pie title Recommended Anchor Text Distribution
    "Partial Match" : 35
    "Descriptive" : 25
    "Branded" : 18
    "Exact Match" : 12
    "Generic" : 10
```

```mermaid
graph LR
    Target["/metal-roofing-installation"] --> Variations[Anchor Text Variations]
    
    Variations --> Exact["Exact Match (12%):<br/>'metal roofing installation'"]
    Variations --> Partial["Partial Match (35%):<br/>'professional metal roofing installation'<br/>'metal roofing installation services'"]
    Variations --> Branded["Branded (18%):<br/>'Oregon Exterior metal roofing'"]
    Variations --> Generic["Generic (10%):<br/>'learn more'<br/>'click here'"]
    Variations --> Descriptive["Descriptive (25%):<br/>'guide to installing metal roofs'<br/>'our metal roof installation process'"]
    
    Exact --> Natural[Use Naturally in Context]
    Partial --> Natural
    Branded --> Natural
    Generic --> Natural
    Descriptive --> Natural
    
    style Variations fill:#fc9,stroke:#333,stroke-width:2px
    style Natural fill:#9f9,stroke:#333,stroke-width:2px
```

## Implementation Roadmap Template

```mermaid
gantt
    title Link Architecture Implementation Timeline
    dateFormat YYYY-MM-DD
    section Phase 1: Quick Wins
    Fix orphaned pages          :a1, 2024-01-01, 3d
    Add critical money page links :a2, 2024-01-02, 2d
    Link high-traffic blog posts  :a3, 2024-01-04, 1d
    
    section Phase 2: Topical Clusters
    Interlink roofing cluster     :b1, 2024-01-08, 5d
    Interlink service pages       :b2, 2024-01-10, 4d
    Connect related content       :b3, 2024-01-13, 3d
    
    section Phase 3: Anchor Optimization
    Replace generic anchors       :c1, 2024-01-22, 4d
    Diversify anchor text         :c2, 2024-01-24, 3d
    Final validation              :c3, 2024-01-27, 2d
```

## Future E.V.O. Auto-Generation

```mermaid
graph TD
    Monitoring[Site Crawl Monitoring] --> BuildLinkGraph[Build Link Graph]
    BuildLinkGraph --> AnalyzeMetrics[Analyze Link Metrics]
    
    AnalyzeMetrics --> Check1{Orphaned Pages > 30?}
    AnalyzeMetrics --> Check2{Avg Links < 5?}
    AnalyzeMetrics --> Check3{Money Pages Underlinked > 10?}
    
    Check1 -->|Yes| Score100[Score +100]
    Check2 -->|Yes| Score60[Score +60]
    Check3 -->|Yes| Score90[Score +90]
    
    Score100 --> TotalScore[Calculate Total]
    Score60 --> TotalScore
    Score90 --> TotalScore
    
    TotalScore --> Threshold{Score >= 65?}
    
    Threshold -->|Yes| GenerateCard[Generate Link Architecture Card]
    
    GenerateCard --> CustomInsight["Dynamic Insight:<br/>'Your site has 47 orphaned pages...'<br/>Include specific counts"]
    
    CustomInsight --> PreAnalyze["Pre-Analysis:<br/>- Build link graph<br/>- Identify top 20 opportunities<br/>- Calculate opportunity scores"]
    
    PreAnalyze --> EnrichPrompt["Enrich Step 2 Prompt:<br/>Include specific page pairs:<br/>'Add link from /high-auth-page<br/>to /money-page<br/>Anchor: professional roofing'"]
    
    EnrichPrompt --> NotifyUser[Notify User]
    
    style GenerateCard fill:#f96,stroke:#333,stroke-width:3px
    style PreAnalyze fill:#fc9,stroke:#333,stroke-width:2px
```

## Success Metrics Tracking

```mermaid
graph LR
    Before[Pre-Implementation Baseline] --> Metrics1["Metrics:<br/>- Orphaned: 47<br/>- Avg links/page: 3.2<br/>- Max depth: 6 clicks<br/>- Link concentration: 75%"]
    
    After[Post-Implementation State] --> Metrics2["Metrics:<br/>- Orphaned: 0<br/>- Avg links/page: 9.8<br/>- Max depth: 4 clicks<br/>- Link concentration: 45%"]
    
    Metrics1 --> Impact[Calculate Impact]
    Metrics2 --> Impact
    
    Impact --> Results["Results:<br/>✓ 47 pages now discoverable<br/>✓ 3x increase in internal links<br/>✓ Better link equity distribution<br/>✓ Improved crawlability"]
    
    Results --> LongTerm["Long-term Impact:<br/>- Increased organic traffic<br/>- Higher page authority<br/>- Better user engagement<br/>- Improved rankings"]
    
    style Results fill:#9f9,stroke:#333,stroke-width:2px
    style LongTerm fill:#6f6,stroke:#333,stroke-width:2px
```
