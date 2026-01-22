console.log('🔧 buttons.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 buttons.js DOMContentLoaded fired');
  // 1. Select ALL slider wrappers on the page (Module 1, Module 2, etc.)
  const allSliders = document.querySelectorAll('.slider-wrapper');

  // 2. Iterate through each slider individually
  allSliders.forEach(sliderWrapper => {
    
    // Scope variables to THIS specific slider instance
    const track = sliderWrapper.querySelector('.card-track');
    const prevButton = sliderWrapper.querySelector('.nav-arrow[aria-label="Previous"]');
    const nextButton = sliderWrapper.querySelector('.nav-arrow[aria-label="Next"]');

    // Safety check: ensure all parts exist in this wrapper before adding logic
    if (!track || !prevButton || !nextButton) return;

    // 3. Dynamic Scroll Calculation
    // We calculate this specific track's card width to support different card types
    const getScrollAmount = () => {
      const firstCard = track.firstElementChild; // Works for .seo-card OR .market-card
      if (!firstCard) return 300; // Fallback if empty

      const cardWidth = firstCard.offsetWidth;
      
      // Get the actual gap from CSS (handles the 24px gap defined in layout.css)
      const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
      
      return cardWidth + gap;
    };

    // 4. Attach Event Listeners
    nextButton.addEventListener('click', () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: 'smooth'
      });
    });

    prevButton.addEventListener('click', () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
  });

  // ========================================
  // Progress Grid Modal Logic
  // ========================================

  const progressModal = document.getElementById('progress-grid-modal');
  const progressGrid = document.getElementById('progress-grid');
  const stickyQuickFixBtn = document.getElementById('sticky-quick-fix');
  const modalCloseBtn = progressModal?.querySelector('.progress-modal-close');

  // Debug logging
  console.log('Progress Modal Elements:', {
    progressModal: !!progressModal,
    progressGrid: !!progressGrid,
    stickyQuickFixBtn: !!stickyQuickFixBtn,
    modalCloseBtn: !!modalCloseBtn
  });

  // Initialize the grid with 72 cards (8x9)
  function initializeProgressGrid() {
    if (!progressGrid) {
      console.error('Progress grid element not found');
      return;
    }
    
    progressGrid.innerHTML = '';
    
    for (let i = 0; i < 72; i++) {
      const card = document.createElement('div');
      card.className = 'progress-grid-card';
      card.dataset.index = i;
      progressGrid.appendChild(card);
    }
  }

  // Update the grid to show completed cards
  function updateProgressGrid(completedCount) {
    if (!progressGrid) return;
    
    const cards = progressGrid.querySelectorAll('.progress-grid-card');
    
    // Reset all cards first
    cards.forEach(card => card.classList.remove('completed'));
    
    // Mark the first N cards as completed
    for (let i = 0; i < Math.min(completedCount, 72); i++) {
      cards[i].classList.add('completed');
    }
  }

  // Open the modal
  function openProgressModal() {
    console.log('openProgressModal called, progressModal exists:', !!progressModal);
    if (!progressModal) {
      console.error('Progress modal element not found');
      return;
    }
    
    // Count the number of cards in SEO Quick Fixes module
    const quickFixModule = Array.from(document.querySelectorAll('.module-container'))
      .find(module => {
        const title = module.querySelector('.module-title');
        return title && title.textContent.trim() === 'SEO Quick Fixes';
      });
    
    let completedCount = 0;
    if (quickFixModule) {
      const cardTrack = quickFixModule.querySelector('.card-track');
      const cards = cardTrack?.querySelectorAll('.seo-card, .cannibalization-card');
      completedCount = cards ? cards.length : 0;
    }
    
    // Update the grid with the count
    updateProgressGrid(completedCount);
    
    progressModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close the modal
  function closeProgressModal() {
    if (!progressModal) return;
    
    progressModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Initialize the grid on page load
  initializeProgressGrid();

  // Attach event listeners
  if (stickyQuickFixBtn) {
    console.log('Attaching click listener to sticky quick fix button');
    stickyQuickFixBtn.addEventListener('click', (e) => {
      console.log('Sticky quick fix button clicked!', e);
      openProgressModal();
    });
  } else {
    console.error('Sticky quick fix button not found');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProgressModal);
  }

  // Close modal when clicking outside the content
  if (progressModal) {
    progressModal.addEventListener('click', (e) => {
      if (e.target === progressModal) {
        closeProgressModal();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && progressModal?.classList.contains('active')) {
      closeProgressModal();
    }
  });

  // Expose update function globally for use after calibration
  window.updateProgressGrid = updateProgressGrid;
});