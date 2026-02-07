/**
 * Sprint Plan Card System
 * Handles interactive sprint circle buttons and multi-page action cards
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load sprint plan card HTML first
  await loadSprintPlanCard();
  
  // Initialize API client
  const api = new KineticAPI();
  
  // State Management
  const sprintState = {
    circles: [
      { index: 0, status: 'active', completed: false },
      { index: 1, status: 'locked', completed: false },
      { index: 2, status: 'locked', completed: false },
      { index: 3, status: 'locked', completed: false }
    ],
    currentCircle: null,
    currentPage: 1,
    progressPercentages: [0, 25, 45, 65, 95, 95], // Pages 1-6
    startTime: null,
    completedSteps: [],
    currentPropertyId: null
  };

  // Card Type Mapping (Sprint Circle Index -> Card Type)
  const cardTypeMapping = {
    0: 'meta_surgeon_protocol',
    1: 'gsc_indexation_protocol',
    2: 'internal_link_expansion_protocol',
    3: 'keyword_coverage_gap_protocol'
  };
  
  // Current active card state
  let currentCardType = null;
  
  // DOM Elements (these will be dynamically selected based on card type)
  const sprintCircles = document.querySelectorAll('.sprint-circle');
  let cardContainer = null;
  let cardPages = null;
  let continueBtn = null;
  let nextStepBtns = null;
  let completeBtn = null;
  let executionAssistBtns = null;

  /**
   * Load Sprint Plan Card HTML
   * Fetch and inject the sprint plan card from external HTML file
   */
  async function loadSprintPlanCard() {
    try {
      const response = await fetch('assets/html/sprintplancard.html');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const container = document.getElementById('sprint-plan-card-container');
      
      if (container) {
        container.innerHTML = html;
        console.log('✓ Sprint plan card HTML loaded successfully');
      } else {
        console.error('❌ Sprint plan card container not found');
      }
    } catch (error) {
      console.error('❌ Failed to load sprint plan card:', error);
      console.error('Failed to load sprint plan card. Please check that assets/html/sprintplancard.html exists.');
    }
  }

  /**
   * Initialize Sprint Circles
   * Add click listeners and set initial states
   */
  function initSprintCircles() {
    sprintCircles.forEach((circle, index) => {
      const status = circle.getAttribute('data-status');
      
      if (status === 'active') {
        circle.addEventListener('click', () => handleCircleClick(index));
      }
      
      // Update visual state based on data attribute
      updateCircleVisual(circle, status);
    });
    
    console.log('✓ Sprint circles initialized');
  }
  
  /**
   * Set Default Sprint State
   * Called when no property is selected or no saved progress exists
   */
  function setDefaultSprintState() {
    // Activate the first circle by default
    const firstCircle = sprintCircles[0];
    if (firstCircle) {
      firstCircle.setAttribute('data-status', 'active');
      updateCircleVisual(firstCircle, 'active');
      sprintState.circles[0].status = 'active';
      
      // Add click listener to first circle
      firstCircle.addEventListener('click', () => handleCircleClick(0));
      
      console.log('✓ Default sprint state applied: First circle activated');
    }
  }

  /**
   * Load Sprint Progress from Database
   * Fetch and apply saved sprint circle states for the current property
   */
  async function loadSprintProgress(propertyId) {
    if (!propertyId) {
      console.log('No property ID provided, using default sprint state');
      setDefaultSprintState();
      return;
    }
    
    try {
      console.log(`🔄 Loading sprint progress for property ${propertyId}...`);
      
      const backendURL = window.kineticAPI ? window.kineticAPI.baseURL : 'http://localhost:8000';
      const response = await fetch(`${backendURL}/api/sprint-cards/progress?propertyId=${propertyId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load sprint progress');
      }
      
      const { completedSprints, nextAvailableSprint } = result.progress;
      
      console.log(`✓ Sprint progress loaded:`, {
        completed: completedSprints,
        nextAvailable: nextAvailableSprint
      });
      
      // Update sprint state and DOM based on loaded progress
      applySprintProgress(completedSprints, nextAvailableSprint);
      
    } catch (error) {
      console.error('❌ Error loading sprint progress:', error);
      // Don't alert user - just use default state on error
      console.log('Using default sprint state due to error');
      setDefaultSprintState();
    }
  }

  /**
   * Apply Sprint Progress to UI
   * Update sprint circles based on saved completion state
   */
  function applySprintProgress(completedSprints, nextAvailableSprint) {
    sprintCircles.forEach((circle, index) => {
      let status;
      
      if (completedSprints.includes(index)) {
        // This sprint is completed
        status = 'completed';
        sprintState.circles[index].status = 'completed';
        sprintState.circles[index].completed = true;
      } else if (index === nextAvailableSprint) {
        // This is the next available sprint
        status = 'active';
        sprintState.circles[index].status = 'active';
        sprintState.circles[index].completed = false;
        
        // Add click listener to active circle
        circle.addEventListener('click', () => handleCircleClick(index));
      } else {
        // This sprint is locked
        status = 'locked';
        sprintState.circles[index].status = 'locked';
        sprintState.circles[index].completed = false;
      }
      
      // Update DOM
      circle.setAttribute('data-status', status);
      updateCircleVisual(circle, status);
    });
    
    console.log(`✓ Applied sprint progress: ${completedSprints.length} completed, next available: ${nextAvailableSprint}`);
  }

  /**
   * Update Circle Visual State
   */
  function updateCircleVisual(circle, status) {
    circle.classList.remove('active', 'locked', 'completed');
    circle.classList.add(status);
  }

  /**
   * Handle Circle Click
   */
  function handleCircleClick(index) {
    const circle = sprintCircles[index];
    const status = circle.getAttribute('data-status');
    
    if (status !== 'active') {
      console.log(`Circle ${index} is ${status} and cannot be clicked`);
      return;
    }
    
    console.log(`Sprint circle ${index} clicked`);
    showSprintCard(index);
  }

  /**
   * Get Step Name from Step Number (based on current protocol)
   */
  function getStepName(stepNumber) {
    const protocol = protocolDefinitions[currentCardType];
    if (protocol && protocol.steps && protocol.steps[stepNumber - 1]) {
      return protocol.steps[stepNumber - 1].title;
    }
    return `Step ${stepNumber}`;
  }

  /**
   * Get Step Description from Step Number (based on current protocol)
   */
  function getStepDescription(stepNumber) {
    const protocol = protocolDefinitions[currentCardType];
    if (protocol && protocol.steps && protocol.steps[stepNumber - 1]) {
      return protocol.steps[stepNumber - 1].description;
    }
    return '';
  }

  /**
   * Show Sprint Plan Card
   * Display the card container and load the appropriate protocol
   */
  async function showSprintCard(sprintIndex) {
    sprintState.currentCircle = sprintIndex;
    sprintState.currentPage = 1;
    sprintState.startTime = Date.now();
    sprintState.completedSteps = [];
    
    // Get current property ID from global state (set during calibration)
    sprintState.currentPropertyId = window.currentPropertyId || null;
    
    // Determine card type
    currentCardType = cardTypeMapping[sprintIndex] || 'meta_surgeon_protocol';
    console.log(`🎯 Sprint Index: ${sprintIndex}, Card Type: ${currentCardType}`);
    
    // Select appropriate card container
    cardContainer = document.querySelector('.sprint-plan-card-container');
    console.log('🔍 Selecting card container:', cardContainer);
    
    if (!cardContainer) {
      console.error(`❌ Card container not found for type: ${currentCardType}`);
      return;
    }
    
    console.log('✓ Card container found:', cardContainer.id || cardContainer.className);
    
    // STEP 1: Explicitly show the selected container FIRST
    cardContainer.style.display = 'block';
    console.log('✓ Set selected container to display: block');
    
    // STEP 2: Now hide all OTHER containers
    document.querySelectorAll('.sprint-plan-card-container').forEach(container => {
      if (container !== cardContainer) {
        container.style.display = 'none';
        console.log('✓ Hid other container:', container.id || 'unnamed');
      }
    });
    
    // Update DOM element references for this card
    cardPages = cardContainer.querySelectorAll('.sprint-card-page');
    continueBtn = cardContainer.querySelector('.btn-continue');
    nextStepBtns = cardContainer.querySelectorAll('.btn-next-step');
    completeBtn = cardContainer.querySelector('.btn-complete');
    executionAssistBtns = cardContainer.querySelectorAll('.btn-execution-assist');
    
    console.log(`✓ Found ${cardPages.length} pages in card`);
    console.log(`✓ Continue button found:`, !!continueBtn);
    
    // Populate card with protocol-specific content
    populateCardContent(currentCardType);
    
    // Attach event listeners for this card's buttons
    attachCardEventListeners();
    
    // Reset to page 1
    showPage(1);
    
    // Display the card container
    cardContainer.style.display = 'block';
    
    console.log('✓ Card display set to block');
    
    // Initialize completion page animation
    if (typeof window.initCompletionAnimation === 'function') {
      window.initCompletionAnimation();
      console.log('✓ Completion animation initialized');
    }
    
    // Smooth scroll to the card
    setTimeout(() => {
      cardContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    console.log(`✓ Showing sprint card for circle ${sprintIndex}`, {
      cardType: currentCardType,
      startTime: new Date(sprintState.startTime).toISOString(),
      propertyId: sprintState.currentPropertyId
    });
  }
  
  /**
   * Populate Card Content with Protocol Data
   * Dynamically fills the card template with content from protocol definitions
   */
  function populateCardContent(protocolType) {
    // Check if protocol definitions are loaded
    if (typeof protocolDefinitions === 'undefined') {
      console.error('❌ protocolDefinitions not loaded. Make sure protocolDefinitions.js is included before sprintPlan.js');
      return;
    }
    
    const protocol = protocolDefinitions[protocolType];
    
    if (!protocol) {
      console.error(`❌ Protocol definition not found: ${protocolType}`);
      return;
    }
    
    console.log(`🎨 Populating card with ${protocolType} content...`);
    
    // 1. Update Mission Title
    const missionTitle = cardContainer.querySelector('.mission-title');
    if (missionTitle) {
      missionTitle.textContent = protocol.missionTitle;
    }
    
    // 2. Update Entity Signal Label
    const entityLabel = cardContainer.querySelector('.entity-signal-label');
    if (entityLabel) {
      entityLabel.textContent = protocol.entityLabel;
    }
    
    // 3. Update Page 1 Insight
    const insightBlock = cardContainer.querySelector('.insight-blockquote');
    if (insightBlock) {
      // Replace company name placeholder with actual value (or property name if available)
      let insightText = protocol.page1.insight;
      
      // Determine the company name to use
      let companyName = protocol.page1.companyName;
      if (companyName === '{{PROPERTY_NAME}}' && window.currentPropertyName) {
        companyName = window.currentPropertyName;
      } else if (companyName === '{{COMPANY_NAME}}' || companyName === '{{PROPERTY_NAME}}') {
        companyName = 'Your Business'; // Fallback
      }
      
      // Replace placeholder in insight text
      insightText = insightText.replace(/\{\{COMPANY_NAME\}\}/g, companyName);
      insightText = insightText.replace(/\{\{PROPERTY_NAME\}\}/g, companyName);
      
      insightBlock.innerHTML = insightText;
    }
    
    // 4. Update Steps (Pages 2-5)
    protocol.steps.forEach((step, index) => {
      const pageNum = index + 2; // Pages start at 2 for steps
      const stepPage = cardContainer.querySelector(`.sprint-card-page[data-page="${pageNum}"]`);
      
      if (stepPage) {
        // Update step header (preserve the SVG icon)
        const stepHeader = stepPage.querySelector('.step-header');
        if (stepHeader) {
          // Find the text content after the SVG
          const svg = stepHeader.querySelector('.step-icon');
          if (svg) {
            // Clear all text nodes and replace with new step title
            Array.from(stepHeader.childNodes).forEach(node => {
              if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
              }
            });
            // Add new text content
            stepHeader.appendChild(document.createTextNode(`Step ${index + 1}: ${step.title}`));
          } else {
            // No SVG found, just replace text
            stepHeader.textContent = `Step ${index + 1}: ${step.title}`;
          }
        }
        
        // Update step body
        const stepBody = stepPage.querySelector('.step-body');
        if (stepBody) {
          stepBody.textContent = step.description;
        }
      }
    });
    
    // 5. Update Completion Page (Page 6)
    if (protocol.completion) {
      const statusLines = cardContainer.querySelectorAll('.status-line');
      if (statusLines.length >= 3) {
        // Line 1: Scanning with animated dots
        statusLines[0].innerHTML = protocol.completion.scanning + 
          '<span class="blink-dot">.</span><span class="blink-dot">.</span><span class="blink-dot">.</span>';
        
        // Line 2: Process established
        statusLines[1].textContent = protocol.completion.established;
        
        // Line 3: Success message
        statusLines[2].textContent = protocol.completion.success;
      }
    }
    
    // 6. Configure buttons for protocols with E.V.O. analysis
    if (protocolType === 'gsc_indexation_protocol' || protocolType === 'keyword_coverage_gap_protocol') {
      // For protocols with E.V.O. analysis, show Analysis buttons by default and hide Execution Assist
      const analysisButtons = cardContainer.querySelectorAll('.btn-analysis');
      const executionAssistButtons = cardContainer.querySelectorAll('.btn-execution-assist');
      
      analysisButtons.forEach(btn => {
        btn.style.display = 'flex';
      });
      
      executionAssistButtons.forEach(btn => {
        btn.style.display = 'none';
      });
      
      console.log(`✓ Protocol with E.V.O. analysis detected - Analysis buttons shown by default`);
    }
    
    console.log(`✓ Card populated successfully with ${protocolType} content`);
  }
  
  /**
   * Attach event listeners to current card's buttons
   */
  function attachCardEventListeners() {
    // Continue button (Page 1)
    if (continueBtn) {
      continueBtn.removeEventListener('click', navigateToNextPage); // Remove old listener
      continueBtn.addEventListener('click', navigateToNextPage);
    }
    
    // Next Step buttons (Pages 2-4)
    if (nextStepBtns) {
      nextStepBtns.forEach((btn) => {
        btn.removeEventListener('click', navigateToNextPage);
        btn.addEventListener('click', navigateToNextPage);
      });
    }
    
    // Complete button (Page 5/6)
    if (completeBtn) {
      completeBtn.removeEventListener('click', handleComplete);
      completeBtn.addEventListener('click', handleComplete);
    }
    
    // Execution Assist buttons
    if (executionAssistBtns) {
      executionAssistBtns.forEach((btn) => {
        btn.removeEventListener('click', handleExecutionAssist);
        btn.addEventListener('click', handleExecutionAssist);
      });
    }
  }
  
  /**
   * Handle Execution Assist button clicks
   */
  function handleExecutionAssist(event) {
    const button = event.target.closest('.btn-execution-assist');
    
    // Try to find the current page from the button's context first
    let currentPage = event.target.closest('.sprint-card-page');
    
    // If not found (e.g., button is in analysis modal), find the currently visible page
    if (!currentPage) {
      currentPage = document.querySelector('.sprint-card-page[style*="display: flex"]');
    }
    
    if (!currentPage) {
      console.error('❌ Could not find current sprint card page');
      return;
    }
    
    const pageNumber = parseInt(currentPage.getAttribute('data-page'));
    
    console.log(`Execution Assist clicked for page ${pageNumber}`);
    
    if (!window.ExecutionAssist) {
      console.error('ExecutionAssist module not loaded');
      return;
    }
    
    // Check if this is a diagnostic-specific button
    const causeIndex = button.dataset.causeIndex;
    if (causeIndex !== undefined) {
      console.log(`🔍 Diagnostic button clicked, cause index: ${causeIndex}`);
      
      // Get diagnosed cause data from E.V.O. cache
      const stepNumber = pageNumber - 1;
      const cachedData = evoDataCache[stepNumber];
      
      if (cachedData && cachedData.dimensionData && cachedData.dimensionData.health) {
        const insights = cachedData.dimensionData.health.insights || [];
        
        // Find the diagnosed cause
        for (const insight of insights) {
          if (insight.diagnosedCauses && insight.diagnosedCauses[causeIndex]) {
            const diagnosedCause = insight.diagnosedCauses[causeIndex];
            
            console.log(`✓ Found diagnosed cause: ${diagnosedCause.reason}`);
            
            // Pass diagnosed cause to ExecutionAssist
            window.ExecutionAssist.openModal(currentPage, diagnosedCause);
            return;
          }
        }
      }
      
      console.error('❌ No diagnosed cause found for index', causeIndex);
      return;
    }
    
    // Standard execution assist (no diagnostic data)
    console.log('✓ Opening standard execution assist');
    window.ExecutionAssist.openModal(currentPage);
  }

  /**
   * Navigate Between Card Pages
   */
  function navigateToNextPage() {
    // Capture step completion before advancing (for pages 2-5, which are steps 1-4)
    if (sprintState.currentPage >= 2 && sprintState.currentPage <= 5) {
      const stepNumber = sprintState.currentPage - 1; // Page 2 = Step 1, etc.
      sprintState.completedSteps.push({
        stepNumber,
        name: getStepName(stepNumber),
        description: getStepDescription(stepNumber),
        completedAt: new Date().toISOString()
      });
      console.log(`✓ Step ${stepNumber} completed:`, getStepName(stepNumber));
    }
    
    if (sprintState.currentPage < 6) {
      sprintState.currentPage++;
      showPage(sprintState.currentPage);
      
      // Update progress line for the new page
      const progressPercentage = sprintState.progressPercentages[sprintState.currentPage - 1];
      updateProgressLine(progressPercentage);
      
      console.log(`Navigated to page ${sprintState.currentPage}`);
    }
  }

  /**
   * Show Specific Page
   */
  function showPage(pageNumber) {
    cardPages.forEach((page) => {
      const pageNum = parseInt(page.getAttribute('data-page'));
      if (pageNum === pageNumber) {
        page.style.display = 'flex';
        
        // Auto-fetch E.V.O. data for protocols with E.V.O. analysis (pages 2-5 are steps)
        if (pageNum >= 2 && pageNum <= 5 && (currentCardType === 'gsc_indexation_protocol' || currentCardType === 'keyword_coverage_gap_protocol')) {
          fetchAndDisplayEVOData(pageNum);
        }
      } else {
        page.style.display = 'none';
      }
    });
  }

  // Store E.V.O. data for each step (stepNumber -> data)
  const evoDataCache = {};

  /**
   * Fetch E.V.O. Data for GSC Protocol Steps
   * Fetches and caches data, shows Analysis button when ready
   * @param {number} pageNumber - Page number (2-5)
   * @param {boolean} forceRefresh - Force cache bypass and fresh analysis
   */
  async function fetchAndDisplayEVOData(pageNumber, forceRefresh = false) {
    const stepNumber = pageNumber - 1; // Page 2 = Step 1
    const currentPage = cardContainer.querySelector(`.sprint-card-page[data-page="${pageNumber}"]`);
    
    if (!currentPage) {
      return;
    }
    
    // Get site URL from global state
    const siteUrl = window.currentPropertyUrl;
    if (!siteUrl) {
      console.warn('No property URL available for E.V.O. analysis');
      return;
    }
    
    // Get execution instructions for this step
    const protocol = protocolDefinitions[currentCardType];
    if (!protocol || !protocol.steps[stepNumber - 1]) {
      return;
    }
    
    const stepData = protocol.steps[stepNumber - 1];
    const evoInstructions = stepData.executionInstructions;
    
    // Only fetch if step has E.V.O. dimension mapping
    if (!evoInstructions?.evoDimension) {
      console.log(`Step ${stepNumber} does not have E.V.O. dimension mapping`);
      return;
    }
    
    // Check if already cached in memory (skip if forceRefresh)
    if (!forceRefresh && evoDataCache[stepNumber]) {
      console.log(`Using cached E.V.O. data for step ${stepNumber}`);
      const cachedData = evoDataCache[stepNumber];
      
      // Check if cached data has an error state
      if (cachedData.dimensionData?.health?.status === 'error') {
        setAnalysisButtonError(currentPage, stepNumber);
      } else {
        setAnalysisButtonReady(currentPage, stepNumber);
      }
      
      // Also update button visibility based on cached health data
      updateExecutionAssistVisibility(pageNumber, cachedData.needsFixes, cachedData.dimensionData);
      
      return;
    }
    
    // Set button to loading state (will be quickly updated if cache exists)
    setAnalysisButtonLoading(currentPage, stepNumber, 'Analyzing...');
    
    // Start polling for progress immediately
    const progressInterval = pollAnalysisProgress(currentPage, stepNumber, evoInstructions.evoDimension);
    
    const refreshMsg = forceRefresh ? ' (forcing refresh)' : ' (checking cache first)';
    console.log(`🔍 Fetching E.V.O. ${evoInstructions.evoDimension} analysis${refreshMsg}...`);
    
    try {
      // Fetch E.V.O. dimension data (backend will check cache or run fresh analysis)
      const response = await api.getDimension(evoInstructions.evoDimension, siteUrl, forceRefresh);
      
      // Stop polling
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      const dimensionData = response.data;
      
      if (response.fromCache) {
        console.log(`✓ Loaded cached data from database for ${evoInstructions.evoDimension}`);
      } else {
        console.log(`✓ E.V.O. analysis completed for ${evoInstructions.evoDimension}`);
      }
      
      // Check health status and determine if fixes are needed
      const healthScore = dimensionData.health?.score || 0;
      const healthStatus = dimensionData.health?.status || 'unknown';
      const healthThreshold = evoInstructions.healthThreshold || 70;
      const needsFixes = healthScore < healthThreshold;
      
      // Cache the data in memory
      evoDataCache[stepNumber] = {
        dimensionData,
        stepData,
        needsFixes,
        healthScore,
        healthThreshold
      };
      
      // Set button state based on health status
      if (healthStatus === 'error') {
        console.error(`❌ E.V.O. analysis returned error state for ${evoInstructions.evoDimension}`);
        
        // Log the actual error details from insights
        const insights = dimensionData.health?.insights || [];
        const errorInsight = insights.find(i => i.type === 'ERROR' || i.severity === 'critical');
        if (errorInsight) {
          console.error('   └─ Error Message:', errorInsight.message);
          console.error('   └─ Recommendation:', errorInsight.recommendation);
        }
        
        setAnalysisButtonError(currentPage, stepNumber);
      } else {
        setAnalysisButtonReady(currentPage, stepNumber);
      }
      
      // Show/hide Execution Assist based on health
      updateExecutionAssistVisibility(pageNumber, needsFixes, dimensionData);
      
    } catch (error) {
      // Enhanced error logging
      console.error('❌ Error fetching E.V.O. data:');
      console.error('   └─ Dimension:', evoInstructions.evoDimension);
      console.error('   └─ Site URL:', siteUrl);
      console.error('   └─ Step Number:', stepNumber);
      console.error('   └─ Error Message:', error.message);
      console.error('   └─ Error Stack:', error.stack);
      
      // Stop polling
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setAnalysisButtonError(currentPage, stepNumber);
    }
  }

  /**
   * Set Analysis Button to Loading State with Progress
   */
  function setAnalysisButtonLoading(currentPage, stepNumber, progressText = 'Preparing analysis...') {
    const analysisBtn = currentPage.querySelector(`.btn-analysis[data-step="${stepNumber}"]`);
    const progressDiv = currentPage.querySelector(`.btn-analysis-progress[data-step="${stepNumber}"]`);
    
    if (analysisBtn) {
      // Ensure button is visible
      analysisBtn.style.display = 'flex';
      analysisBtn.disabled = true;
      analysisBtn.classList.add('btn-analysis-loading');
      // Button text stays as "Analysis" with spinner icon replacing chart icon
      const chartIcon = analysisBtn.querySelector('.btn-chart-icon');
      if (chartIcon) {
        chartIcon.style.display = 'none';
      }
      // Add spinner before text
      if (!analysisBtn.querySelector('.btn-analysis-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'btn-analysis-spinner';
        analysisBtn.insertBefore(spinner, analysisBtn.firstChild);
        console.log(`✓ Analysis spinner added for step ${stepNumber}`);
      }
    }
    
    // Ensure Complete button is disabled while Step 4 analysis is running
    if (stepNumber === 4 && completeBtn) {
      completeBtn.disabled = true;
      console.log(`🔒 Complete button disabled while Step 4 analysis is running`);
    }
    
    if (progressDiv) {
      progressDiv.style.display = 'block';
      progressDiv.textContent = progressText;
      console.log(`⏳ Analysis progress for step ${stepNumber}: ${progressText}`);
    }
  }
  
  /**
   * Update Analysis Button Progress
   */
  function updateAnalysisButtonProgress(currentPage, stepNumber, progress) {
    const progressDiv = currentPage.querySelector(`.btn-analysis-progress[data-step="${stepNumber}"]`);
    
    if (progressDiv && progressDiv.style.display !== 'none') {
      // Simple format: Progress: X/Y
      if (progress.urlsCompleted !== undefined && progress.urlsTotal !== undefined) {
        progressDiv.textContent = `Progress: ${progress.urlsCompleted}/${progress.urlsTotal}`;
      }
    }
  }

  /**
   * Set Analysis Button to Ready State
   */
  function setAnalysisButtonReady(currentPage, stepNumber) {
    const analysisBtn = currentPage.querySelector(`.btn-analysis[data-step="${stepNumber}"]`);
    const progressDiv = currentPage.querySelector(`.btn-analysis-progress[data-step="${stepNumber}"]`);
    
    if (analysisBtn) {
      analysisBtn.disabled = false;
      analysisBtn.classList.remove('btn-analysis-loading');
      
      // Remove spinner
      const spinner = analysisBtn.querySelector('.btn-analysis-spinner');
      if (spinner) {
        spinner.remove();
      }
      
      // Show chart icon again
      const chartIcon = analysisBtn.querySelector('.btn-chart-icon');
      if (chartIcon) {
        chartIcon.style.display = '';
      }
      
      console.log(`✓ Analysis button ready for step ${stepNumber}`);
    }
    
    if (progressDiv) {
      progressDiv.style.display = 'none';
      progressDiv.textContent = '';
    }
  }
  
  /**
   * Poll for Analysis Progress
   */
  function pollAnalysisProgress(currentPage, stepNumber, dimension) {
    const interval = setInterval(async () => {
      try {
        const backendURL = window.kineticAPI ? window.kineticAPI.baseURL : 'http://localhost:8000';
        const url = `${backendURL}/api/gsc/evo/progress/${dimension}`;
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.success && data.hasProgress && data.progress) {
          updateAnalysisButtonProgress(currentPage, stepNumber, data.progress);
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    return interval;
  }

  /**
   * Set Analysis Button to Error State
   */
  function setAnalysisButtonError(currentPage, stepNumber) {
    const analysisBtn = currentPage.querySelector(`.btn-analysis[data-step="${stepNumber}"]`);
    
    if (analysisBtn) {
      analysisBtn.disabled = false; // Keep enabled so user can click to retry
      analysisBtn.classList.remove('btn-analysis-loading');
      analysisBtn.classList.add('btn-analysis-error');
      
      // Show error message with retry hint
      analysisBtn.innerHTML = `
        <svg class="btn-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Error - Click to Retry
      `;
      
      console.log(`❌ Analysis button error for step ${stepNumber} - Click button to retry`);
    }
  }


  /**
   * Update Execution Assist Button Visibility
   * Only show if fixes are needed
   */
  function updateExecutionAssistVisibility(pageNumber, needsFixes, dimensionData) {
    const currentPage = cardContainer.querySelector(`.sprint-card-page[data-page="${pageNumber}"]`);
    if (!currentPage) return;
    
    const executionAssistBtn = currentPage.querySelector('.btn-execution-assist');
    const instructionContainer = currentPage.querySelector('.instruction-container');
    const stepNumber = pageNumber - 1; // Calculate step number from page number
    const nextStepBtn = currentPage.querySelector(`.btn-next-step[data-step="${stepNumber}"]`);
    
    // Special case: Content Opportunity Protocol Steps 1 & 2 - Analysis button is sufficient
    if (currentCardType === 'keyword_coverage_gap_protocol' && (stepNumber === 1 || stepNumber === 2)) {
      if (executionAssistBtn) {
        executionAssistBtn.style.display = 'none';
        const stepName = stepNumber === 1 ? 'Content Inventory' : 'Keyword Discovery';
        console.log(`✓ ${stepName} step - Analysis button is sufficient, hiding Execution Assist`);
      }
      if (instructionContainer) {
        instructionContainer.style.display = 'none';
      }
      if (nextStepBtn) {
        nextStepBtn.disabled = false;
        console.log(`✓ Next Step button enabled for step ${stepNumber}`);
      }
      return; // Exit early, no need to check health scores
    }
    
    if (needsFixes) {
      // Show Execution Assist button
      if (executionAssistBtn) {
        executionAssistBtn.style.display = 'flex';
        const healthScore = dimensionData.health?.score || 0;
        console.log(`⚠ Health score ${healthScore} below threshold - showing Execution Assist`);
      }
      if (instructionContainer) {
        instructionContainer.style.display = 'block';
      }
      // Next Step/Complete button remains disabled until user copies Execution Assist prompt
    } else {
      // Hide Execution Assist - no fixes needed
      if (executionAssistBtn) {
        executionAssistBtn.style.display = 'none';
        console.log(`✓ Health score acceptable - hiding Execution Assist`);
      }
      if (instructionContainer) {
        instructionContainer.style.display = 'none';
      }
      
      // Enable Next Step button since no action is required
      if (nextStepBtn) {
        nextStepBtn.disabled = false;
        console.log(`✓ Next Step button enabled - no fixes needed for step ${stepNumber}`);
      }
      
      // Special handling for last step (Step 4) - enable Complete button
      if (stepNumber === 4) {
        if (completeBtn) {
          completeBtn.disabled = false;
          console.log(`✓ Complete button enabled - Step 4 analysis finished`);
        }
      }
    }
  }

  /**
   * Get E.V.O. Data for Step (for modal display)
   * @param {number} stepNumber - Step number
   * @returns {Object|null} Cached E.V.O. data
   */
  function getEVODataForStep(stepNumber) {
    return evoDataCache[stepNumber] || null;
  }

  // Expose getEVODataForStep globally for executionAssist.js
  window.getEVODataForStep = getEVODataForStep;

  /**
   * Update Progress Line
   * Animate the orange horizontal line to the specified percentage
   */
  function updateProgressLine(percentage) {
    // Find the shared progress line in the header
    const progressLine = document.querySelector('.sprint-card-header .progress-line');
    if (progressLine) {
      progressLine.style.setProperty('--progress-fill', `${percentage}%`);
    }
  }

  /**
   * Close Sprint Card
   * Hide the card container and reset to page 1
   */
  function closeSprintCard() {
    if (cardContainer) {
      cardContainer.style.display = 'none';
    }
    sprintState.currentPage = 1;
    showPage(1);
    currentCardType = null;
    console.log('✓ Sprint card closed');
  }

  /**
   * Unlock Next Circle (Placeholder)
   * Prepared for future backend integration
   */
  function unlockNextCircle(currentIndex) {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < sprintCircles.length) {
      const nextCircle = sprintCircles[nextIndex];
      
      // Update state
      sprintState.circles[currentIndex].status = 'completed';
      sprintState.circles[currentIndex].completed = true;
      sprintState.circles[nextIndex].status = 'active';
      
      // Update DOM
      sprintCircles[currentIndex].setAttribute('data-status', 'completed');
      nextCircle.setAttribute('data-status', 'active');
      
      // Update visuals
      updateCircleVisual(sprintCircles[currentIndex], 'completed');
      updateCircleVisual(nextCircle, 'active');
      
      // Add click listener to newly active circle
      nextCircle.addEventListener('click', () => handleCircleClick(nextIndex));
      
      console.log(`✓ Circle ${nextIndex} unlocked`);
    } else {
      console.log('All circles completed!');
    }
  }

  /**
   * Handle Complete Button Click (Page 5)
   * Advances to completion status page and saves to database
   */
  async function handleComplete() {
    console.log('Complete button clicked - saving completion and advancing to status page');
    
    // Navigate to page 6 first
    navigateToNextPage();
    
    // Build completion data
    const completionData = {
      cardType: currentCardType || 'meta_surgeon_protocol',
      propertyId: sprintState.currentPropertyId,
      sprintIndex: sprintState.currentCircle,
      startedAt: new Date(sprintState.startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - sprintState.startTime,
      progressPercentage: 95,
      steps: sprintState.completedSteps
    };
    
    // Validate we have required data
    if (!completionData.propertyId) {
      console.warn('⚠ Cannot save: No property ID available. Card completion will not be persisted.');
      // Still show success page but don't save
      return;
    }
    
    try {
      // Save to backend
      const result = await api.saveCompletedSprintCard(completionData);
      console.log('✓ Sprint card completion saved:', result);
      
      // Show subtle success indicator (could enhance with a notification)
      console.log(`✓ Card ID ${result.cardId} saved successfully`);
      
      // Listen for animation completion event
      const animationCompleteHandler = async () => {
        console.log('✓ Animation complete, unlocking next circle');
        unlockNextCircle(sprintState.currentCircle);
        
        // Refresh completed cards archive
        if (window.loadCompletedCardsArchive) {
          await window.loadCompletedCardsArchive(sprintState.currentPropertyId);
          
          // Scroll to archive section
          const archiveSection = document.querySelector('.completed-cards-section');
          if (archiveSection && archiveSection.style.display !== 'none') {
            setTimeout(() => {
              archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
          }
        }
        
        // Close the sprint card after 1 second
        setTimeout(() => {
          closeSprintCard();
        }, 1000);
        
        // Remove listener
        window.removeEventListener('sprintCardAnimationComplete', animationCompleteHandler);
      };
      
      window.addEventListener('sprintCardAnimationComplete', animationCompleteHandler);
      
    } catch (error) {
      console.error('❌ Failed to save sprint card completion:', error);
      // Still show page 6, but warn user
      alert('Card completed but could not save to history. Please check your connection.');
    }
  }

  // ========================================
  // Event Listeners (Note: Card-specific listeners are attached in attachCardEventListeners)
  // ========================================
  
  // Make instruction labels clickable (for Meta Surgeon card)
  const instructionLabels = document.querySelectorAll('.instruction-label');
  instructionLabels.forEach((label) => {
    label.style.cursor = 'pointer';
    label.style.transition = 'color 0.3s ease';
    
    label.addEventListener('click', () => {
      const currentPage = label.closest('.sprint-card-page');
      if (window.ExecutionAssist) {
        window.ExecutionAssist.openModal(currentPage);
      }
    });
    
    // Add hover effect
    label.addEventListener('mouseenter', () => {
      label.style.color = 'var(--color-primary-green)';
    });
    
    label.addEventListener('mouseleave', () => {
      label.style.color = '';
    });
  });

  // ========================================
  // Initialize
  // ========================================
  initSprintCircles();

  // Listen for property selection to load sprint progress
  window.addEventListener('propertySelected', async (event) => {
    const propertyId = event.detail.propertyId;
    console.log(`Property selected: ${propertyId}, loading sprint progress...`);
    await loadSprintProgress(propertyId);
  });

  // Load sprint progress on initial load if property is already selected
  if (window.currentPropertyId) {
    loadSprintProgress(window.currentPropertyId);
  } else {
    // No property selected yet, set default state (first circle active)
    setDefaultSprintState();
  }

  // ========================================
  // Analysis Button Event Handlers
  // ========================================
  
  /**
   * Handle Analysis Button Click
   * Opens modal with E.V.O. insights, or retries if error state
   */
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-analysis')) {
      const btn = e.target.closest('.btn-analysis');
      const stepNumber = parseInt(btn.dataset.step);
      
      // Check if button is in error state - if so, retry the analysis
      if (btn.classList.contains('btn-analysis-error')) {
        console.log(`🔄 Retrying analysis for step ${stepNumber}...`);
        
        // Calculate page number from step number
        const pageNumber = stepNumber + 1;
        
        // Clear cached data for this step to force fresh fetch
        delete evoDataCache[stepNumber];
        
        // Retry with force refresh
        fetchAndDisplayEVOData(pageNumber, true);
        
        return; // Don't open modal yet, wait for retry to complete
      }
      
      // Get cached E.V.O. data
      const cachedData = evoDataCache[stepNumber];
      if (!cachedData) {
        console.warn('No E.V.O. data available for step', stepNumber);
        return;
      }
      
      // Check if cached data has error state - if so, allow retry
      if (cachedData.dimensionData?.health?.status === 'error') {
        console.log(`🔄 Cached data has error state, retrying analysis for step ${stepNumber}...`);
        
        // Calculate page number from step number
        const pageNumber = stepNumber + 1;
        
        // Clear cached data to force fresh fetch
        delete evoDataCache[stepNumber];
        
        // Retry with force refresh
        fetchAndDisplayEVOData(pageNumber, true);
        
        return; // Don't open modal yet, wait for retry to complete
      }
      
      openAnalysisModal(stepNumber, cachedData);
    }
  });

  /**
   * Open Analysis Modal
   * @param {number} stepNumber - Step number
   * @param {Object} cachedData - Cached E.V.O. data
   */
  function openAnalysisModal(stepNumber, cachedData) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    // Check if this is Content Opportunity Protocol Step 1
    if (currentCardType === 'keyword_coverage_gap_protocol' && stepNumber === 1) {
      openContentInventoryAnalysisModal(stepNumber, cachedData);
      return;
    }
    
    // Check if this is Content Opportunity Protocol Step 2
    if (currentCardType === 'keyword_coverage_gap_protocol' && stepNumber === 2) {
      openKeywordDiscoveryAnalysisModal(stepNumber, cachedData);
      return;
    }
    
    // Check if this is Content Opportunity Protocol Step 3
    if (currentCardType === 'keyword_coverage_gap_protocol' && stepNumber === 3) {
      openCoverageGapAnalysisModal(stepNumber, cachedData);
      return;
    }
    
    // Default indexation-focused analysis for other protocols
    openIndexationAnalysisModal(stepNumber, cachedData);
  }

  /**
   * Open Content Inventory Analysis Modal (Content Opportunity Protocol - Step 1)
   * @param {number} stepNumber - Step number
   * @param {Object} cachedData - Cached E.V.O. data
   */
  function openContentInventoryAnalysisModal(stepNumber, cachedData) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    const { dimensionData, stepData, healthScore, needsFixes } = cachedData;
    const health = dimensionData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    // Populate context
    document.getElementById('analysis-step').textContent = stepData.title;
    document.getElementById('analysis-dimension').textContent = 'CONTENT INVENTORY';
    
    const healthEl = document.getElementById('analysis-health');
    healthEl.textContent = `${healthScore}/100`;
    healthEl.style.color = healthScore >= 70 ? 'var(--color-primary-green)' : 'var(--color-error)';
    
    // Populate metrics - Content-focused display
    const metricsContainer = document.getElementById('analysis-metrics');
    let metricsHTML = '';
    
    if (Object.keys(metrics).length === 0) {
      metricsHTML = '<div class="evo-no-metrics">No metrics available</div>';
    } else {
      // Prioritize content-specific metrics
      const metricOrder = ['totalPages', 'rankingKeywords', 'avgPosition', 'contentCoverage', 'topPerformingPages', 'underperformingPages'];
      const displayedMetrics = new Set();
      
      // Display prioritized metrics first
      metricOrder.forEach(key => {
        if (metrics[key] !== undefined) {
          displayedMetrics.add(key);
          const label = formatMetricLabel(key);
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value">${formatMetricValue(metrics[key])}</div>
            </div>
          `;
        }
      });
      
      // Display remaining metrics
      Object.entries(metrics).forEach(([key, value]) => {
        if (!displayedMetrics.has(key)) {
          const label = formatMetricLabel(key);
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value">${formatMetricValue(value)}</div>
            </div>
          `;
        }
      });
    }
    
    metricsContainer.innerHTML = metricsHTML;
    
    // Populate insights - Content-focused insights
    const insightsContainer = document.getElementById('analysis-insights');
    if (insights.length > 0) {
      let insightsHTML = '';
      insights.forEach(insight => {
        const severityClass = `evo-insight-${insight.severity || 'info'}`;
        const isError = insight.type === 'ERROR' || insight.severity === 'critical';
        
        insightsHTML += `
          <div class="evo-insight ${severityClass}">
            <div class="evo-insight-type">${insight.type || 'CONTENT INSIGHT'}</div>
            <div class="evo-insight-message">${insight.message}</div>
            
            ${isError && insight.recommendation ? `
              <div class="evo-insight-recommendation">→ ${insight.recommendation}</div>
              <div class="evo-insight-retry-container" style="margin-top: 16px;">
                <button class="btn-retry-analysis" data-step="${stepNumber}" style="
                  padding: 10px 20px;
                  background: var(--color-accent-orange);
                  color: var(--color-bg-dark);
                  border: none;
                  border-radius: 4px;
                  font-family: 'Press Start 2P', monospace;
                  font-size: 10px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: all 0.2s ease;
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Retry Analysis
                </button>
              </div>
            ` : ''}
            
            ${!isError && insight.contentOpportunities && insight.contentOpportunities.length > 0 ? `
              <div class="evo-diagnosed-causes">
                <div class="evo-diagnosed-causes-label">Content Opportunities:</div>
                <div class="evo-diagnosed-causes-list">
                  ${insight.contentOpportunities.map((opportunity, index) => `
                    <div class="evo-diagnosed-cause evo-diagnosed-${opportunity.priority || 'medium'}">
                      <div class="evo-diagnosed-cause-header">
                        <span class="evo-diagnosed-cause-reason">${opportunity.topic || opportunity.keyword}</span>
                        <span class="evo-diagnosed-cause-count">${opportunity.impressions || opportunity.searches || 0} impressions</span>
                      </div>
                      <div class="evo-diagnosed-cause-fix">→ ${opportunity.opportunity || opportunity.action}</div>
                      ${opportunity.keywords && opportunity.keywords.length > 0 ? `
                        <div class="evo-diagnosed-urls">
                          <button class="evo-diagnosed-urls-toggle" data-cause-index="${index}" data-toggle-type="keywords">
                            <svg class="evo-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            View related keywords
                          </button>
                          <div class="evo-diagnosed-urls-list" data-cause-index="${index}" style="display: none;">
                            ${opportunity.keywords.map(kw => `
                              <div class="evo-diagnosed-url">
                                <span>${kw.query || kw}</span>
                                ${kw.position ? `<span class="keyword-position"> - Position: ${kw.position}</span>` : ''}
                                ${kw.impressions ? `<span class="keyword-impressions"> - ${kw.impressions} impressions</span>` : ''}
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : !isError && insight.possibleCauses && insight.possibleCauses.length > 0 ? `
              <div class="evo-insight-causes">
                <div class="evo-insight-causes-label">Areas to Explore:</div>
                <ul class="evo-insight-causes-list">
                  ${insight.possibleCauses.map(cause => `<li>${cause}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${!isError && insight.recommendation ? `<div class="evo-insight-recommendation">→ ${insight.recommendation}</div>` : ''}
          </div>
        `;
      });
      insightsContainer.innerHTML = insightsHTML;
    } else {
      insightsContainer.innerHTML = '<div class="evo-no-insights">✓ Content inventory complete. Proceed to keyword discovery in Step 2.</div>';
    }
    
    // Show results, hide loading
    document.getElementById('analysis-loading').style.display = 'none';
    document.getElementById('analysis-results').style.display = 'block';
    
    // Add event listener for retry button if present
    setTimeout(() => {
      const retryBtn = insightsContainer.querySelector('.btn-retry-analysis');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          const stepNum = parseInt(this.dataset.step);
          console.log(`🔄 Retry button clicked for step ${stepNum}`);
          
          // Close modal
          modal.style.display = 'none';
          
          // Calculate page number
          const pageNum = stepNum + 1;
          
          // Clear cached data
          delete evoDataCache[stepNum];
          
          // Retry with force refresh
          fetchAndDisplayEVOData(pageNum, true);
        });
        
        // Add hover effect
        retryBtn.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.boxShadow = '0 4px 12px rgba(255, 107, 0, 0.4)';
        });
        
        retryBtn.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });
      }
    }, 0);
    
    // Hide Execution Assist button (not needed for this step)
    const executionAssistBtn = document.getElementById('analysis-execution-assist-btn');
    if (executionAssistBtn) {
      executionAssistBtn.style.display = 'none';
    }
    
    // Show modal
    modal.style.display = 'flex';
  }

  /**
   * Open Keyword Discovery Analysis Modal (Content Opportunity Protocol - Step 2)
   * @param {number} stepNumber - Step number
   * @param {Object} cachedData - Cached E.V.O. data
   */
  function openKeywordDiscoveryAnalysisModal(stepNumber, cachedData) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    const { dimensionData, stepData, healthScore, needsFixes } = cachedData;
    const health = dimensionData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    // Populate context
    document.getElementById('analysis-step').textContent = stepData.title;
    document.getElementById('analysis-dimension').textContent = 'KEYWORD OPPORTUNITIES';
    
    const healthEl = document.getElementById('analysis-health');
    healthEl.textContent = `${healthScore}/100`;
    healthEl.style.color = healthScore >= 70 ? 'var(--color-primary-green)' : 'var(--color-error)';
    
    // Populate metrics - Keyword opportunity-focused display
    const metricsContainer = document.getElementById('analysis-metrics');
    let metricsHTML = '';
    
    if (Object.keys(metrics).length === 0) {
      metricsHTML = '<div class="evo-no-metrics">No metrics available</div>';
    } else {
      // Prioritize keyword opportunity metrics
      const metricOrder = ['totalQueries', 'lowCTROpportunities', 'page2QuickWins', 'highVolumeOpportunities', 'zeroClickQueries', 'potentialTrafficGain', 'avgPosition', 'avgCTR'];
      const displayedMetrics = new Set();
      
      // Display prioritized metrics first
      metricOrder.forEach(key => {
        if (metrics[key] !== undefined) {
          displayedMetrics.add(key);
          const label = formatMetricLabel(key);
          const valueColor = key === 'potentialTrafficGain' ? 'var(--color-primary-green)' : '';
          const valueStyle = valueColor ? `style="color: ${valueColor};"` : '';
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value" ${valueStyle}>${formatMetricValue(metrics[key])}</div>
            </div>
          `;
        }
      });
      
      // Display remaining metrics
      Object.entries(metrics).forEach(([key, value]) => {
        if (!displayedMetrics.has(key)) {
          const label = formatMetricLabel(key);
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value">${formatMetricValue(value)}</div>
            </div>
          `;
        }
      });
    }
    
    metricsContainer.innerHTML = metricsHTML;
    
    // Populate insights - Keyword opportunity-focused insights
    const insightsContainer = document.getElementById('analysis-insights');
    if (insights.length > 0) {
      let insightsHTML = '';
      insights.forEach(insight => {
        const severityClass = `evo-insight-${insight.severity || 'info'}`;
        const isError = insight.type === 'ERROR' || insight.severity === 'critical';
        
        insightsHTML += `
          <div class="evo-insight ${severityClass}">
            <div class="evo-insight-type">${insight.type || 'KEYWORD INSIGHT'}</div>
            <div class="evo-insight-message">${insight.message}</div>
            
            ${isError && insight.recommendation ? `
              <div class="evo-insight-recommendation">→ ${insight.recommendation}</div>
              <div class="evo-insight-retry-container" style="margin-top: 16px;">
                <button class="btn-retry-analysis" data-step="${stepNumber}" style="
                  padding: 10px 20px;
                  background: var(--color-accent-orange);
                  color: var(--color-bg-dark);
                  border: none;
                  border-radius: 4px;
                  font-family: 'Press Start 2P', monospace;
                  font-size: 10px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: all 0.2s ease;
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Retry Analysis
                </button>
              </div>
            ` : ''}
            
            ${!isError && insight.keywordOpportunities && insight.keywordOpportunities.length > 0 ? `
              <div class="evo-diagnosed-causes">
                <div class="evo-diagnosed-causes-label">Keyword Opportunities (Top ${insight.keywordOpportunities.length}):</div>
                <div class="evo-diagnosed-causes-list">
                  ${insight.keywordOpportunities.map((kw, index) => `
                    <div class="evo-diagnosed-cause evo-diagnosed-${kw.priority || 'medium'}">
                      <div class="evo-diagnosed-cause-header">
                        <span class="evo-diagnosed-cause-reason">${kw.query}</span>
                        <span class="evo-diagnosed-cause-count">${kw.impressions.toLocaleString()} impressions</span>
                      </div>
                      <div class="evo-diagnosed-cause-fix">
                        <strong>Position:</strong> ${kw.position} | 
                        <strong>CTR:</strong> ${kw.ctr}% (Expected: ${kw.expectedCTR}%) | 
                        <strong>Category:</strong> ${kw.category.replace('_', ' ')} | 
                        <strong>Potential:</strong> +${kw.potentialGain} clicks/mo
                      </div>
                      <div class="evo-diagnosed-cause-fix">→ ${kw.opportunity}</div>
                      ${kw.page ? `<div class="evo-diagnosed-cause-url" style="margin-top: 8px; font-size: 12px; color: var(--color-text-muted); word-break: break-all;">🌐 ${kw.page}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${!isError && insight.recommendation ? `<div class="evo-insight-recommendation">→ ${insight.recommendation}</div>` : ''}
          </div>
        `;
      });
      insightsContainer.innerHTML = insightsHTML;
    } else {
      insightsContainer.innerHTML = '<div class="evo-no-insights">✓ Keyword discovery complete. Proceed to coverage gap analysis in Step 3.</div>';
    }
    
    // Show results, hide loading
    document.getElementById('analysis-loading').style.display = 'none';
    document.getElementById('analysis-results').style.display = 'block';
    
    // Add event listener for retry button if present
    setTimeout(() => {
      const retryBtn = insightsContainer.querySelector('.btn-retry-analysis');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          const stepNum = parseInt(this.dataset.step);
          console.log(`🔄 Retry button clicked for step ${stepNum}`);
          
          // Close modal
          modal.style.display = 'none';
          
          // Calculate page number
          const pageNum = stepNum + 1;
          
          // Clear cached data
          delete evoDataCache[stepNum];
          
          // Retry with force refresh
          fetchAndDisplayEVOData(pageNum, true);
        });
        
        // Add hover effect
        retryBtn.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.boxShadow = '0 0 20px rgba(255, 165, 0, 0.5)';
        });
        
        retryBtn.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });
      }
    }, 0);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Show Execution Assist button for keyword optimization
    const executionAssistBtn = document.getElementById('analysis-execution-assist-btn');
    if (executionAssistBtn) {
      executionAssistBtn.style.display = 'flex';
      
      // Remove any existing listeners
      const newBtn = executionAssistBtn.cloneNode(true);
      executionAssistBtn.parentNode.replaceChild(newBtn, executionAssistBtn);
      
      // Add click handler that calls ExecutionAssist method
      newBtn.addEventListener('click', () => {
        if (typeof ExecutionAssist !== 'undefined') {
          ExecutionAssist.openModalWithKeywordData(cachedData);
        } else {
          console.error('ExecutionAssist module not available');
        }
      });
    }
  }

  /**
   * Open Coverage Gap Analysis Modal (Content Opportunity Protocol - Step 3)
   * @param {number} stepNumber - Step number
   * @param {Object} cachedData - Cached E.V.O. data
   */
  function openCoverageGapAnalysisModal(stepNumber, cachedData) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    const { dimensionData, stepData, healthScore, needsFixes } = cachedData;
    const health = dimensionData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    // Populate context
    document.getElementById('analysis-step').textContent = stepData.title;
    document.getElementById('analysis-dimension').textContent = 'COVERAGE GAPS';
    
    const healthEl = document.getElementById('analysis-health');
    healthEl.textContent = `${healthScore}/100`;
    healthEl.style.color = healthScore >= 70 ? 'var(--color-primary-green)' : 'var(--color-error)';
    
    // Populate metrics - Gap-focused display
    const metricsContainer = document.getElementById('analysis-metrics');
    let metricsHTML = '';
    
    if (Object.keys(metrics).length === 0) {
      metricsHTML = '<div class="evo-no-metrics">No metrics available</div>';
    } else {
      // Prioritize gap-specific metrics
      const metricOrder = ['totalGaps', 'positionGaps', 'contentGaps', 'ctrGaps', 'totalOpportunityClicks', 'avgGapPosition', 'avgGapImpressions'];
      const displayedMetrics = new Set();
      
      // Display prioritized metrics first
      metricOrder.forEach(key => {
        if (metrics[key] !== undefined) {
          displayedMetrics.add(key);
          const label = formatMetricLabel(key);
          const valueColor = key === 'totalOpportunityClicks' ? 'var(--color-primary-green)' : '';
          const valueStyle = valueColor ? `style="color: ${valueColor};"` : '';
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value" ${valueStyle}>${formatMetricValue(metrics[key])}</div>
            </div>
          `;
        }
      });
      
      // Display remaining metrics
      Object.entries(metrics).forEach(([key, value]) => {
        if (!displayedMetrics.has(key)) {
          const label = formatMetricLabel(key);
          metricsHTML += `
            <div class="evo-metric-card">
              <div class="evo-metric-label">${label}</div>
              <div class="evo-metric-value">${formatMetricValue(value)}</div>
            </div>
          `;
        }
      });
    }
    
    metricsContainer.innerHTML = metricsHTML;
    
    // Populate insights - Gap-focused insights
    const insightsContainer = document.getElementById('analysis-insights');
    if (insights.length > 0) {
      let insightsHTML = '';
      insights.forEach(insight => {
        const severityClass = `evo-insight-${insight.severity || 'info'}`;
        const isError = insight.type === 'ERROR' || insight.severity === 'critical';
        
        insightsHTML += `
          <div class="evo-insight ${severityClass}">
            <div class="evo-insight-type">${insight.type || 'COVERAGE GAP INSIGHT'}</div>
            <div class="evo-insight-message">${insight.message}</div>
            
            ${isError && insight.recommendation ? `
              <div class="evo-insight-recommendation">→ ${insight.recommendation}</div>
              <div class="evo-insight-retry-container" style="margin-top: 16px;">
                <button class="btn-retry-analysis" data-step="${stepNumber}" style="
                  padding: 10px 20px;
                  background: var(--color-accent-orange);
                  color: var(--color-bg-dark);
                  border: none;
                  border-radius: 4px;
                  font-family: 'Press Start 2P', monospace;
                  font-size: 10px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: all 0.2s ease;
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Retry Analysis
                </button>
              </div>
            ` : ''}
            
            ${!isError && insight.gapOpportunities && insight.gapOpportunities.length > 0 ? `
              <div class="evo-diagnosed-causes">
                <div class="evo-diagnosed-causes-label">Gap Opportunities (sorted by traffic potential):</div>
                <div class="evo-diagnosed-causes-list">
                  ${insight.gapOpportunities.map((gap, index) => {
                    const gapTypeLabel = gap.gapType === 'position' ? '📍 Position' : 
                                        gap.gapType === 'content' ? '📄 Content' : 
                                        gap.gapType === 'ctr' ? '👁️ CTR' : 'Gap';
                    const gapTypeClass = gap.gapType === 'position' ? 'medium' :
                                        gap.gapType === 'content' ? 'high' :
                                        gap.gapType === 'ctr' ? 'medium' : 'low';
                    
                    return `
                      <div class="evo-diagnosed-cause evo-diagnosed-${gapTypeClass}">
                        <div class="evo-diagnosed-cause-header">
                          <span class="evo-diagnosed-cause-reason">${gap.query}</span>
                          <span class="evo-diagnosed-cause-count" style="color: var(--color-primary-green);">+${gap.trafficPotential} clicks/mo</span>
                        </div>
                        <div class="evo-diagnosed-cause-metrics" style="display: flex; gap: 16px; font-size: 11px; color: var(--color-text-dim); margin-top: 4px;">
                          <span>${gapTypeLabel}</span>
                          <span>Position: #${gap.currentPosition}</span>
                          <span>${gap.impressions.toLocaleString()} impressions</span>
                          <span>CTR: ${gap.currentCTR}%</span>
                        </div>
                        <div class="evo-diagnosed-cause-fix">→ ${gap.opportunity}</div>
                        ${gap.rankingUrl ? `<div class="evo-diagnosed-cause-url" style="margin-top: 8px; font-size: 12px; color: var(--color-text-muted); word-break: break-all;">🌐 ${gap.rankingUrl}</div>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : !isError && insight.possibleCauses && insight.possibleCauses.length > 0 ? `
              <div class="evo-insight-causes">
                <div class="evo-insight-causes-label">Areas to Explore:</div>
                <ul class="evo-insight-causes-list">
                  ${insight.possibleCauses.map(cause => `<li>${cause}</li>`).join('')}
                </ul>
              </div>
            ` : !isError && insight.recommendation ? `
              <div class="evo-insight-recommendation">→ ${insight.recommendation}</div>
            ` : ''}
          </div>
        `;
      });
      insightsContainer.innerHTML = insightsHTML;
    } else {
      insightsContainer.innerHTML = '<div class="evo-no-insights">✓ Coverage gap analysis complete. Proceed to content planning in Step 4.</div>';
    }
    
    // Show results, hide loading
    document.getElementById('analysis-loading').style.display = 'none';
    document.getElementById('analysis-results').style.display = 'block';
    
    // Add event listener for retry button if present
    setTimeout(() => {
      const retryBtn = insightsContainer.querySelector('.btn-retry-analysis');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          const stepNum = parseInt(this.dataset.step);
          console.log(`🔄 Retry button clicked for step ${stepNum}`);
          
          // Close modal
          modal.style.display = 'none';
          
          // Calculate page number
          const pageNum = stepNum + 1;
          
          // Clear cached data
          delete evoDataCache[stepNum];
          
          // Retry with force refresh
          fetchAndDisplayEVOData(pageNum, true);
        });
        
        // Add hover effect
        retryBtn.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.boxShadow = '0 0 20px rgba(255, 165, 0, 0.5)';
        });
        
        retryBtn.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });
      }
    }, 0);
    
    // Show modal
    modal.style.display = 'flex';
    
    // Hide Execution Assist button for gap analysis
    const executionAssistBtn = document.getElementById('analysis-execution-assist-btn');
    if (executionAssistBtn) {
      executionAssistBtn.style.display = 'none';
    }
  }

  /**
   * Open Indexation Analysis Modal (Index Diagnostic Protocol and other indexation-focused protocols)
   * @param {number} stepNumber - Step number
   * @param {Object} cachedData - Cached E.V.O. data
   */
  function openIndexationAnalysisModal(stepNumber, cachedData) {
    const modal = document.getElementById('analysis-modal');
    if (!modal) return;
    
    const { dimensionData, stepData, healthScore, needsFixes } = cachedData;
    const health = dimensionData.health || {};
    const metrics = health.metrics || {};
    const insights = health.insights || [];
    
    // Populate context
    document.getElementById('analysis-step').textContent = stepData.title;
    document.getElementById('analysis-dimension').textContent = 
      stepData.executionInstructions.evoDimension.toUpperCase();
    
    const healthEl = document.getElementById('analysis-health');
    healthEl.textContent = `${healthScore}/100`;
    healthEl.style.color = healthScore >= 70 ? 'var(--color-primary-green)' : 'var(--color-error)';
    
    // Populate metrics
    const metricsContainer = document.getElementById('analysis-metrics');
    let metricsHTML = '';
    
    if (Object.keys(metrics).length === 0) {
      metricsHTML = '<div class="evo-no-metrics">No metrics available</div>';
    } else {
      Object.entries(metrics).forEach(([key, value]) => {
        const label = formatMetricLabel(key);
        metricsHTML += `
          <div class="evo-metric-card">
            <div class="evo-metric-label">${label}</div>
            <div class="evo-metric-value">${formatMetricValue(value)}</div>
          </div>
        `;
      });
    }
    
    metricsContainer.innerHTML = metricsHTML;
    
    // Populate insights
    const insightsContainer = document.getElementById('analysis-insights');
    if (insights.length > 0) {
      let insightsHTML = '';
      insights.forEach(insight => {
        const severityClass = `evo-insight-${insight.severity || 'info'}`;
        const isError = insight.type === 'ERROR' || insight.severity === 'critical';
        
        insightsHTML += `
          <div class="evo-insight ${severityClass}">
            <div class="evo-insight-type">${insight.type || 'INSIGHT'}</div>
            <div class="evo-insight-message">${insight.message}</div>
            
            ${isError && insight.recommendation ? `
              <div class="evo-insight-recommendation">→ ${insight.recommendation}</div>
              <div class="evo-insight-retry-container" style="margin-top: 16px;">
                <button class="btn-retry-analysis" data-step="${stepNumber}" style="
                  padding: 10px 20px;
                  background: var(--color-accent-orange);
                  color: var(--color-bg-dark);
                  border: none;
                  border-radius: 4px;
                  font-family: 'Press Start 2P', monospace;
                  font-size: 10px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: all 0.2s ease;
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Retry Analysis
                </button>
              </div>
            ` : ''}
            
            ${!isError && insight.diagnosedCauses && insight.diagnosedCauses.length > 0 ? `
              <div class="evo-diagnosed-causes">
                <div class="evo-diagnosed-causes-label">E.V.O. Diagnosed Issues:</div>
                <div class="evo-diagnosed-causes-list">
                  ${insight.diagnosedCauses.map((cause, index) => `
                    <div class="evo-diagnosed-cause evo-diagnosed-${cause.severity}">
                      <div class="evo-diagnosed-cause-header">
                        <span class="evo-diagnosed-cause-reason">${cause.reason}</span>
                        <span class="evo-diagnosed-cause-count">${cause.count} page${cause.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div class="evo-diagnosed-cause-fix">→ ${cause.fix}</div>
                      ${cause.strategies && cause.strategies.length > 0 ? `
                        <div class="evo-indexing-strategies">
                          <div class="evo-strategies-header">
                            <svg class="evo-strategies-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M9 11l3 3L22 4"></path>
                              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                            </svg>
                            Indexation Strategy
                          </div>
                          ${cause.strategies.map(strategy => `
                            <div class="evo-strategy-category">
                              <div class="evo-strategy-category-title">${strategy.category}</div>
                              <ul class="evo-strategy-list">
                                ${strategy.items.map(item => `<li>${item}</li>`).join('')}
                              </ul>
                            </div>
                          `).join('')}
                          <button class="btn-execution-assist btn-execution-assist-diagnostic" data-cause-index="${index}">
                            Execution Assist
                            <svg class="btn-plus-icon" xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 600.000000 600.000000" preserveAspectRatio="xMidYMid meet">
                              <g transform="translate(0.000000,600.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="none">
                                <path d="M2760 5084 c-110 -13 -248 -39 -345 -64 -631 -166 -1162 -631 -1409 -1236 -224 -548 -205 -1156 54 -1689 307 -634 901 -1068 1601 -1170 138 -20 448 -20 587 0 702 100 1302 539 1611 1180 207 428 257 950 134 1420 -167 643 -647 1178 -1278 1425 -236 92 -443 131 -720 135 -110 2 -216 1 -235 -1z m263 -1005 c49 -13 115 -73 138 -124 17 -36 19 -73 19 -382 l0 -343 343 0 c341 0 342 0 394 -24 63 -30 107 -87 124 -160 22 -100 -34 -216 -126 -257 -36 -17 -73 -19 -382 -19 l-343 0 0 -323 c0 -350 -4 -386 -54 -451 -36 -48 -117 -86 -182 -86 -75 0 -150 41 -189 105 l-30 48 -5 351 -5 351 -356 5 -356 5 -48 30 c-72 45 -108 117 -103 207 3 55 9 75 34 110 38 54 82 84 145 97 30 7 178 11 364 11 l315 0 0 328 c0 188 4 342 10 363 14 52 49 99 95 131 57 38 124 48 198 27z"/>
                              </g>
                            </svg>
                          </button>
                        </div>
                      ` : ''}
                      ${cause.urls && cause.urls.length > 0 ? `
                        <div class="evo-diagnosed-urls">
                          <button class="evo-diagnosed-urls-toggle" data-cause-index="${index}" data-toggle-type="urls">
                            <svg class="evo-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                            View affected URLs
                          </button>
                          <div class="evo-diagnosed-urls-list" data-cause-index="${index}" style="display: none;">
                            ${cause.urls.map(url => `
                              <div class="evo-diagnosed-url">
                                <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : insight.possibleCauses && insight.possibleCauses.length > 0 ? `
              <div class="evo-insight-causes">
                <div class="evo-insight-causes-label">Possible Causes:</div>
                <ul class="evo-insight-causes-list">
                  ${insight.possibleCauses.map(cause => `<li>${cause}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${!isError && insight.recommendation ? `<div class="evo-insight-recommendation">→ ${insight.recommendation}</div>` : ''}
          </div>
        `;
      });
      insightsContainer.innerHTML = insightsHTML;
    } else {
      insightsContainer.innerHTML = '<div class="evo-no-insights">✓ No critical issues detected</div>';
    }
    
    // Show results, hide loading
    document.getElementById('analysis-loading').style.display = 'none';
    document.getElementById('analysis-results').style.display = 'block';
    
    // Add event listener for retry button if present
    setTimeout(() => {
      const retryBtn = insightsContainer.querySelector('.btn-retry-analysis');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          const stepNum = parseInt(this.dataset.step);
          console.log(`🔄 Retry button clicked for step ${stepNum}`);
          
          // Close modal
          modal.style.display = 'none';
          
          // Calculate page number
          const pageNum = stepNum + 1;
          
          // Clear cached data
          delete evoDataCache[stepNum];
          
          // Retry with force refresh
          fetchAndDisplayEVOData(pageNum, true);
        });
        
        // Add hover effect
        retryBtn.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.boxShadow = '0 4px 12px rgba(255, 107, 0, 0.4)';
        });
        
        retryBtn.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });
      }
    }, 0);
    
    // Hide Execution Assist button (not needed for this step)
    const executionAssistBtn = document.getElementById('analysis-execution-assist-btn');
    if (executionAssistBtn) {
      executionAssistBtn.style.display = 'none';
    }
    
    // Show modal
    modal.style.display = 'flex';
  }

  /**
   * Format metric label for display
   * @param {string} key - Metric key in camelCase
   * @returns {string} Formatted label
   */
  function formatMetricLabel(key) {
    // Custom labels for specific metrics
    const customLabels = {
      'underperformingPages': 'Low Perf. Pages'
    };
    
    if (customLabels[key]) {
      return customLabels[key];
    }
    
    // Convert camelCase to Title Case, preserving acronyms like URLs
    const label = key
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')           // Insert space between lowercase/digit and uppercase
      .replace(/([A-Z]+)([A-Z][a-z]{2,})/g, '$1 $2')   // Insert space before word after acronym (requires 2+ lowercase)
      .trim();
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  /**
   * Format metric value for display
   */
  function formatMetricValue(value) {
    if (typeof value === 'number') {
      if (value > 100) {
        return value.toLocaleString();
      }
      return value;
    }
    return value;
  }

  /**
   * Close Analysis Modal
   */
  function closeAnalysisModal() {
    const modal = document.getElementById('analysis-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Close modal when clicking X button
  document.addEventListener('click', function(e) {
    if (e.target.closest('.analysis-modal-close')) {
      closeAnalysisModal();
    }
  });

  // Close modal when clicking outside
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('analysis-modal');
    if (e.target === modal) {
      closeAnalysisModal();
    }
  });

  // Toggle URL lists in diagnosed causes (event delegation)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.evo-diagnosed-urls-toggle')) {
      e.preventDefault();
      const button = e.target.closest('.evo-diagnosed-urls-toggle');
      const causeIndex = button.dataset.causeIndex;
      const toggleType = button.dataset.toggleType; // 'urls' or 'keywords'
      const modal = document.getElementById('analysis-modal');
      const urlsList = modal.querySelector(`.evo-diagnosed-urls-list[data-cause-index="${causeIndex}"]`);
      const icon = button.querySelector('.evo-toggle-icon');
      
      if (urlsList) {
        const isHidden = urlsList.style.display === 'none' || !urlsList.style.display;
        urlsList.style.display = isHidden ? 'block' : 'none';
        if (icon) {
          icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        
        // Update button text based on toggle type
        let newText;
        if (toggleType === 'keywords') {
          newText = isHidden ? 'Hide related keywords' : 'View related keywords';
        } else {
          newText = isHidden ? 'Hide URLs' : 'View affected URLs';
        }
        
        // Remove all existing text nodes to prevent duplication
        const childNodes = Array.from(button.childNodes);
        childNodes.forEach(node => {
          if (node.nodeType === 3) { // Text node
            button.removeChild(node);
          }
        });
        
        // Add the new text node
        button.appendChild(document.createTextNode(newText));
      }
    }
  });

  // Event delegation for Execution Assist buttons (handles both static and dynamically created buttons)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-execution-assist')) {
      e.preventDefault();
      handleExecutionAssist(e);
    }
  });

  // ========================================
  // Global API for Manual Control
  // ========================================
  window.unlockNextSprintCircle = function() {
    if (sprintState.currentCircle !== null) {
      unlockNextCircle(sprintState.currentCircle);
      closeSprintCard();
    } else {
      console.log('No active sprint circle to unlock from');
    }
  };

  window.loadSprintProgress = loadSprintProgress; // Expose for external calls

  window.sprintPlanState = sprintState; // For debugging

  console.log('✓ Sprint Plan system initialized');
});
