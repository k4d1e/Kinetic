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

    // Generate appropriate prompt based on protocol type
    if (isSchemaProtocol) {
      return this.generateSchemaPrompt(context, fileName);
    } else if (isAnalysisProtocol) {
      return this.generateAnalysisPrompt(context, fileName);
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
    const { mission, stepName, executionInstructions, stepNumber } = context;
    
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
   */
  openModal(pageElement) {
    const context = this.extractPageContext(pageElement);
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
