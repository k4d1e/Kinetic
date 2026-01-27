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
   * Step-specific abstraction mappings
   * Maps step bodies to industry-agnostic descriptions
   */
  stepAbstractions: {
    1: {
      concept: 'global brand identity elements',
      action: 'Add organization schema markup with logo, contact information, and social media profiles',
      schemaType: 'Organization schema (schema.org/Organization)',
      implementation: 'Inject structured data into all pages to establish brand identity in search engines'
    },
    2: {
      concept: 'geographic service area definitions',
      action: 'Define service areas using geographic schema markup',
      schemaType: 'GeoCircle or ServiceArea schema (schema.org/GeoCircle)',
      implementation: 'Specify exact locations where products/services are offered using latitude, longitude, and radius'
    },
    3: {
      concept: 'structured product/service catalog with pricing',
      action: 'Transform content pages into catalog entries with Service/Product schema',
      schemaType: 'Service or Product schema (schema.org/Service, schema.org/Product)',
      implementation: 'Add structured data defining offerings with descriptions, pricing, and categories'
    },
    4: {
      concept: 'review aggregation and testimonial markup',
      action: 'Aggregate customer reviews into structured CollectionPage format',
      schemaType: 'Review and AggregateRating schema (schema.org/Review)',
      implementation: 'Format testimonials as structured review data that search engines can index and display'
    }
  },

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
    
    return {
      mission: missionTitle,
      stepNumber,
      stepName,
      stepHeader,
      stepBody,
      abstraction: this.stepAbstractions[stepNumber] || null
    };
  },

  /**
   * Generate an industry-agnostic Cursor prompt
   * @param {Object} context - Page context from extractPageContext
   * @returns {string} Generated prompt
   */
  generatePrompt(context) {
    const { mission, stepNumber, stepName, abstraction } = context;
    
    if (!abstraction) {
      return `Error: Unable to generate prompt for step ${stepNumber}`;
    }

    const fileName = this.sanitizeFileName(stepName);

    return `You are implementing ${stepName} as part of ${mission}.

OBJECTIVE: ${abstraction.action}

IMPLEMENTATION FOCUS:
${abstraction.implementation}

SCHEMA TYPE: ${abstraction.schemaType}

INSTRUCTIONS:
1. Analyze the current website structure in this workspace
   - Detect the technology stack (HTML, React, Vue, Next.js, static site, etc.)
   - Identify all pages/components where ${abstraction.concept} should be implemented
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
Create a detailed implementation plan saved as: ${fileName}-plan.md

The plan should be actionable, technology-agnostic, and ready for immediate implementation regardless of the website's industry (e-commerce, local service, SaaS, restaurant, etc.).`;
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
      if (context && context.stepNumber) {
        const instructionLabel = document.querySelector(`.instruction-label[data-step="${context.stepNumber}"]`);
        if (instructionLabel) {
          instructionLabel.classList.add('copied');
          console.log(`✓ Step ${context.stepNumber} marked as copied`);
        }
        
        // Enable the Next Step button for this step
        const nextStepButton = document.querySelector(`.btn-next-step[data-step="${context.stepNumber}"]`);
        if (nextStepButton) {
          nextStepButton.disabled = false;
          console.log(`✓ Next Step button enabled for step ${context.stepNumber}`);
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
