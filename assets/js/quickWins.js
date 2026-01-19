// quickWins.js - Dynamic card generation for SEO Quick Fixes module

/**
 * Generate problem description based on keyword metrics
 */
function generateProblemDescription(item) {
    const { position, impressions, clicks, ctr } = item;
    
    // Generate contextual problem statement
    if (position >= 6 && position <= 10) {
        return `This keyword is ranking on page 1 (position ${position}) with ${impressions} impressions and ${clicks} clicks (${ctr} CTR). Improving your title and meta description could significantly increase traffic.`;
      } else if (position > 10 && position <= 15) {
        return `Currently ranking on page 2 (position ${position}) with ${impressions} monthly impressions but only ${clicks} clicks. Minor on-page optimizations could push this to page 1 and capture more traffic.`;
      } else {
        return `Ranking at position ${position} with ${impressions} impressions and ${clicks} clicks. This keyword shows strong search volume - optimize content to move up rankings and capture more clicks.`;
      }
  }
  
  /**
   * Create a single SEO card element
   */
  function createQuickWinCard(item) {
    const card = document.createElement('article');
    card.className = 'seo-card';
    
    const problemText = generateProblemDescription(item);
    
    card.innerHTML = `
      <h3 class="card-title">${item.keyword}</h3>
      <div class="card-warning">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 22H22L12 2Z" fill="#E88B60" stroke="#E88B60" stroke-width="2" stroke-linejoin="round"/>
          <path d="M12 16V18" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 8V13" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>${problemText}</p>
      </div>
      <div class="card-metrics">
        <div class="metric-row">Rank: <span class="metric-var">${item.position}</span></div>
        <div class="metric-row">Page: <span class="metric-var">${truncateUrl(item.page)}</span></div>
        <div class="metric-row">Impressions: <span class="metric-var">${item.impressions.toLocaleString()}</span></div>
        <div class="metric-row">Clicks: <span class="metric-var">${item.clicks}</span></div>
      </div>
      <button class="btn-quick-fix" data-keyword="${item.keyword}" data-page="${item.page}">
        Quick Fix
      </button>
    `;
    
    return card;
  }
  
  /**
   * Truncate long URLs for display
   */
  function truncateUrl(url) {
    const maxLength = 40;
    if (url.length <= maxLength) return url;
    
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(0, maxLength) + '...';
    } catch {
      return url.substring(0, maxLength) + '...';
    }
  }

  
  // Store the full dataset globally so we can re-sort
  let quickWinsDataset = [];
  let currentSortMode = 'impressions'; // 'impressions' or 'rank'
/**
 * Populate the Quick Wins module with dynamic cards
 */
function populateQuickWinsCards(quickWinsData) {

    // Store dataset for re-sorting
  quickWinsDataset = quickWinsData;
  // Find the SEO Quick Fixes module by its title, then get its card-track
  const modules = document.querySelectorAll('.module-container');
  let cardTrack = null;
  
  for (const module of modules) {
    const title = module.querySelector('.module-title');
    if (title && title.textContent.trim() === 'SEO Quick Fixes') {
      cardTrack = module.querySelector('.card-track');
      break;
    }
  }
  
  if (!cardTrack) {
    console.error('Card track container not found for SEO Quick Fixes module');
    console.log('Available modules:', modules.length);
    return;
  }

    // Render cards with current sort
    renderQuickWinsCards(cardTrack, quickWinsData);
  
    // Attach event listeners to Quick Fix buttons
    attachQuickFixListeners();
    
    // Set up sort toggle button
    setupSortToggle();
}

/**
 * Render cards to the DOM
 */
function renderQuickWinsCards(cardTrack, data) {
    // Clear existing cards
    cardTrack.innerHTML = '';
    
    // Generate cards from data
    if (data && data.length > 0) {
      data.forEach(item => {
        const card = createQuickWinCard(item);
        cardTrack.appendChild(card);
      });
      
      console.log(`✓ Generated ${data.length} Quick Win cards (sorted by ${currentSortMode})`);
    } else {
      // Show empty state
      cardTrack.innerHTML = `
        <div class="empty-state">
          <p>No quick win opportunities found at this time.</p>
          <p>Check back after your site accumulates more Search Console data.</p>
        </div>
      `;
    }
  }
  
  /**
   * Sort the dataset based on current mode
   */
  function sortQuickWins(data, mode) {
    const sorted = [...data]; // Create a copy
    
    if (mode === 'impressions') {
      // Sort by impressions descending (highest first)
      sorted.sort((a, b) => b.impressions - a.impressions);
    } else if (mode === 'rank') {
      // Sort by position ascending (best ranking first)
      sorted.sort((a, b) => a.position - b.position);
    }
    
    return sorted;
  }
  
  /**
   * Set up the sort toggle button
   */
  function setupSortToggle() {
    const toggleBtn = document.getElementById('sort-toggle');
    
    if (!toggleBtn) {
      console.warn('Sort toggle button not found');
      return;
    }
    
    toggleBtn.addEventListener('click', () => {
      // Toggle sort mode
      currentSortMode = currentSortMode === 'impressions' ? 'rank' : 'impressions';
      
      // Update button label
      const label = toggleBtn.querySelector('.sort-label');
      if (label) {
        label.textContent = currentSortMode === 'impressions' 
          ? 'Sort: High Volume' 
          : 'Sort: Best Rank';
      }
      
      // Re-sort and re-render
      const sortedData = sortQuickWins(quickWinsDataset, currentSortMode);
      
      // Find card track
      const modules = document.querySelectorAll('.module-container');
      for (const module of modules) {
        const title = module.querySelector('.module-title');
        if (title && title.textContent.trim() === 'SEO Quick Fixes') {
          const cardTrack = module.querySelector('.card-track');
          if (cardTrack) {
            renderQuickWinsCards(cardTrack, sortedData);
            attachQuickFixListeners(); // Re-attach listeners to new buttons
          }
          break;
        }
      }
    });
  }
  
  /**
   * Attach click handlers to Quick Fix buttons
   */
  function attachQuickFixListeners() {
    const buttons = document.querySelectorAll('.btn-quick-fix');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const keyword = e.target.dataset.keyword;
        const page = e.target.dataset.page;
        handleQuickFix(keyword, page);
      });
    });
  }
  
  /**
   * Handle Quick Fix button click
   */
  function handleQuickFix(keyword, page) {
    console.log(`Quick Fix clicked for keyword: ${keyword}, page: ${page}`);
    // TODO: Implement quick fix modal/workflow
    alert(`Quick Fix for "${keyword}" on ${page}\n\nThis will open the optimization workflow.`);
  }
  
  // Export functions
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { populateQuickWinsCards, createQuickWinCard };
  }