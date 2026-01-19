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
   * Render all Module 1 cards (Quick Wins + Cannibalization)
   * @param {boolean} groupByType - If true, show cannibalization first, then quick wins
   */
  function renderAllModule1Cards(cardTrack, quickWins, cannibalization, groupByType = false) {
    // Clear existing cards
    cardTrack.innerHTML = '';
    
    const totalCards = quickWins.length + cannibalization.length;
    
    if (totalCards === 0) {
      // Show empty state
      cardTrack.innerHTML = `
        <div class="empty-state">
          <p>No SEO opportunities found at this time.</p>
          <p>Check back after your site accumulates more Search Console data.</p>
        </div>
      `;
      return;
    }
    
    if (groupByType) {
      // Type sort: Show Cannibalization cards first, then Quick Wins
      cannibalization.forEach(item => {
        const card = createCannibalizationCard(item);
        cardTrack.appendChild(card);
      });
      
      quickWins.forEach(item => {
        const card = createQuickWinCard(item);
        cardTrack.appendChild(card);
      });
      
      console.log(`✓ Grouped by type: ${cannibalization.length} Cannibalization + ${quickWins.length} Quick Wins`);
    } else {
      // Default: Mix cards maintaining their sort order
      quickWins.forEach(item => {
        const card = createQuickWinCard(item);
        cardTrack.appendChild(card);
      });
      
      cannibalization.forEach(item => {
        const card = createCannibalizationCard(item);
        cardTrack.appendChild(card);
      });
      
      console.log(`✓ Generated ${quickWins.length} Quick Win cards + ${cannibalization.length} Cannibalization cards`);
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
   * Create a cannibalization card element
   */
  function createCannibalizationCard(item) {
    const card = document.createElement('article');
    card.className = 'seo-card cannibalization-card';
    
    const { keyword, pages, pageCount } = item;
    
    // Get top 2 pages
    const page1 = pages[0];
    const page2 = pages[1];
    
    // Generate problem description
    const problemText = `This keyword has ${pageCount} pages competing for it, causing ranking volatility. Consolidate content or differentiate pages to fix this issue.`;
    
    card.innerHTML = `
      <h3 class="card-title">${keyword}</h3>
      <div class="card-warning card-cannibalization">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#E88B60" stroke="#E88B60" stroke-width="2"/>
          <path d="M12 7v6M12 16h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>${problemText}</p>
      </div>
      <div class="card-metrics">
        <div class="metric-row metric-label">Page 1:</div>
        <div class="metric-row metric-indent">Page: <span class="metric-var">${truncateUrl(page1.page)}</span></div>
        <div class="metric-row metric-indent">Rank: <span class="metric-var">${page1.position.toFixed(1)}</span></div>
        
        <div class="metric-row metric-label" style="margin-top: 5px;">Page 2:</div>
        <div class="metric-row metric-indent">Page: <span class="metric-var">${truncateUrl(page2.page)}</span></div>
        <div class="metric-row metric-indent">Rank: <span class="metric-var">${page2.position.toFixed(1)}</span></div>
      </div>
      <button class="btn-quick-fix btn-fix-cannibalization" data-keyword="${keyword}" data-page1="${page1.page}" data-page2="${page2.page}">
        Fix Cannibalization
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
  let cannibalizationDataset = [];
  let currentSortMode = 'impressions'; // 'impressions', 'rank', or 'type'
/**
 * Populate Module 1 with both Quick Wins and Cannibalization cards
 */
function populateModule1Cards(quickWinsData, cannibalizationData) {
  // Store datasets for re-sorting
  quickWinsDataset = quickWinsData || [];
  cannibalizationDataset = cannibalizationData || [];
  
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
    return;
  }
  
  // Merge and render all cards
  renderAllModule1Cards(cardTrack, quickWinsDataset, cannibalizationDataset);
  
  // Attach event listeners
  attachQuickFixListeners();
  
  // Set up sort toggle button
  setupSortToggle();
}

/**
 * Populate the Quick Wins module with dynamic cards (legacy function)
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
   * Sort the datasets based on current mode
   * @returns {Object} - Object with sorted quickWins and cannibalization arrays
   */
  function sortModule1Cards(quickWins, cannibalization, mode) {
    let sortedQuickWins = [...quickWins];
    let sortedCannibalization = [...cannibalization];
    
    if (mode === 'impressions') {
      // Sort Quick Wins by impressions descending (highest first)
      sortedQuickWins.sort((a, b) => b.impressions - a.impressions);
      // Sort Cannibalization by page count (most competing pages first)
      sortedCannibalization.sort((a, b) => b.pageCount - a.pageCount);
    } else if (mode === 'rank') {
      // Sort Quick Wins by position ascending (best ranking first)
      sortedQuickWins.sort((a, b) => a.position - b.position);
      // Sort Cannibalization by best ranking page position
      sortedCannibalization.sort((a, b) => a.pages[0].position - b.pages[0].position);
    } else if (mode === 'type') {
      // No special sorting within each type, just return as-is
      // Cards will be rendered with Cannibalization first, then Quick Wins
    }
    
    return { quickWins: sortedQuickWins, cannibalization: sortedCannibalization };
  }
  
  /**
   * Sort the dataset based on current mode (legacy - for Quick Wins only)
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
      // Cycle through sort modes: impressions -> rank -> type -> impressions
      if (currentSortMode === 'impressions') {
        currentSortMode = 'rank';
      } else if (currentSortMode === 'rank') {
        currentSortMode = 'type';
      } else {
        currentSortMode = 'impressions';
      }
      
      // Update button label
      const label = toggleBtn.querySelector('.sort-label');
      if (label) {
        if (currentSortMode === 'impressions') {
          label.textContent = 'Sort: High Volume';
        } else if (currentSortMode === 'rank') {
          label.textContent = 'Sort: Best Rank';
        } else {
          label.textContent = 'Sort: Type';
        }
      }
      
      // Re-sort and re-render both datasets
      const sorted = sortModule1Cards(quickWinsDataset, cannibalizationDataset, currentSortMode);
      
      // Find card track
      const modules = document.querySelectorAll('.module-container');
      for (const module of modules) {
        const title = module.querySelector('.module-title');
        if (title && title.textContent.trim() === 'SEO Quick Fixes') {
          const cardTrack = module.querySelector('.card-track');
          if (cardTrack) {
            // Render based on sort mode
            if (currentSortMode === 'type') {
              // Cannibalization first, then Quick Wins
              renderAllModule1Cards(cardTrack, sorted.quickWins, sorted.cannibalization, true);
            } else {
              // Mixed based on sort criteria
              renderAllModule1Cards(cardTrack, sorted.quickWins, sorted.cannibalization, false);
            }
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
        
        // Check if it's a cannibalization button
        if (e.target.classList.contains('btn-fix-cannibalization')) {
          const page1 = e.target.dataset.page1;
          const page2 = e.target.dataset.page2;
          handleCannibalizationFix(keyword, page1, page2);
        } else {
          // Regular Quick Fix button
          const page = e.target.dataset.page;
          handleQuickFix(keyword, page);
        }
      });
    });
  }
  
  /**
   * Handle Quick Fix button click
   */
  function handleQuickFix(keyword, page) {
    // Find the item data from the dataset
    const item = quickWinsDataset.find(i => i.keyword === keyword && i.page === page);
    
    if (!item) {
      console.error('Item not found for Quick Fix');
      return;
    }
    
    // Generate workflow steps based on position
    const steps = generateWorkflowSteps(item);
    
    // Open modal with workflow
    openQuickFixModal(item, steps, 'quick-win');
  }
  
  /**
   * Handle Fix Cannibalization button click
   */
  function handleCannibalizationFix(keyword, page1, page2) {
    // Find the item data from the cannibalization dataset
    const item = cannibalizationDataset.find(i => i.keyword === keyword);
    
    if (!item) {
      console.error('Cannibalization item not found');
      return;
    }
    
    // Generate cannibalization-specific workflow steps
    const steps = generateCannibalizationWorkflowSteps(item);
    
    // Open modal with workflow
    openQuickFixModal(item, steps, 'cannibalization');
  }
  
  /**
   * Generate workflow steps based on keyword position
   */
  function generateWorkflowSteps(item) {
    const { keyword, position, impressions, clicks, page } = item;
    
    if (position >= 6 && position <= 10) {
      // Page 1 - Focus on CTR optimization
      return [
        {
          title: "Optimize Title Tag",
          description: `Your page ranks well but CTR is low (${clicks} clicks from ${impressions} impressions). Update your title to include "${keyword}" early and make it compelling.`,
          example: `Current title should:\n• Include "${keyword}" in first 60 characters\n• Add power words like "Expert," "Best," or "Guide"\n• Include year or "2026" for freshness`,
          action: "Review title tag",
          actionLabel: "📝 Open Page to Edit Title"
        },
        {
          title: "Enhance Meta Description",
          description: `Write a compelling meta description that includes "${keyword}" and a clear call-to-action to improve CTR.`,
          example: `Template:\n"[Action Verb] ${keyword} [benefit]. [Unique value prop]. [CTA like 'Get Quote' or 'Learn More']"`,
          action: "edit-meta",
          actionLabel: "✍️ Edit Meta Description"
        },
        {
          title: "Add Rich Snippets",
          description: `Implement schema markup to stand out in search results with star ratings, prices, or FAQs.`,
          example: `Recommended schema types:\n• FAQ schema\n• Review/Rating schema\n• HowTo schema\n• Local Business schema`,
          action: "add-schema",
          actionLabel: "🔧 View Schema Code"
        },
        {
          title: "Monitor & Test",
          description: `Track CTR improvements over the next 2-3 weeks. A 1-2% CTR increase can mean ${Math.round(impressions * 0.015)} more clicks monthly.`,
          action: "monitor",
          actionLabel: "📊 Set Up Tracking"
        }
      ];
    } else if (position > 10 && position <= 15) {
      // Page 2 - Focus on content + authority
      return [
        {
          title: "Audit Content Quality",
          description: `Compare your page to the top 3 results for "${keyword}". Identify what topics they cover that you don't.`,
          example: `Check competitors for:\n• Word count (aim for 1500+ words)\n• H2/H3 heading structure\n• Images and media\n• Unique insights or data`,
          action: "analyze",
          actionLabel: "🔍 Analyze Top Competitors"
        },
        {
          title: "Expand Content",
          description: `Add 400-600 words covering missing topics. Include "${keyword}" naturally 4-6 times throughout the content.`,
          example: `Content to add:\n• Answer related questions\n• Add "How to" sections\n• Include case studies or examples\n• Add FAQ section`,
          action: "expand",
          actionLabel: "📝 Get Content Outline"
        },
        {
          title: "Build Internal Links",
          description: `Link from 3-5 relevant pages on your site using "${keyword}" or related phrases as anchor text.`,
          example: `Look for pages about:\n• Related services/products\n• Blog posts on similar topics\n• Category/hub pages\n• Your homepage`,
          action: "internal-links",
          actionLabel: "🔗 Find Linkable Pages"
        },
        {
          title: "Improve Technical SEO",
          description: `Fix technical issues that may be holding you back: page speed, mobile-friendliness, and proper heading structure.`,
          example: `Technical checklist:\n• Page loads in under 3 seconds\n• Mobile-responsive design\n• Proper H1, H2, H3 hierarchy\n• Images have alt text`,
          action: "technical",
          actionLabel: "⚡ Run Technical Audit"
        }
      ];
    } else {
      // Lower page 2 - Comprehensive optimization
      return [
        {
          title: "Keyword Targeting Review",
          description: `Ensure "${keyword}" appears in key locations: Title tag, H1, first paragraph, and naturally throughout (5-7 times).`,
          example: `Keyword placement:\n✓ Title tag (within first 60 chars)\n✓ H1 heading\n✓ First 100 words of content\n✓ At least one H2\n✓ Image alt text\n✓ URL slug`,
          action: "keywords",
          actionLabel: "🎯 Analyze Keyword Usage"
        },
        {
          title: "Create Comprehensive Content",
          description: `Add in-depth content targeting 1800+ words. Cover all aspects of "${keyword}" that users might be searching for.`,
          example: `Content sections to include:\n• What is ${keyword}?\n• Benefits/Features\n• How-to guide\n• Common questions (FAQ)\n• Comparisons\n• Next steps/CTA`,
          action: "content",
          actionLabel: "📄 Get Full Content Outline"
        },
        {
          title: "Fix Technical Issues",
          description: `Address all technical SEO issues: page speed, mobile optimization, structured data, and crawlability.`,
          example: `Priority fixes:\n• Optimize images (compress & lazy load)\n• Remove render-blocking resources\n• Add structured data markup\n• Fix broken links\n• Ensure HTTPS`,
          action: "technical-full",
          actionLabel: "🔧 View Full Technical Checklist"
        },
        {
          title: "Build Authority",
          description: `Get 3-5 quality backlinks from relevant sites. Focus on editorial links from industry blogs or resource pages.`,
          example: `Link building strategies:\n• Guest posting\n• Resource page outreach\n• Broken link building\n• Create link-worthy content\n• Local citations (if local)`,
          action: "backlinks",
          actionLabel: "🔗 View Link Building Guide"
        },
        {
          title: "Track & Iterate",
          description: `Monitor rankings weekly. With consistent effort, expect to see movement in 4-8 weeks. Keep optimizing based on results.`,
          example: `Set up tracking:\n• Weekly rank checks\n• Monthly traffic review\n• Competitor monitoring\n• User engagement metrics\n• Conversion tracking`,
          action: "tracking",
          actionLabel: "📈 Set Up Comprehensive Tracking"
        }
      ];
    }
  }
  
  /**
   * Generate cannibalization-specific workflow steps
   */
  function generateCannibalizationWorkflowSteps(item) {
    const { keyword, pages, pageCount } = item;
    const page1 = pages[0];
    const page2 = pages[1];
    
    return [
      {
        title: "Analyze Intent & Purpose",
        description: `You have ${pageCount} pages competing for "${keyword}". First, determine if they serve different search intents or if they're truly duplicates.`,
        example: `Ask yourself:\n• Does Page 1 serve informational intent? (blog post, guide)\n• Does Page 2 serve transactional intent? (product, service)\n• Are they targeting the same audience?\n• Can they be differentiated by adding modifiers?`,
        action: "analyze-intent",
        actionLabel: "🔍 Compare Page Intents"
      },
      {
        title: "Choose Your Strategy",
        description: `Based on the analysis, choose one of three strategies: Consolidate, Differentiate, or Redirect.`,
        example: `Strategy Guide:\n\n✓ CONSOLIDATE (same intent):\nMerge content from weaker page into stronger page\n\n✓ DIFFERENTIATE (different angles):\nPage 1: "${keyword} for beginners"\nPage 2: "${keyword} for professionals"\n\n✓ REDIRECT (true duplicates):\n301 redirect weaker page → stronger page`,
        action: "choose-strategy",
        actionLabel: "📋 View Full Strategy Guide"
      },
      {
        title: "Implement Consolidation",
        description: `If consolidating: Copy the best content from Page 2 into Page 1, then 301 redirect Page 2 to Page 1.`,
        example: `Consolidation checklist:\n1. Export content from both pages\n2. Identify unique sections in Page 2\n3. Add unique content to Page 1\n4. Update internal links pointing to Page 2\n5. Set up 301 redirect (Page 2 → Page 1)\n6. Update sitemap\n7. Wait 2-4 weeks for rankings to stabilize`,
        action: "consolidate",
        actionLabel: "🔗 View Redirect Guide"
      },
      {
        title: "Differentiate with Keywords",
        description: `If differentiating: Add unique modifiers to each page's target keyword to serve different user intents.`,
        example: `Differentiation examples:\n\nOriginal keyword: "${keyword}"\n\nPage 1 → "${keyword} guide" or "${keyword} tutorial"\n• More informational content\n• Add how-to sections\n• Target longer-tail variations\n\nPage 2 → "best ${keyword}" or "${keyword} services"\n• More commercial content\n• Add pricing, features\n• Target buyer intent`,
        action: "differentiate",
        actionLabel: "🎯 Get Keyword Modifier Ideas"
      },
      {
        title: "Update Internal Linking",
        description: `Update your internal linking structure to clearly signal to Google which page should rank for "${keyword}".`,
        example: `Internal linking strategy:\n\n• Find all pages linking to either competing page\n• Update anchor text to be more specific:\n  - Page 1 links: Use "${keyword} [modifier 1]"\n  - Page 2 links: Use "${keyword} [modifier 2]"\n• Link from homepage to primary page\n• Add breadcrumbs for clear hierarchy\n• Consider canonical tags if needed`,
        action: "internal-links",
        actionLabel: "🔗 Audit Internal Links"
      },
      {
        title: "Monitor & Validate",
        description: `Track both pages over 4-6 weeks to ensure rankings stabilize and volatility decreases.`,
        example: `Monitoring checklist:\n✓ Track rankings for "${keyword}" weekly\n✓ Monitor organic traffic to both pages\n✓ Check Search Console for any new issues\n✓ Verify 301 redirects are working (if used)\n✓ Confirm crawl errors are resolved\n✓ Look for improved rankings stability\n\nExpected timeline:\n• Week 1-2: Rankings may fluctuate\n• Week 3-4: Stabilization begins\n• Week 5-6: Clear winner emerges`,
        action: "monitor",
        actionLabel: "📊 Set Up Tracking Dashboard"
      }
    ];
  }
  
  /**
   * Open Quick Fix Modal
   */
  function openQuickFixModal(item, steps, type = 'quick-win') {
    const modal = document.getElementById('quick-fix-modal');
    if (!modal) return;
    
    // Store current workflow
    modal.dataset.currentStep = '0';
    modal.dataset.totalSteps = steps.length.toString();
    modal.dataset.steps = JSON.stringify(steps);
    modal.dataset.keyword = item.keyword;
    modal.dataset.type = type;
    
    // Update modal header based on type
    const modalTitleEl = document.querySelector('.modal-title');
    const modalSubtitleEl = document.querySelector('.modal-subtitle');
    
    if (type === 'cannibalization') {
      // Cannibalization modal header
      modalTitleEl.innerHTML = `Fix Cannibalization: <span id="fix-keyword">${item.keyword}</span>`;
      modalSubtitleEl.innerHTML = `${item.pageCount} competing pages → Goal: 1 clear winner`;
      modal.dataset.pageCount = item.pageCount.toString();
      modal.dataset.page1 = item.pages[0].page;
      modal.dataset.page2 = item.pages[1].page;
    } else {
      // Quick Win modal header
      modalTitleEl.innerHTML = `Quick Fix: <span id="fix-keyword">${item.keyword}</span>`;
      modalSubtitleEl.innerHTML = `Position <span id="fix-position">${item.position}</span> → Target: Top 5`;
      modal.dataset.position = item.position.toString();
      modal.dataset.page = item.page;
    }
    
    document.getElementById('total-steps').textContent = steps.length;
    
    // Show first step
    showStep(0, steps);
    
    // Show modal with type-specific styling
    modal.setAttribute('data-type', type);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
  
  /**
   * Show specific step in modal
   */
  function showStep(stepIndex, steps) {
    const step = steps[stepIndex];
    const currentStepNum = stepIndex + 1;
    const totalSteps = steps.length;
    
    // Update progress
    document.getElementById('current-step').textContent = currentStepNum;
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${(currentStepNum / totalSteps) * 100}%`;
    
    // Update content
    const stepContent = document.getElementById('step-content');
    stepContent.innerHTML = `
      <h3 class="step-title">${step.title}</h3>
      <p class="step-description">${step.description}</p>
      ${step.example ? `
        <div class="step-example">
          <div class="step-example-label">Example / Tips:</div>
          <div class="step-example-content">${step.example.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}
      ${step.action ? `
        <div class="step-action">
          <button class="btn-step-action" onclick="handleStepAction('${step.action}')">
            ${step.actionLabel || 'Take Action'}
          </button>
        </div>
      ` : ''}
    `;
    
    // Update navigation buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnComplete = document.getElementById('btn-complete');
    
    if (stepIndex === 0) {
      btnPrev.style.visibility = 'hidden';
    } else {
      btnPrev.style.visibility = 'visible';
    }
    
    if (stepIndex === totalSteps - 1) {
      // Last step
      btnNext.style.display = 'none';
      btnComplete.style.display = 'block';
    } else {
      btnNext.style.display = 'block';
      btnComplete.style.display = 'none';
    }
  }
  
  /**
   * Close Quick Fix Modal
   */
  function closeQuickFixModal() {
    const modal = document.getElementById('quick-fix-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }
  
  /**
   * Handle step action button clicks
   */
  window.handleStepAction = function(action) {
    const modal = document.getElementById('quick-fix-modal');
    const page = modal.dataset.page;
    const keyword = modal.dataset.keyword;
    
    console.log(`Action: ${action} for ${keyword} on ${page}`);
    
    // Open the page in a new tab for editing
    if (action.includes('edit') || action.includes('Review')) {
      window.open(page, '_blank');
    } else {
      alert(`This action would: ${action}\n\nFuture integration: Open relevant tools or guides.`);
    }
  };
  
  // Initialize modal controls
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('quick-fix-modal');
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeQuickFixModal);
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeQuickFixModal();
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeQuickFixModal();
      }
    });
    
    // Navigation buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnComplete = document.getElementById('btn-complete');
    
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const currentStep = parseInt(modal.dataset.currentStep);
        const steps = JSON.parse(modal.dataset.steps);
        if (currentStep > 0) {
          modal.dataset.currentStep = (currentStep - 1).toString();
          showStep(currentStep - 1, steps);
        }
      });
    }
    
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const currentStep = parseInt(modal.dataset.currentStep);
        const totalSteps = parseInt(modal.dataset.totalSteps);
        const steps = JSON.parse(modal.dataset.steps);
        if (currentStep < totalSteps - 1) {
          modal.dataset.currentStep = (currentStep + 1).toString();
          showStep(currentStep + 1, steps);
        }
      });
    }
    
    if (btnComplete) {
      btnComplete.addEventListener('click', () => {
        const keyword = modal.dataset.keyword;
        alert(`Great! You've completed the Quick Fix workflow for "${keyword}".\n\nContinue working through these steps and check back in 2-4 weeks to see ranking improvements.`);
        closeQuickFixModal();
      });
    }
  });
  
  // Export functions
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { populateQuickWinsCards, createQuickWinCard };
  }