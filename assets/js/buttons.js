document.addEventListener('DOMContentLoaded', () => {
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

  // Initialize the grid with 72 cards (8x9)
  function initializeProgressGrid() {
    if (!progressGrid) return;
    
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
    if (!progressModal) return;
    
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
    stickyQuickFixBtn.addEventListener('click', openProgressModal);
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

  // ========================================
  // New Markets Modal Logic
  // ========================================

  const newMarketsModal = document.getElementById('new-markets-modal');
  const newMarketsList = document.getElementById('new-markets-list');
  const stickyNewMarketsBtn = document.getElementById('sticky-new-markets');
  const newMarketsCloseBtn = newMarketsModal?.querySelector('.new-markets-modal-close');

  // Populate the list with queries from untapped markets data
  function populateNewMarketsList() {
    if (!newMarketsList) return;
    
    // Clear existing items
    newMarketsList.innerHTML = '';
    
    // Get untapped markets data (limit to first 16 as per card generation pattern)
    const untappedMarketsData = window.untappedMarketsData || [];
    const displayData = untappedMarketsData.slice(0, 16);
    
    if (displayData.length === 0) {
      // Show empty state
      newMarketsList.innerHTML = `
        <div style="text-align: center; color: var(--color-dark-blue); padding: 40px;">
          <p style="font-size: 16px; font-weight: 700; margin-top: 2px;">No new markets data available yet.</p>
          <p style="font-size: 16px; font-weight: 700; margin-top: 2px;">Complete onboarding calibration to populate this data.</p>
        </div>
      `;
      return;
    }
    
    // Loop through each opportunity and extract keywords
    displayData.forEach(opportunity => {
      if (opportunity.keywords && Array.isArray(opportunity.keywords)) {
        opportunity.keywords.forEach(keyword => {
          // Create list item
          const listItem = document.createElement('div');
          listItem.className = 'new-markets-list-item';
          
          // Create blue card
          const card = document.createElement('div');
          card.className = 'new-markets-card';
          
          // Create query text with quotations
          const queryText = document.createElement('div');
          queryText.className = 'new-markets-query';
          queryText.textContent = `"${keyword}"`;
          
          // Append to list item
          listItem.appendChild(card);
          listItem.appendChild(queryText);
          
          // Append to list
          newMarketsList.appendChild(listItem);
        });
      }
    });
    
    console.log(`✓ New Markets modal populated with queries from ${displayData.length} opportunities`);
  }

  // Open the New Markets modal
  function openNewMarketsModal() {
    if (!newMarketsModal) return;
    
    // Populate the list with current data
    populateNewMarketsList();
    
    // Show modal
    newMarketsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close the New Markets modal
  function closeNewMarketsModal() {
    if (!newMarketsModal) return;
    
    newMarketsModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Attach event listeners for New Markets modal
  if (stickyNewMarketsBtn) {
    stickyNewMarketsBtn.addEventListener('click', openNewMarketsModal);
  }

  if (newMarketsCloseBtn) {
    newMarketsCloseBtn.addEventListener('click', closeNewMarketsModal);
  }

  // Close modal when clicking outside the content
  if (newMarketsModal) {
    newMarketsModal.addEventListener('click', (e) => {
      if (e.target === newMarketsModal) {
        closeNewMarketsModal();
      }
    });
  }

  // Close New Markets modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newMarketsModal?.classList.contains('active')) {
      closeNewMarketsModal();
    }
  });

  // Expose populate function globally for use after calibration
  window.populateNewMarketsList = populateNewMarketsList;

  /**
   * ============================================================
   * AI VISIBILITY MODAL
   * ============================================================
   */
  const aiVisibilityModal = document.getElementById('ai-visibility-modal');
  const aiVisibilityList = document.getElementById('ai-visibility-list');
  const stickyAIVisibilityBtn = document.getElementById('sticky-ai-visibility');
  const aiVisibilityCloseBtn = aiVisibilityModal?.querySelector('.ai-visibility-modal-close');

  // Populate the list with queries from AI visibility data
  function populateAIVisibilityList() {
    if (!aiVisibilityList) return;
    
    // Clear existing items
    aiVisibilityList.innerHTML = '';
    
    // Get AI visibility data (limit to first 16 as per card generation pattern)
    const aiVisibilityData = window.aiVisibilityData || [];
    const displayData = aiVisibilityData.slice(0, 16);
    
    if (displayData.length === 0) {
      // Show empty state
      aiVisibilityList.innerHTML = `
        <div style="text-align: center; color: var(--color-dark-blue); padding: 40px;">
          <p style="font-size: 16px; font-weight: 700; margin-top: 2px;">No AI visibility data available yet.</p>
          <p style="font-size: 16px; font-weight: 700; margin-top: 2px;">Complete onboarding calibration to populate this data.</p>
        </div>
      `;
      return;
    }
    
    // Loop through each opportunity and create list items
    displayData.forEach(opportunity => {
      if (opportunity.query) {
        // Create list item
        const listItem = document.createElement('div');
        listItem.className = 'ai-visibility-list-item';
        
        // Create blue card
        const card = document.createElement('div');
        card.className = 'ai-visibility-card';
        
        // Create query text with quotations
        const queryText = document.createElement('div');
        queryText.className = 'ai-visibility-query';
        queryText.textContent = `"${opportunity.query}"`;
        
        // Append to list item
        listItem.appendChild(card);
        listItem.appendChild(queryText);
        
        // Append to list
        aiVisibilityList.appendChild(listItem);
      }
    });
    
    console.log(`✓ AI Visibility modal populated with ${displayData.length} queries`);
  }

  // Open the AI Visibility modal
  function openAIVisibilityModal() {
    if (!aiVisibilityModal) return;
    
    // Populate the list with current data
    populateAIVisibilityList();
    
    // Show modal
    aiVisibilityModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close the AI Visibility modal
  function closeAIVisibilityModal() {
    if (!aiVisibilityModal) return;
    
    aiVisibilityModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Attach event listeners for AI Visibility modal
  if (stickyAIVisibilityBtn) {
    stickyAIVisibilityBtn.addEventListener('click', openAIVisibilityModal);
  }

  if (aiVisibilityCloseBtn) {
    aiVisibilityCloseBtn.addEventListener('click', closeAIVisibilityModal);
  }

  // Close modal when clicking outside the content
  if (aiVisibilityModal) {
    aiVisibilityModal.addEventListener('click', (e) => {
      if (e.target === aiVisibilityModal) {
        closeAIVisibilityModal();
      }
    });
  }

  // Close AI Visibility modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aiVisibilityModal?.classList.contains('active')) {
      closeAIVisibilityModal();
    }
  });

  // Expose populate function globally for use after calibration
  window.populateAIVisibilityList = populateAIVisibilityList;
});