# Meta Surgeon Protocol - Flow Diagram

## Protocol Overview
**Type**: Schema Implementation (Manual)
**Sprint Circle**: 0 (Foundation)
**E.V.O. Integration**: None (Manual protocol)

## Complete Flow

```mermaid
graph TD
    Start[User Clicks Sprint Circle 0] --> LoadCard[Load Meta Surgeon Card]
    
    LoadCard --> Page1[Page 1: Strategist Insight]
    Page1 --> P1Content["'Before we fight for keywords...'<br/>{{COMPANY_NAME}} placeholder"]
    P1Content --> Continue[User Clicks Continue]
    
    Continue --> Page2[Page 2: Step 1 - Global Identity]
    
    Page2 --> P2Structure{Protocol Type Check}
    P2Structure -->|Schema Protocol| HideAnalysis[Hide Analysis Button]
    HideAnalysis --> ShowExec2[Show Execution Assist]
    ShowExec2 --> DisableNext2[Next Step: DISABLED]
    
    DisableNext2 --> UserExec2[User Clicks Execution Assist]
    UserExec2 --> DetectType2[Detect: schemaType exists]
    DetectType2 --> GenSchema2[Generate Schema Prompt]
    
    GenSchema2 --> PromptContent2["OBJECTIVE: Add Organization schema<br/>SCHEMA TYPE: Organization<br/>INSTRUCTIONS: Detect tech stack<br/>DELIVERABLE: global-identity-plan.md"]
    
    PromptContent2 --> Modal2[Display Modal]
    Modal2 --> UserCopy2[User Copies Prompt]
    UserCopy2 --> EnableNext2[Next Step: ENABLED]
    EnableNext2 --> MarkComplete2[Mark Instruction ✓]
    
    MarkComplete2 --> NextClick2[User Clicks Next Step]
    NextClick2 --> Page3[Page 3: Step 2 - Territory Claim]
    
    Page3 --> P3Exec[Show Execution Assist]
    P3Exec --> UserExec3[User Clicks Execution Assist]
    UserExec3 --> GenSchema3["Generate GeoCircle Schema Prompt<br/>DELIVERABLE: territory-claim-plan.md"]
    GenSchema3 --> UserCopy3[User Copies Prompt]
    UserCopy3 --> NextClick3[User Clicks Next Step]
    
    NextClick3 --> Page4[Page 4: Step 3 - Commercial Definition]
    Page4 --> P4Exec[Show Execution Assist]
    P4Exec --> UserExec4[User Clicks Execution Assist]
    UserExec4 --> GenSchema4["Generate Service/Product Schema<br/>DELIVERABLE: commercial-definition-plan.md"]
    GenSchema4 --> UserCopy4[User Copies Prompt]
    UserCopy4 --> NextClick4[User Clicks Next Step]
    
    NextClick4 --> Page5[Page 5: Step 4 - Reputation Sync]
    Page5 --> P5Exec[Show Execution Assist]
    P5Exec --> UserExec5[User Clicks Execution Assist]
    UserExec5 --> GenSchema5["Generate Review Schema<br/>DELIVERABLE: reputation-sync-plan.md"]
    GenSchema5 --> UserCopy5[User Copies Prompt]
    UserCopy5 --> EnableComplete[Complete Button: ENABLED]
    
    EnableComplete --> CompleteClick[User Clicks Complete]
    CompleteClick --> Page6[Page 6: Completion Animation]
    
    Page6 --> Status1["Line 1: Scanning Source Code..."]
    Status1 -->|2s delay| Status2["Line 2: Entity Signal Established"]
    Status2 -->|2s delay| Status3["Line 3: 4 Schema Packs Active"]
    Status3 --> TriggerEvent[Trigger: sprintCardAnimationComplete]
    
    TriggerEvent --> SaveDB["Save Completion to DB<br/>sprint_card_completions"]
    SaveDB --> UnlockCircle[Unlock Circle 1]
    UnlockCircle --> RefreshArchive[Refresh Completed Cards]
    RefreshArchive --> CloseCard[Close Card]
    
    style Page1 fill:#f9f,stroke:#333,stroke-width:2px
    style Page2 fill:#bbf,stroke:#333,stroke-width:2px
    style Page3 fill:#bbf,stroke:#333,stroke-width:2px
    style Page4 fill:#bbf,stroke:#333,stroke-width:2px
    style Page5 fill:#bbf,stroke:#333,stroke-width:2px
    style Page6 fill:#bfb,stroke:#333,stroke-width:2px
    style SaveDB fill:#ffa,stroke:#333,stroke-width:2px
```

## Step-by-Step Execution Instructions

```mermaid
graph LR
    subgraph "Step 1: Global Identity"
        S1[Organization Schema]
        S1 --> S1A[Logo, Phone, Social]
        S1A --> S1B[JSON-LD on all pages]
    end
    
    subgraph "Step 2: Territory Claim"
        S2[GeoCircle Schema]
        S2 --> S2A[Lat/Long + Radius]
        S2A --> S2B[Define service areas]
    end
    
    subgraph "Step 3: Commercial Definition"
        S3[Service/Product Schema]
        S3 --> S3A[Name, Description, Price]
        S3A --> S3B[Transform pages to catalog]
    end
    
    subgraph "Step 4: Reputation Sync"
        S4[Review Schema]
        S4 --> S4A[Individual + Aggregate]
        S4A --> S4B[Format testimonials]
    end
    
    S1B --> S2
    S2B --> S3
    S3B --> S4
    S4B --> Complete[Entity Signal Established]
    
    style Complete fill:#0f0,stroke:#333,stroke-width:3px
```

## Prompt Generation Logic

```mermaid
graph TD
    UserClick[User Clicks Execution Assist] --> ExtractContext[Extract Page Context]
    
    ExtractContext --> Context["context = {<br/>mission: 'Meta Surgeon Protocol'<br/>stepNumber: 1-4<br/>stepName: e.g. 'Global Identity'<br/>executionInstructions: {...}<br/>}"]
    
    Context --> CheckType{Check Protocol Type}
    CheckType -->|schemaType exists| IsSchema[isSchemaProtocol = true]
    
    IsSchema --> GenSchemaPrompt[generateSchemaPrompt]
    
    GenSchemaPrompt --> Template["Template Variables:<br/>- stepName<br/>- action<br/>- schemaType<br/>- implementation<br/>- concept<br/>- deliverable"]
    
    Template --> Output["OUTPUT:<br/>You are implementing {stepName}...<br/>OBJECTIVE: {action}<br/>SCHEMA TYPE: {schemaType}<br/>INSTRUCTIONS:<br/>1. Analyze current site<br/>2. Create implementation plan<br/>3. Adapt to technology<br/>DELIVERABLE: {deliverable}"]
    
    Output --> DisplayModal[Display in Modal]
    DisplayModal --> UserCopies[User Copies Prompt]
    UserCopies --> EnableButton[Enable Next Step Button]
    
    style GenSchemaPrompt fill:#ffa,stroke:#333,stroke-width:2px
    style Output fill:#afa,stroke:#333,stroke-width:2px
```

## Database Tracking

```mermaid
erDiagram
    SPRINT_ACTION_CARDS ||--o{ SPRINT_CARD_COMPLETIONS : tracks
    
    SPRINT_ACTION_CARDS {
        int id PK
        string card_type UK "meta_surgeon_protocol"
        string display_name "Meta Surgeon Protocol"
        int total_steps "4"
        text description
    }
    
    SPRINT_CARD_COMPLETIONS {
        int id PK
        int property_id FK
        string card_type "meta_surgeon_protocol"
        int sprint_index "0"
        timestamp started_at
        timestamp completed_at
        int duration_ms
        int progress_percentage "95"
        jsonb steps "Array of completed steps"
    }
    
    SPRINT_CARD_COMPLETIONS ||--|| STEP_TRACKING : contains
    
    STEP_TRACKING {
        int stepNumber "1-4"
        string name "Global Identity"
        string description
        timestamp completedAt
    }
```

## Key Characteristics

### No E.V.O. Analysis
- **Manual Implementation Protocol**
- No auto-fetch of dimension data
- No Analysis button displayed
- No health score evaluation
- Pure execution assist workflow

### Button State Machine

```mermaid
stateDiagram-v2
    [*] --> PageLoad
    PageLoad --> ExecVisible: Show Execution Assist
    PageLoad --> NextDisabled: Disable Next Step
    
    ExecVisible --> ModalOpen: User clicks Execution Assist
    ModalOpen --> PromptGenerated: Generate schema prompt
    PromptGenerated --> PromptCopied: User copies
    
    PromptCopied --> NextEnabled: Enable Next Step
    PromptCopied --> InstructionChecked: Mark ✓
    
    NextEnabled --> NextPage: User clicks Next
    NextPage --> [*]: Advance to next step
    
    state "Page 5 (Step 4)" as Page5State {
        NextEnabled --> CompleteEnabled: Show Complete button
        CompleteEnabled --> Page6: User clicks Complete
    }
```

### Technology Agnostic Implementation

```mermaid
graph TB
    Prompt[Generic Schema Prompt] --> Detect{Detect Tech Stack}
    
    Detect -->|Static HTML| HTML["Add JSON-LD to &lt;head&gt;<br/>or before &lt;/body&gt;"]
    Detect -->|React/Next| React["Create SchemaComponent<br/>Use react-helmet"]
    Detect -->|WordPress| WP["Use Yoast SEO<br/>or Schema plugin"]
    Detect -->|Vue| Vue["Use vue-meta<br/>or Nuxt head config"]
    
    HTML --> Implement[User Implements]
    React --> Implement
    WP --> Implement
    Vue --> Implement
    
    Implement --> Validate["Validate with:<br/>Google Rich Results Test"]
    
    style Prompt fill:#ff9,stroke:#333,stroke-width:2px
    style Validate fill:#9f9,stroke:#333,stroke-width:2px
```

## Future E.V.O. Auto-Generation

When E.V.O. generates this card automatically:

```mermaid
graph TD
    GSC[GSC Data Monitoring] --> CrawlSite[Crawl Site for Schema]
    CrawlSite --> DetectMissing{Schema Missing?}
    
    DetectMissing -->|No Org Schema| Score100[Score: 100]
    DetectMissing -->|No LocalBusiness| Score80[Score: 80]
    DetectMissing -->|<20% Pages with Schema| Score75[Score: 75]
    
    Score100 --> TriggerCheck{Score >= 70?}
    Score80 --> TriggerCheck
    Score75 --> TriggerCheck
    
    TriggerCheck -->|Yes| GenerateCard[Generate Card]
    GenerateCard --> CustomInsight["Generate Dynamic Insight:<br/>'Google is guessing who you are...'"]
    
    CustomInsight --> PreAnalyze[Pre-analyze Missing Schemas]
    PreAnalyze --> CreateCard[Create sprint_action_cards entry]
    CreateCard --> NotifyUser[Send Notification]
    
    NotifyUser --> UserOpens[User Opens Card]
    UserOpens --> ShowCard[Display Meta Surgeon Card]
    
    style GenerateCard fill:#f96,stroke:#333,stroke-width:3px
    style CustomInsight fill:#fc6,stroke:#333,stroke-width:2px
```
