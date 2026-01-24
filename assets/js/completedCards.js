/**
 * Completed Sprint Cards Archive and Detail Modal
 * Handles loading, rendering, and displaying completed sprint cards
 */

// Initialize API client
const completedCardsAPI = new KineticAPI();

/**
 * Format duration from milliseconds to readable string
 */
function formatDuration(durationMs) {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Load and display completed cards archive
 * @param {number|null} propertyId - Optional property filter
 */
async function loadCompletedCardsArchive(propertyId = null) {
  try {
    const cards = await completedCardsAPI.getCompletedSprintCards(propertyId);
    
    const archiveSection = document.querySelector('.completed-cards-section');
    const gridContainer = document.querySelector('.completed-cards-grid');
    
    if (!archiveSection || !gridContainer) {
      console.warn('Archive section not found in DOM');
      return;
    }
    
    if (cards.length === 0) {
      archiveSection.style.display = 'none';
      console.log('No completed cards to display');
      return;
    }
    
    renderCompletedCardsGrid(cards, gridContainer);
    archiveSection.style.display = 'block';
    
    console.log(`✓ Loaded ${cards.length} completed cards`);
  } catch (error) {
    console.error('Error loading completed cards archive:', error);
  }
}

/**
 * Render completed cards grid
 * @param {Array} cards - Array of completed cards
 * @param {HTMLElement} container - Grid container element
 */
function renderCompletedCardsGrid(cards, container) {
  container.innerHTML = ''; // Clear existing content
  
  cards.forEach(card => {
    const tile = createCardTile(card);
    container.appendChild(tile);
  });
}

/**
 * Create card tile element
 * @param {Object} card - Card data
 * @returns {HTMLElement} - Card tile element
 */
function createCardTile(card) {
  const tile = document.createElement('div');
  tile.className = 'completed-card-tile';
  tile.setAttribute('data-card-id', card.id);
  
  const completionDate = formatDate(card.completed_at);
  const duration = formatDuration(card.duration_ms);
  const sprintLabel = `Sprint ${card.sprint_index + 1}`;
  
  tile.innerHTML = `
    <div class="completed-card-header">
      <span class="card-title">${card.display_name}</span>
      <span class="completion-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    </div>
    <div class="card-meta">
      <span class="sprint-label">${sprintLabel}</span>
      <span class="card-date">${completionDate}</span>
    </div>
    <div class="card-stats">
      <span class="stat-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        ${card.completed_steps_count}/${card.total_steps} Steps
      </span>
      <span class="stat-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${duration}
      </span>
    </div>
  `;
  
  // Add click event to show detail modal
  tile.addEventListener('click', () => showCardDetailsModal(card.id));
  
  return tile;
}

/**
 * Show card details modal
 * @param {number} cardId - Card ID to display
 */
async function showCardDetailsModal(cardId) {
  try {
    const card = await completedCardsAPI.getCompletedCardDetails(cardId);
    
    if (!card) {
      console.error('Card details not found');
      return;
    }
    
    renderModalContent(card);
    
    const modal = document.querySelector('.sprint-card-modal');
    modal.style.display = 'flex';
    
    // Fade in animation
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
    
    console.log(`✓ Showing details for card ${cardId}`);
  } catch (error) {
    console.error('Error loading card details:', error);
    alert('Failed to load card details. Please try again.');
  }
}

/**
 * Render modal content with card details
 * @param {Object} card - Card details
 */
function renderModalContent(card) {
  const modal = document.querySelector('.sprint-card-modal');
  
  // Update title
  const titleElement = modal.querySelector('.modal-title');
  titleElement.textContent = card.display_name;
  
  // Update meta info
  const dateElement = modal.querySelector('.completion-date');
  dateElement.textContent = `Completed: ${formatDate(card.completed_at)}`;
  
  const durationElement = modal.querySelector('.completion-duration');
  durationElement.textContent = `Duration: ${formatDuration(card.duration_ms)}`;
  
  // Render steps timeline
  const timelineContainer = modal.querySelector('.steps-timeline');
  timelineContainer.innerHTML = '';
  
  card.steps.forEach((step, index) => {
    const isLastStep = index === card.steps.length - 1;
    
    const stepElement = document.createElement('div');
    stepElement.className = 'timeline-step';
    stepElement.innerHTML = `
      <div class="timeline-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="timeline-content">
        <div class="timeline-step-name">${step.step_name}</div>
        <div class="timeline-step-desc">${step.step_description || ''}</div>
        <div class="timeline-step-time">${formatDate(step.completed_at)}</div>
      </div>
    `;
    
    timelineContainer.appendChild(stepElement);
    
    // Add connector line between steps
    if (!isLastStep) {
      const connector = document.createElement('div');
      connector.className = 'timeline-connector';
      timelineContainer.appendChild(connector);
    }
  });
  
  // Update summary stats
  const statsContainer = modal.querySelector('.card-summary-stats');
  statsContainer.innerHTML = `
    <div class="summary-stat">
      <span class="stat-label">Sprint Index</span>
      <span class="stat-value">${card.sprint_index + 1}</span>
    </div>
    <div class="summary-stat">
      <span class="stat-label">Property</span>
      <span class="stat-value">${card.site_url || 'N/A'}</span>
    </div>
    <div class="summary-stat">
      <span class="stat-label">Signal Strength</span>
      <span class="stat-value">${card.progress_percentage}%</span>
    </div>
  `;
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.querySelector('.sprint-card-modal');
  modal.style.opacity = '0';
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
  
  console.log('✓ Modal closed');
}

/**
 * Initialize modal event listeners
 */
function initModalListeners() {
  const modal = document.querySelector('.sprint-card-modal');
  const closeBtn = modal.querySelector('.modal-close');
  const overlay = modal.querySelector('.modal-overlay');
  
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  // Overlay click
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }
  
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
  
  console.log('✓ Modal listeners initialized');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initModalListeners();
  console.log('✓ Completed cards module initialized');
});

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.loadCompletedCardsArchive = loadCompletedCardsArchive;
}
