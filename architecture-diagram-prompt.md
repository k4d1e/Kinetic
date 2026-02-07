# Meta-Prompt: Generate Sprint Plan Action Card System Architecture Diagram

## Context

I have a comprehensive Sprint Plan Action Card system in my Kinetic SEO application. The system uses E.V.O. (an AI analysis engine) to automatically generate procedural Action Cards that guide users through SEO optimization protocols based on Google Search Console data.

## Documentation Files

I have 7 detailed `.mdc` rule files in `.cursor/rules/` that document the entire system:

1. **sprint-card-template.mdc** - Universal 6-page card structure, button state management, E.V.O. integration, progression flow
2. **execution-assist-prompts.mdc** - 8 prompt generation templates (schema, analysis, content, link expansion)
3. **evo-diagnostic-mapping.mdc** - Trigger conditions, scoring system, conflict resolution, monitoring schedule
4. **meta-surgeon-protocol.mdc** - Schema implementation protocol (4 steps)
5. **index-diagnostic-protocol.mdc** - GSC indexation analysis protocol (4 steps)
6. **link-architecture-protocol.mdc** - Internal linking optimization protocol (4 steps)
7. **content-opportunity-protocol.mdc** - Content gap analysis protocol (4 steps)

## Your Task

Please read all 7 `.mdc` files and create a comprehensive system architecture diagram that shows:

### 1. High-Level System Flow
- User connects Google Search Console
- E.V.O. continuously monitors GSC data
- Triggers detect optimization opportunities
- Action Cards are procedurally generated
- Users complete cards step-by-step
- Progress is tracked and next cards unlock

### 2. Key Components to Include

**Data Sources:**
- Google Search Console API
- Site crawl data
- Schema analysis
- Link graph analysis

**E.V.O. Analysis Engine:**
- Dimension analyzers (substrate, crawl, sitemap, redirect, inventory, keyword_opportunities, content_coverage_gaps)
- Health scoring system
- Diagnosed causes generation
- Metrics calculation

**Trigger System:**
- 4 protocol trigger detectors
- Scoring algorithms (weighted triggers)
- Priority-based conflict resolution
- Pre-generation analysis

**Action Card System:**
- 6-page universal template
- Protocol definitions (4 existing, 2 future)
- Button state management
- Progress tracking

**Execution Assist:**
- Context extraction
- 8 prompt generation methods
- E.V.O. data integration
- Copy detection mechanism

**Database:**
- sprint_action_cards table
- sprint_card_completions table
- E.V.O. analysis cache
- Progress tracking

**Frontend:**
- Sprint circles (4 protocols)
- Card pages (1-6)
- Analysis modals
- Execution Assist modals

### 3. Diagram Requirements

**Format:** Create a Mermaid diagram (or multiple diagrams if needed)

**Show:**
- Data flow (arrows showing information movement)
- Component relationships (which components call which)
- Decision points (trigger evaluation, conflict resolution)
- User interactions (where users click/interact)
- State changes (card progression, button enabling)

**Organize by Layers:**
- Layer 1: Data Sources & Collection
- Layer 2: E.V.O. Analysis & Triggers
- Layer 3: Card Generation & Management
- Layer 4: User Interface & Interaction
- Layer 5: Database & State Persistence

### 4. Specific Flows to Highlight

1. **Automatic Card Generation Flow:**
   ```
   GSC Data → E.V.O. Analysis → Trigger Detection → Score Calculation → 
   Conflict Resolution → Pre-Analysis → Card Creation → User Notification
   ```

2. **User Completion Flow:**
   ```
   User Opens Card → Page 1 Insight → Step Pages (2-5) → 
   [E.V.O. Analysis OR Execution Assist] → Copy Prompt → Enable Next Button → 
   Complete → Page 6 Animation → Database Save → Unlock Next Circle
   ```

3. **E.V.O. Integration Flow:**
   ```
   Card Page Load → Auto-fetch E.V.O. Dimension → Poll Progress → 
   Display Health Score → Show Diagnosed Causes → 
   Enable/Disable Execution Assist → Enable/Disable Next Button
   ```

4. **Prompt Generation Flow:**
   ```
   User Clicks Execution Assist → Extract Context → Detect Protocol Type → 
   Check E.V.O. Data → Generate Prompt (Schema/Analysis/Link/Content) → 
   Display in Modal → User Copies → Enable Progression
   ```

### 5. Key Relationships to Show

- How protocol definitions feed into card display
- How E.V.O. dimensions map to protocol steps
- How triggers determine which protocol to generate
- How execution instructions determine prompt type
- How button states change based on E.V.O. health scores
- How completion unlocks next sprint circles

### 6. Visual Style

- Use clear labels and grouping (boxes for related components)
- Color-code by system layer or component type
- Show synchronous vs asynchronous operations
- Indicate optional vs required flows
- Mark critical decision points

## Output Format

Provide:
1. **One comprehensive architecture diagram** (Mermaid code)
2. **Detailed explanation** of how components interact
3. **Sequence diagrams** for the 4 key flows listed above (optional but helpful)
4. **Component interaction matrix** showing which components call which

## Success Criteria

The diagram should enable someone unfamiliar with the system to:
- Understand the complete data flow from GSC to user interaction
- See how E.V.O. intelligently generates and enriches Action Cards
- Grasp the state management and progression logic
- Identify the role of each major component
- Understand when and why each protocol triggers

Please read the 7 `.mdc` files carefully and create this comprehensive architecture visualization.
