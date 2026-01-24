/**
 * Sprint Plan Card System
 * Handles interactive sprint circle buttons and multi-page action cards
 */

document.addEventListener('DOMContentLoaded', () => {
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
    progressPercentages: [0, 0, 35, 65, 95, 95] // Pages 1-6
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
   * Show Sprint Plan Card
   * Display the card container and load the appropriate protocol
   */
  function showSprintCard(sprintIndex) {
    sprintState.currentCircle = sprintIndex;
    sprintState.currentPage = 1;
    
    // Reset to page 1
    showPage(1);
    
    // Display the card container
    cardContainer.style.display = 'block';
    
    // Smooth scroll to the card
    setTimeout(() => {
      cardContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    console.log(`✓ Showing sprint card for circle ${sprintIndex}`);
  }

  /**
   * Navigate Between Card Pages
   */
  function navigateToNextPage() {
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
    // Find all progress lines in currently visible page
    const visiblePage = document.querySelector('.sprint-card-page[style*="display: flex"]');
    if (visiblePage) {
      const progressLine = visiblePage.querySelector('.progress-line');
      if (progressLine) {
        progressLine.style.setProperty('--progress-fill', `${percentage}%`);
      }
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
   * Advances to completion status page
   */
  function handleComplete() {
    console.log('Complete button clicked - advancing to status page');
    navigateToNextPage(); // Go to page 6
    
    // Note: Unlock is manual for now - can be triggered via console:
    // window.unlockNextSprintCircle()
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

  // Execution Assist buttons (Placeholder - no functionality yet)
  executionAssistBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      console.log('Execution Assist clicked - placeholder for future functionality');
      // TODO: Add instruction display/copy functionality
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
