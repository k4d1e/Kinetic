/**
 * Sprint Plan Card System
 * Handles interactive sprint circle buttons and multi-page action cards
 */

document.addEventListener('DOMContentLoaded', () => {
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
    1: 'looms_gap_analysis',
    2: 'future_card_type',
    3: 'future_card_type'
  };
  
  // Current active card state
  let currentCardType = null;
  let loomsGapData = null;
  
  // DOM Elements (these will be dynamically selected based on card type)
  const sprintCircles = document.querySelectorAll('.sprint-circle');
  let cardContainer = null;
  let cardPages = null;
  let continueBtn = null;
  let nextStepBtns = null;
  let completeBtn = null;
  let executionAssistBtns = null;

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
   * Load Sprint Progress from Database
   * Fetch and apply saved sprint circle states for the current property
   */
  async function loadSprintProgress(propertyId) {
    if (!propertyId) {
      console.log('No property ID provided, using default sprint state');
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
    
    // Select appropriate card container
    if (currentCardType === 'looms_gap_analysis') {
      cardContainer = document.querySelector('#looms-gap-card-container');
      // Don't load data yet - let user enter competitors first!
    } else {
      cardContainer = document.querySelector('.sprint-plan-card-container:not(#looms-gap-card-container)');
    }
    
    if (!cardContainer) {
      console.error(`Card container not found for type: ${currentCardType}`);
      return;
    }
    
    console.log('✓ Card container found:', cardContainer.id || cardContainer.className);
    
    // Update DOM element references for this card
    cardPages = cardContainer.querySelectorAll('.sprint-card-page');
    continueBtn = cardContainer.querySelector('.btn-continue');
    nextStepBtns = cardContainer.querySelectorAll('.btn-next-step');
    completeBtn = cardContainer.querySelector('.btn-complete');
    executionAssistBtns = cardContainer.querySelectorAll('.btn-execution-assist');
    
    console.log(`✓ Found ${cardPages.length} pages in card`);
    console.log(`✓ Continue button found:`, !!continueBtn);
    
    // Attach event listeners for this card's buttons
    attachCardEventListeners();
    
    // Reset to page 1
    showPage(1);
    
    // Display the card container
    cardContainer.style.display = 'block';
    
    // Force proper positioning for Loom's Gap card (override CSS)
    if (currentCardType === 'looms_gap_analysis') {
      cardContainer.style.cssText = `
        display: block !important;
        margin-left: auto !important;
        margin-right: auto !important;
        max-width: 900px !important;
        padding: 20px !important;
        position: relative !important;
        left: 0 !important;
        transform: none !important;
        background-color: #ff00ff !important;
        border: 5px solid #00ff00 !important;
        min-height: 600px !important;
        height: auto !important;
        z-index: 10000 !important;
        width: 900px !important;
      `;
      
      // Also fix inner card
      const innerCard = cardContainer.querySelector('.sprint-plan-card');
      if (innerCard) {
        innerCard.style.cssText = `
          max-width: none !important;
          max-height: none !important;
          min-height: 600px !important;
          width: 100% !important;
          height: auto !important;
        `;
      }
      
      // Fix pages
      const pages = cardContainer.querySelectorAll('.sprint-card-page');
      pages.forEach(page => {
        if (page.getAttribute('data-page') === '1') {
          page.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            min-height: 500px !important;
            height: auto !important;
          `;
        }
      });
      
      console.log('✓ Loom\'s Gap card dimensions forced with !important');
    }
    
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
   * Load and populate Loom's Gap Analysis data
   */
  async function loadLoomsGapData() {
    if (!sprintState.currentPropertyId) {
      console.error('No property ID available for Loom\'s Gap Analysis');
      alert('Please select a property first');
      return;
    }
    
    try {
      console.log('🧵 Fetching Loom\'s Gap Analysis data...');
      
      // Collect manual competitors from textarea
      const competitorTextarea = document.getElementById('manual-competitors');
      const competitorText = competitorTextarea ? competitorTextarea.value.trim() : '';
      const competitors = competitorText
        ? competitorText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
        : [];
      
      console.log(`📋 Manual competitors entered: ${competitors.length}`);
      if (competitors.length > 0) {
        console.log('   Competitors:', competitors.join(', '));
      }
      
      // Use the backend URL (port 8000, not 8080)
      const backendURL = window.kineticAPI ? window.kineticAPI.baseURL : 'http://localhost:8000';
      const response = await fetch(`${backendURL}/api/sprint-cards/looms-gap`, {
        method: 'POST',
        credentials: 'include', // Important for session cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: sprintState.currentPropertyId,
          refresh: false,
          country: 'us',
          competitors: competitors // Send manual competitors to backend
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load gap analysis');
      }
      
      loomsGapData = result.data;
      console.log('✓ Loom\'s Gap data loaded:', loomsGapData);
      
      // Populate the card with data
      populateLoomsGapCard(loomsGapData);
      
    } catch (error) {
      console.error('❌ Error loading Loom\'s Gap data:', error);
      alert('Failed to load gap analysis. Please try again.\n\nError: ' + error.message);
    }
  }
  
  /**
   * Populate Loom's Gap card with fetched data
   */
  function populateLoomsGapCard(data) {
    // Page 1: Summary stats
    const gapCount = document.getElementById('looms-gap-count');
    const starvation = document.getElementById('looms-starvation');
    if (gapCount) gapCount.textContent = data.totalGaps || 0;
    if (starvation) starvation.textContent = data.threadStarvation || 'MILD';
    
    // Page 2: Competitors table
    const competitorsTableBody = document.getElementById('competitors-table-body');
    if (competitorsTableBody && data.competitors) {
      competitorsTableBody.innerHTML = '';
      data.competitors.slice(0, 10).forEach((comp, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${idx + 1}</td>
          <td style="font-weight: 600;">${comp.domain}</td>
          <td>${comp.commonKeywords || 0}</td>
          <td>${comp.domainRating || 0}</td>
        `;
        competitorsTableBody.appendChild(row);
      });
    }
    
    // Page 3: Gap domains (high authority)
    const highAuthCount = document.getElementById('high-authority-count');
    const gapDomainsTableBody = document.getElementById('gap-domains-table-body');
    
    if (highAuthCount) {
      highAuthCount.textContent = data.highAuthorityGaps || 0;
    }
    
    if (gapDomainsTableBody && data.gapDomains) {
      gapDomainsTableBody.innerHTML = '';
      const highAuthGaps = data.gapDomains.filter(d => d.domainRating >= 50).slice(0, 20);
      highAuthGaps.forEach((gap) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600;">${gap.domain}</td>
          <td style="color: var(--color-accent-orange); font-weight: 700;">${gap.domainRating}</td>
          <td>${gap.competitorsLinkedCount}</td>
          <td style="color: var(--color-primary); font-weight: 700;">${gap.threadResonance}</td>
        `;
        gapDomainsTableBody.appendChild(row);
      });
    }
    
    // Page 4: Thread Resonance rankings
    const resonanceTableBody = document.getElementById('resonance-table-body');
    if (resonanceTableBody && data.gapDomains) {
      resonanceTableBody.innerHTML = '';
      data.gapDomains.slice(0, 20).forEach((gap, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 700; color: var(--color-accent-orange);">${idx + 1}</td>
          <td style="font-weight: 600;">${gap.domain}</td>
          <td style="color: var(--color-primary); font-weight: 700; font-size: 18px;">${gap.threadResonance}</td>
          <td>${gap.domainRating}</td>
          <td>${gap.competitorsLinkedCount}</td>
        `;
        resonanceTableBody.appendChild(row);
      });
    }
    
    // Page 5: Anchor patterns (simplified - showing top domains as examples)
    const anchorPatternsList = document.getElementById('anchor-patterns-list');
    if (anchorPatternsList && data.gapDomains) {
      anchorPatternsList.innerHTML = '';
      const topGaps = data.gapDomains.slice(0, 5);
      topGaps.forEach((gap) => {
        const patternCard = document.createElement('div');
        patternCard.style.cssText = 'padding: 15px; background: rgba(255,255,255,0.5); border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);';
        patternCard.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: var(--color-dark-blue); font-size: 15px; font-weight: 700;">${gap.domain}</h4>
          <p style="margin: 0; font-size: 13px; color: var(--color-dark-blue);">
            <strong>Links to:</strong> ${gap.competitorsLinked.join(', ')}
          </p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: var(--color-dark-blue);">
            <strong>Opportunity:</strong> Target with resource guides, comparison content, or tool pages
          </p>
        `;
        anchorPatternsList.appendChild(patternCard);
      });
    }
    
    console.log('✓ Loom\'s Gap card populated with data');
  }
  
  /**
   * Attach event listeners to current card's buttons
   */
  function attachCardEventListeners() {
    // Continue button (Page 1)
    if (continueBtn) {
      continueBtn.removeEventListener('click', navigateToNextPage); // Remove old listener
      
      // Special handling for Loom's Gap card: load data when clicking "Show Me The Gaps"
      if (currentCardType === 'looms_gap_analysis') {
        continueBtn.addEventListener('click', async () => {
          // Load the gap analysis data with the user's entered competitors
          await loadLoomsGapData();
          // If data loaded successfully, navigate to next page
          if (loomsGapData) {
            navigateToNextPage();
          }
        });
      } else {
        continueBtn.addEventListener('click', navigateToNextPage);
      }
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
    loomsGapData = null;
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
