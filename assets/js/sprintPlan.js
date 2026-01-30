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
    2: 'future_card_type',
    3: 'future_card_type'
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
   * Get Step Name from Step Number
   */
  function getStepName(stepNumber) {
    const stepNames = {
      1: 'Global Identity',
      2: 'Territory Claim',
      3: 'Commercial Definition',
      4: 'Reputation Sync'
    };
    return stepNames[stepNumber] || `Step ${stepNumber}`;
  }

  /**
   * Get Step Description from Step Number
   */
  function getStepDescription(stepNumber) {
    const descriptions = {
      1: 'Hard-code brand DNA (Logo, Phone, Social Profiles) into site pages',
      2: 'Define exact GEO Circle for each city serviced',
      3: 'Define products/services with price ranges',
      4: 'Aggregate 5-star reviews into CollectionPage format'
    };
    return descriptions[stepNumber] || '';
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
    const currentPage = event.target.closest('.sprint-card-page');
    const pageNumber = parseInt(currentPage.getAttribute('data-page'));
    
    console.log(`Execution Assist clicked for page ${pageNumber}`);
    
    if (window.ExecutionAssist) {
      window.ExecutionAssist.openModal(currentPage);
    } else {
      console.error('ExecutionAssist module not loaded');
    }
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
      } else {
        page.style.display = 'none';
      }
    });
  }

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
