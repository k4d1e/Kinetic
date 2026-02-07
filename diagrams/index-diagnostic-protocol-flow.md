# Index Diagnostic Protocol - Flow Diagram

## Protocol Overview
**Type**: Analysis-Based (E.V.O. Integrated)
**Sprint Circle**: 1 (Foundation)
**E.V.O. Dimensions**: substrate, crawl, sitemap, redirect

## Complete Flow with E.V.O. Integration

```mermaid
graph TD
    Start[User Clicks Sprint Circle 1] --> LoadCard[Load Index Diagnostic Card]
    
    LoadCard --> Page1[Page 1: Strategist Insight]
    Page1 --> P1Content["'Google's crawlers visit daily...'<br/>Focus on crawl budget"]
    P1Content --> Continue[User Clicks Continue]
    
    Continue --> Page2[Page 2: Step 1 - Indexation Audit]
    
    Page2 --> AutoFetch[Auto-Fetch E.V.O. Dimension]
    AutoFetch --> FetchSubstrate["API: GET /evo/dimension/substrate<br/>propertyId, forceRefresh"]
    
    FetchSubstrate --> ShowLoading[Analysis Button: Loading]
    ShowLoading --> Poll{Poll Every 2s}
    Poll -->|In Progress| UpdateProgress["Show: 'Analyzing substrate...'"]
    UpdateProgress --> Poll
    
    Poll -->|Complete| CacheData[Cache E.V.O. Data]
    CacheData --> AnalysisReady[Analysis Button: Ready]
    
    AnalysisReady --> UserClicksAnalysis[User Clicks Analysis]
    UserClicksAnalysis --> ShowModal[Open Analysis Modal]
    
    ShowModal --> DisplayHealth["Health Score: 65/100<br/>Status: Needs Attention"]
    DisplayHealth --> DisplayMetrics["Metrics:<br/>- Root Density: 450<br/>- Exclusion Rate: 15%<br/>- Error Pages: 23"]
    DisplayMetrics --> DisplayDiagnosed["Diagnosed Causes:<br/>1. 404 errors (23 pages)<br/>   Fix: Update broken links<br/>   URLs: [url1, url2...]<br/>2. Exclusion issues (67 pages)"]
    
    DisplayDiagnosed --> CheckHealth{Health >= 70?}
    
    CheckHealth -->|No| ShowExecAssist[Show Execution Assist]
    CheckHealth -->|Yes| HideExecAssist[Hide Execution Assist]
    CheckHealth -->|Yes| AutoEnable[Auto-Enable Next Step]
    
    ShowExecAssist --> NextDisabled[Next Step: DISABLED]
    NextDisabled --> UserClicksExec[User Clicks Execution Assist]
    
    UserClicksExec --> GenDataDriven[Generate Data-Driven Prompt]
    GenDataDriven --> PromptWithURLs["CURRENT SITE HEALTH:<br/>Score: 65/100<br/>KEY METRICS: [actual data]<br/>DIAGNOSED ISSUES:<br/>1. 404 errors (23 pages)<br/>   Affected URLs: [real URLs]<br/>   Fix: Update broken links<br/>DELIVERABLE: indexation-audit-report.md"]
    
    PromptWithURLs --> UserCopies[User Copies Prompt]
    UserCopies --> EnableNext[Next Step: ENABLED]
    
    EnableNext --> NextClick[User Clicks Next Step]
    AutoEnable --> NextClick
    
    NextClick --> Page3[Page 3: Step 2 - Crawl Stats]
    
    Page3 --> FetchCrawl["Auto-Fetch: crawl dimension"]
    FetchCrawl --> Step2Flow["Similar flow:<br/>- Show Analysis<br/>- Check health<br/>- Show/Hide Exec Assist"]
    
    Step2Flow --> Page4[Page 4: Step 3 - Sitemap]
    Page4 --> FetchSitemap["Auto-Fetch: sitemap dimension"]
    FetchSitemap --> Step3Flow["Similar flow"]
    
    Step3Flow --> Page5[Page 5: Step 4 - Redirects]
    Page5 --> FetchRedirect["Auto-Fetch: redirect dimension"]
    FetchRedirect --> Step4Flow["Similar flow"]
    
    Step4Flow --> CompleteClick[User Clicks Complete]
    CompleteClick --> Page6[Page 6: Completion]
    
    Page6 --> Status1["Analyzing GSC Coverage Data..."]
    Status1 -->|2s| Status2["Crawl Budget Optimized"]
    Status2 -->|2s| Status3["High-value pages prioritized"]
    
    Status3 --> SaveDB["Save to sprint_card_completions"]
    SaveDB --> UnlockCircle2[Unlock Circle 2]
    UnlockCircle2 --> CloseCard[Close Card]
    
    style Page2 fill:#bbf,stroke:#333,stroke-width:2px
    style AutoFetch fill:#f96,stroke:#333,stroke-width:3px
    style ShowModal fill:#fc9,stroke:#333,stroke-width:2px
    style GenDataDriven fill:#9f9,stroke:#333,stroke-width:2px
```

## E.V.O. Dimension Analysis Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Sprint Card UI
    participant API as Kinetic API
    participant EVO as E.V.O. Engine
    participant GSC as Google Search Console
    
    User->>UI: Navigate to Step 1 (Page 2)
    UI->>UI: Check: isAnalysisProtocol?
    UI->>API: GET /evo/dimension/substrate?propertyId=X
    
    activate API
    API->>EVO: Request substrate analysis
    
    activate EVO
    EVO->>GSC: Fetch Coverage Report
    GSC-->>EVO: Coverage data
    EVO->>EVO: Calculate metrics
    EVO->>EVO: Identify diagnosed causes
    EVO-->>API: Return dimension data
    deactivate EVO
    
    API-->>UI: {health: {score, status, metrics}, insights}
    deactivate API
    
    UI->>UI: Cache data in evoDataCache[1]
    UI->>UI: Set Analysis button to Ready
    
    User->>UI: Click Analysis button
    UI->>UI: Open Analysis Modal
    UI->>UI: Display health score & metrics
    
    alt Health < 70
        UI->>UI: Show Execution Assist button
        UI->>UI: Disable Next Step button
        User->>UI: Click Execution Assist
        UI->>UI: Generate data-driven prompt
        UI->>UI: Include diagnosed causes + URLs
        User->>UI: Copy prompt
        UI->>UI: Enable Next Step button
    else Health >= 70
        UI->>UI: Hide Execution Assist button
        UI->>UI: Auto-enable Next Step button
    end
    
    User->>UI: Click Next Step
    UI->>UI: Navigate to Step 2 (Page 3)
    Note over UI,API: Repeat for crawl dimension...
```

## E.V.O. Dimension Mapping

```mermaid
graph TD
    subgraph "Step 1: substrate dimension"
        S1[Indexation Audit]
        S1 --> S1M["Metrics:<br/>- rootDensity<br/>- exclusionRate<br/>- mycelialExpansion<br/>- soilQuality"]
        S1M --> S1T[Threshold: 70]
    end
    
    subgraph "Step 2: crawl dimension"
        S2[Crawl Stats Analysis]
        S2 --> S2M["Metrics:<br/>- crawlRequests<br/>- responseTime<br/>- serverErrors"]
        S2M --> S2T[Threshold: 70]
    end
    
    subgraph "Step 3: sitemap dimension"
        S3[Sitemap Optimization]
        S3 --> S3M["Metrics:<br/>- sitemapIndexation<br/>- submittedVsIndexed"]
        S3M --> S3T[Threshold: 70]
    end
    
    subgraph "Step 4: redirect dimension"
        S4[Redirect Resolution]
        S4 --> S4M["Metrics:<br/>- errorPages<br/>- redirectChains"]
        S4M --> S4T[Threshold: 70]
    end
    
    S1T --> Decision1{Score >= 70?}
    S2T --> Decision2{Score >= 70?}
    S3T --> Decision3{Score >= 70?}
    S4T --> Decision4{Score >= 70?}
    
    Decision1 -->|Yes| Skip1[Skip Execution Assist]
    Decision1 -->|No| Fix1[Show Execution Assist]
    
    Decision2 -->|Yes| Skip2[Skip Execution Assist]
    Decision2 -->|No| Fix2[Show Execution Assist]
    
    Decision3 -->|Yes| Skip3[Skip Execution Assist]
    Decision3 -->|No| Fix3[Show Execution Assist]
    
    Decision4 -->|Yes| Skip4[Skip Execution Assist]
    Decision4 -->|No| Fix4[Show Execution Assist]
    
    Skip1 --> AutoNext1[Auto-enable Next]
    Fix1 --> ManualNext1[User must copy prompt]
    
    style S1 fill:#9cf,stroke:#333,stroke-width:2px
    style S2 fill:#9cf,stroke:#333,stroke-width:2px
    style S3 fill:#9cf,stroke:#333,stroke-width:2px
    style S4 fill:#9cf,stroke:#333,stroke-width:2px
    style Fix1 fill:#f96,stroke:#333,stroke-width:2px
```

## Diagnosed Cause Structure

```mermaid
graph TD
    AnalysisComplete[E.V.O. Analysis Complete] --> DiagnosedCauses{Has Diagnosed Causes?}
    
    DiagnosedCauses -->|Yes| BuildCauses[Build Diagnosed Causes Array]
    
    BuildCauses --> Cause1["Cause 1:<br/>reason: '404 errors blocking indexation'<br/>count: 23<br/>severity: 'high'<br/>fix: 'Update broken links'<br/>urls: [url1, url2...]<br/>strategies: [...]"]
    
    BuildCauses --> Cause2["Cause 2:<br/>reason: 'Excluded pages'<br/>count: 67<br/>severity: 'medium'<br/>fix: 'Review exclusion reasons'"]
    
    Cause1 --> ModalDisplay[Display in Analysis Modal]
    Cause2 --> ModalDisplay
    
    ModalDisplay --> UserReview[User Reviews Issues]
    UserReview --> UserAction{User Action}
    
    UserAction -->|View Analysis| ViewOnly[Read health data]
    UserAction -->|Click Exec Assist| GeneratePrompt[Generate Data-Driven Prompt]
    
    GeneratePrompt --> IncludeData["Include in Prompt:<br/>- Health score<br/>- All metrics<br/>- Each diagnosed cause<br/>- Specific URLs<br/>- Fix strategies"]
    
    IncludeData --> CopyPrompt[User Copies Prompt]
    CopyPrompt --> EnableNext[Enable Next Step]
    
    style BuildCauses fill:#fc9,stroke:#333,stroke-width:2px
    style IncludeData fill:#9f9,stroke:#333,stroke-width:2px
```

## Button State Logic

```mermaid
stateDiagram-v2
    [*] --> PageLoad: User enters step page
    
    PageLoad --> AnalysisLoading: Show Analysis button (loading)
    AnalysisLoading --> FetchingData: Auto-fetch E.V.O. dimension
    
    FetchingData --> AnalysisReady: Data loaded
    AnalysisReady --> UserClicksAnalysis: User clicks Analysis
    
    UserClicksAnalysis --> ModalOpen: Display health data
    
    state ModalOpen {
        [*] --> CheckScore
        CheckScore --> HighScore: Score >= 70
        CheckScore --> LowScore: Score < 70
        
        HighScore --> HideExecButton: Hide Execution Assist
        HighScore --> AutoEnableNext: Auto-enable Next Step
        
        LowScore --> ShowExecButton: Show Execution Assist
        LowScore --> DisableNext: Disable Next Step
        
        ShowExecButton --> UserCopies: User copies prompt
        UserCopies --> EnableNext: Enable Next Step
    }
    
    ModalOpen --> CloseModal: User closes modal
    
    AutoEnableNext --> NextPage: User clicks Next
    EnableNext --> NextPage: User clicks Next
    
    NextPage --> [*]: Advance to next step
```

## Data-Driven Prompt Enhancement

```mermaid
graph LR
    subgraph "Standard Prompt (No E.V.O. Data)"
        SP[Generic Analysis Template]
        SP --> SP1[Abstract instructions]
        SP1 --> SP2[No specific URLs]
        SP2 --> SP3[General guidance]
    end
    
    subgraph "Enhanced Prompt (With E.V.O. Data)"
        EP[Data-Driven Template]
        EP --> EP1["Actual health metrics:<br/>Score: 65/100"]
        EP1 --> EP2["Specific diagnosed issues:<br/>404 errors (23 pages)"]
        EP2 --> EP3["Real URLs with problems:<br/>- site.com/page1<br/>- site.com/page2"]
        EP3 --> EP4["Prioritized fix strategies:<br/>1. Update broken links<br/>2. Set up 301 redirects"]
    end
    
    SP3 --> Result1[User must discover issues]
    EP4 --> Result2[User has actionable list]
    
    style EP fill:#9f9,stroke:#333,stroke-width:3px
    style Result2 fill:#6f6,stroke:#333,stroke-width:2px
```

## Future E.V.O. Auto-Generation Trigger

```mermaid
graph TD
    DailyMonitor[Daily GSC Sync] --> FetchCoverage[Fetch Coverage Report]
    FetchCoverage --> CalcMetrics[Calculate Metrics]
    
    CalcMetrics --> ExclusionRate{Exclusion Rate > 20%?}
    CalcMetrics --> ErrorPages{Error Pages > 50?}
    CalcMetrics --> CrawlErrors{Crawl Errors > 30?}
    
    ExclusionRate -->|Yes| Score100[Score +100]
    ErrorPages -->|Yes| Score95[Score +95]
    CrawlErrors -->|Yes| Score80[Score +80]
    
    Score100 --> TotalScore[Calculate Total Score]
    Score95 --> TotalScore
    Score80 --> TotalScore
    
    TotalScore --> CheckThreshold{Score >= 70?}
    
    CheckThreshold -->|Yes| GenerateCard[Generate Index Diagnostic Card]
    CheckThreshold -->|No| MonitorOnly[Monitor Only]
    
    GenerateCard --> CustomInsight["Dynamic Insight:<br/>'Your indexation is bleeding...'<br/>Include actual exclusion rate"]
    
    CustomInsight --> PreFetchDimensions["Pre-fetch all 4 dimensions:<br/>- substrate<br/>- crawl<br/>- sitemap<br/>- redirect"]
    
    PreFetchDimensions --> CacheResults[Cache E.V.O. results]
    CacheResults --> CreateCardDB[Create card in DB]
    CreateCardDB --> NotifyUser[Notify User]
    
    NotifyUser --> UserOpens[User Opens Card]
    UserOpens --> ShowReadyAnalysis[Analysis buttons show 'Ready']
    
    style GenerateCard fill:#f66,stroke:#333,stroke-width:3px
    style PreFetchDimensions fill:#f96,stroke:#333,stroke-width:2px
```

## Complete E.V.O. Cache Structure

```javascript
// E.V.O. Data Cache
evoDataCache = {
  1: {  // Step 1 (substrate)
    dimensionData: {
      health: {
        score: 65,
        status: "warning",
        metrics: {
          rootDensity: 450,
          exclusionRate: 15,
          mycelialExpansion: 2.3,
          soilQuality: 82
        },
        insights: [
          {
            category: "exclusions",
            message: "15% exclusion rate",
            diagnosedCauses: [
              {
                reason: "404 errors",
                count: 23,
                severity: "high",
                fix: "Update broken links",
                urls: ["url1", "url2"],
                strategies: [...]
              }
            ]
          }
        ]
      }
    },
    needsFixes: true,
    healthScore: 65,
    healthThreshold: 70
  },
  2: { /* Step 2 (crawl) */ },
  3: { /* Step 3 (sitemap) */ },
  4: { /* Step 4 (redirect) */ }
}
```
