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

  // DOM Elements
  const sprintCircles = document.querySelectorAll('.sprint-circle');
  const cardContainer = document.querySelector('.sprint-plan-card-container');
  const cardPages = document.querySelectorAll('.sprint-card-page');
  
  // Button Elements
  const continueBtn = document.querySelector('.btn-continue');
  const nextStepBtns = document.querySelectorAll('.btn-next-step');
  const completeBtn = document.querySelector('.btn-complete');
  const executionAssistBtns = document.querySelectorAll('.btn-execution-assist');

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
  function showSprintCard(sprintIndex) {
    sprintState.currentCircle = sprintIndex;
    sprintState.currentPage = 1;
    sprintState.startTime = Date.now();
    sprintState.completedSteps = [];
    
    // Get current property ID from global state (set during calibration)
    sprintState.currentPropertyId = window.currentPropertyId || null;
    
    // Reset to page 1
    showPage(1);
    
    // Display the card container
    cardContainer.style.display = 'block';
    
    // Smooth scroll to the card
    setTimeout(() => {
      cardContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    console.log(`✓ Showing sprint card for circle ${sprintIndex}`, {
      startTime: new Date(sprintState.startTime).toISOString(),
      propertyId: sprintState.currentPropertyId
    });
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
    cardContainer.style.display = 'none';
    sprintState.currentPage = 1;
    showPage(1);
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
      cardType: 'meta_surgeon_protocol',
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
  // Event Listeners
  // ========================================

  // Continue button (Page 1)
  if (continueBtn) {
    continueBtn.addEventListener('click', navigateToNextPage);
  }

  // Next Step buttons (Pages 2-4)
  nextStepBtns.forEach((btn) => {
    btn.addEventListener('click', navigateToNextPage);
  });

  // Complete button (Page 5)
  if (completeBtn) {
    completeBtn.addEventListener('click', handleComplete);
  }

  // Execution Assist buttons - Generate and show prompt
  executionAssistBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const currentPage = btn.closest('.sprint-card-page');
      const pageNumber = parseInt(currentPage.getAttribute('data-page'));
      
      console.log(`Execution Assist clicked for page ${pageNumber}`);
      
      // Use the executionAssist module to handle
      if (window.ExecutionAssist) {
        window.ExecutionAssist.openModal(currentPage);
      } else {
        console.error('ExecutionAssist module not loaded');
      }
    });
  });

  // Make instruction labels clickable
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

  window.sprintPlanState = sprintState; // For debugging

  console.log('✓ Sprint Plan system initialized');
});
