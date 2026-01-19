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
  
  // ======================
  // UNTAPPED MARKETS (Module 2)
  // ======================
  
  /**
   * Populate Module 2: Untapped Markets cards
   */
  async function populateUntappedMarketsCards(data) {
    if (!data || data.length === 0) {
      console.log('⚠️ No untapped markets data to display');
      return;
    }
    
    console.log(`📊 Populating Module 2 with ${data.length} untapped market opportunities`);
    
    // Find the New Markets module card track
    const modules = document.querySelectorAll('.module-container');
    let cardTrack = null;
    
    for (const module of modules) {
      const title = module.querySelector('.module-title');
      if (title && title.textContent.trim() === 'New Markets') {
        cardTrack = module.querySelector('.card-track');
        break;
      }
    }
    
    if (!cardTrack) {
      console.error('Card track container not found for New Markets module');
      return;
    }
    
    // Clear existing placeholder cards
    cardTrack.innerHTML = '';
    
    // Generate and append market cards
    data.forEach(opportunity => {
      const card = createUntappedMarketCard(opportunity);
      cardTrack.appendChild(card);
    });
    
    console.log(`✓ Module 2 populated with ${data.length} untapped market opportunities`);
  }
  
  /**
   * Create a single untapped market card
   */
  function createUntappedMarketCard(opportunity) {
    const { topic, keywords, clusterVolume, potential, commercialIntent, avgPosition } = opportunity;
    
    const card = document.createElement('article');
    card.className = 'market-card';
    
    // Capitalize topic
    const topicTitle = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Get potential class and label
    const potentialClass = `metric-value-${potential.toLowerCase()}`;
    
// Display all keywords (1-3) with proper formatting
const displayKeywords = keywords.map((kw, index) => {
    // Add "+" after each keyword except the last one
    if (index < keywords.length - 1) {
      return `${kw} +`;
    }
    return kw;
  }).join('<br>');
    
    card.innerHTML = `
      <h3 class="card-title">${topicTitle}</h3>
      
      <div class="keyword-group">
        <svg class="sparkle-icon" viewBox="0 0 600 600" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0,600) scale(0.10,-0.10)" fill="currentColor" stroke="none">
            <path d="M4275 5751 c-56 -26 -71 -59 -79 -171 -20 -292 -102 -546 -225 -700 -62 -78 -175 -183 -252 -235 -150 -101 -349 -159 -633 -185 -70 -6 -127 -16 -139 -25 -56 -39 -73 -114 -37 -172 25 -41 68 -63 122 -63 75 0 275 -30 375 -56 205 -53 340 -132 484 -281 89 -92 122 -136 169 -229 71 -138 111 -297 130 -509 7 -72 18 -145 26 -163 27 -64 119 -92 177 -53 48 31 56 53 67 177 26 283 84 482 185 634 67 100 224 253 313 305 154 90 344 146 572 166 164 14 164 14 198 49 39 39 49 90 25 137 -29 60 -55 71 -183 83 -296 28 -507 92 -665 205 -70 50 -207 189 -254 258 -100 147 -166 370 -190 646 -11 118 -22 149 -64 175 -39 25 -79 27 -122 7z"/>
            <path d="M2326 4530 c-45 -29 -54 -56 -66 -201 -38 -455 -134 -783 -306 -1045 -71 -108 -275 -321 -393 -409 -153 -115 -354 -207 -576 -264 -161 -41 -272 -59 -488 -80 -204 -19 -225 -27 -251 -92 -22 -54 -8 -109 37 -143 29 -22 49 -26 167 -36 502 -41 848 -149 1110 -347 87 -65 228 -200 304 -292 229 -275 345 -609 391 -1125 19 -205 31 -236 106 -256 29 -8 46 -7 78 6 60 24 77 60 86 179 33 487 152 872 349 1136 86 113 304 323 407 391 265 174 591 270 1048 308 146 12 182 24 206 70 26 51 20 105 -18 147 l-33 36 -185 18 c-300 28 -485 65 -674 134 -251 90 -369 168 -580 380 -205 204 -292 335 -375 563 -71 193 -110 386 -139 687 l-19 189 -36 33 c-29 27 -44 33 -78 33 -26 0 -55 -8 -72 -20z"/>
          </g>
        </svg>
        <p class="keyword-text">${displayKeywords}</p>
      </div>
      
      <div class="market-metric">
        Potential: <span class="${potentialClass}">${potential}</span>
      </div>
      
      <button class="btn-explore" data-topic="${topic}" data-volume="${clusterVolume}" data-intent="${commercialIntent}">
        Explore
      </button>
    `;
    
    return card;
  }
  
  // Make function globally available
  window.populateUntappedMarketsCards = populateUntappedMarketsCards;
  
  /**
   * Populate AI Visibility cards (Module 3)
   */
  async function populateAIVisibilityCards(data) {
    if (!data || data.length === 0) {
      console.log('⚠️ No AI visibility data to display');
      return;
    }
    
    console.log(`📊 Populating Module 3 with ${data.length} AI visibility opportunities`);
    
    // Find the AI Visibility module card track
    const modules = document.querySelectorAll('.module-container');
    let cardTrack = null;
    
    for (const module of modules) {
      const title = module.querySelector('.module-title');
      if (title && title.textContent.trim() === 'AI Visibility') {
        cardTrack = module.querySelector('.card-track');
        break;
      }
    }
    
    if (!cardTrack) {
      console.error('Card track container not found for AI Visibility module');
      return;
    }
    
    // Clear existing placeholder cards
    cardTrack.innerHTML = '';
    
    // Generate and append AI visibility cards
    data.forEach(opportunity => {
      const card = createAIVisibilityCard(opportunity);
      cardTrack.appendChild(card);
    });
    
    console.log(`✓ Module 3 populated with ${data.length} AI visibility opportunities`);
    
    // Initialize modal handlers after cards are rendered
    setTimeout(() => {
      if (window.initAIOptimizationModal) {
        window.initAIOptimizationModal();
      }
    }, 100);
  }
  
  /**
   * Create a single AI visibility card
   */
  function createAIVisibilityCard(opportunity) {
    const { topic, query, geoScore, signalType, position, impressions } = opportunity;
    
    const card = document.createElement('article');
    card.className = 'ai-card';
    
    // Format query as a concise paragraph (aim for 40-60 words)
    const queryDescription = formatQueryDescription(query, signalType);
    
    // Determine GEO score class and label
    let geoClass = 'geo-low';
    let geoLabel = 'High Opportunity';
    if (geoScore >= 70) {
      geoClass = 'geo-high';
      geoLabel = 'Well Optimized';
    } else if (geoScore >= 40) {
      geoClass = 'geo-medium';
      geoLabel = 'Moderate Opportunity';
    }
    
    card.innerHTML = `
      <h3 class="card-title">${topic}</h3>
      
      <div class="query-description">
        <p>${queryDescription}</p>
      </div>
      
      <div class="geo-score-container">
        <div class="geo-label">GEO Score</div>
        <div class="geo-score ${geoClass}">${geoScore}</div>
        <div class="geo-status">${geoLabel}</div>
      </div>
      
      <div class="ai-metrics">
        <span class="metric-item">
          <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          Position ${position}
        </span>
        <span class="metric-item">
          <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          ${impressions} views
        </span>
      </div>
      
      <button class="btn-optimize" data-query="${query}" data-topic="${topic}" data-score="${geoScore}">
        Optimize
      </button>
    `;
    
    return card;
  }
  
  /**
   * Format query into a descriptive paragraph
   */
  function formatQueryDescription(query, signalType) {
    // Create a context-aware description
    const descriptions = {
      'How': `Users searching "${query}" need step-by-step guidance. Your page ranks well but may lack a clear, concise answer block that AI can extract and cite.`,
      'What': `The query "${query}" seeks definition and explanation. Optimize with a direct 40-60 word answer block to capture AI citations.`,
      'Why': `"${query}" indicates users want reasoning and benefits. Structure your content with clear value propositions for LLM extraction.`,
      'Cost': `Cost-related query "${query}" requires transparent pricing information. Add structured pricing data for AI visibility.`,
      'When': `Timing query "${query}" needs specific timeframes and schedules. Format this information for easy AI extraction.`,
      'Where': `Location-based query "${query}" should include clear geographic indicators and local authority signals.`,
      'Who': `"${query}" asks for expert identification. Strengthen authority markers and credentials for AI citation.`,
      'Lifespan': `Longevity question "${query}" needs specific duration data. Structure this as extractable facts for LLMs.`,
      'Warranty': `"${query}" seeks guarantee information. Format warranty details as clear, quotable answer blocks.`,
      'General': `High-volume query "${query}" ranks well but needs optimization for AI extraction. Add concise answer blocks.`
    };
    
    return descriptions[signalType] || descriptions['General'];
  }
  
  // Make functions globally available
  window.populateAIVisibilityCards = populateAIVisibilityCards;
  
  /**
   * ============================================================
   * AI OPTIMIZATION MODAL FUNCTIONS
   * ============================================================
   */
  
  // Store AI visibility dataset
  let aiVisibilityDataset = [];
  
  /**
   * Initialize AI Optimization modal handlers
   */
  function initAIOptimizationModal() {
    // Store the dataset
    aiVisibilityDataset = window.aiVisibilityData || [];
    
    // Add event listeners to all Optimize buttons
    const buttons = document.querySelectorAll('.btn-optimize');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const query = e.target.dataset.query;
        const topic = e.target.dataset.topic;
        const geoScore = e.target.dataset.score;
        handleAIOptimize(query, topic, geoScore);
      });
    });
    
    // Modal navigation
    setupAIModalNavigation();
  }
  
  /**
   * Handle Optimize button click
   */
  function handleAIOptimize(query, topic, geoScore) {
    // Find the item data
    const item = aiVisibilityDataset.find(i => i.query === query);
    
    if (!item) {
      console.error('Item not found for AI Optimize');
      return;
    }
    
    // Generate optimization steps based on signal type and GEO score
    const steps = generateAIOptimizationSteps(item);
    
    openAIOptimizeModal(item, steps);
  }
  
  /**
   * Generate AI optimization workflow steps
   */
  function generateAIOptimizationSteps(item) {
    const { query, signalType, geoScore, page, position } = item;
    
    const steps = [];
    
    // Step 1: Identify the Answer Block Location
    steps.push({
      title: 'Identify Answer Block Location',
      icon: '🎯',
      description: `Locate where to add the concise answer block on your page for "${query}".`,
      tasks: [
        `Navigate to: <code>${truncateUrl(page)}</code>`,
        `Find the main content area discussing "${query.substring(0, 50)}..."`,
        `Look for the section that currently ranks at position ${position}`,
        `Identify the best location (usually near the top or H2 heading) for your answer block`
      ]
    });
    
    // Step 2: Create the Answer Block (based on signal type)
    const answerGuidance = getAnswerGuidanceBySignalType(signalType, query);
    steps.push({
      title: 'Create Concise Answer Block',
      icon: '✍️',
      description: answerGuidance.description,
      tasks: answerGuidance.tasks
    });
    
    // Step 3: Structure for LLM Extraction
    steps.push({
      title: 'Optimize for LLM Extraction',
      icon: '🤖',
      description: 'Format your content so AI models can easily extract and cite it.',
      tasks: [
        'Use clear heading hierarchy (H2 or H3 for the answer section)',
        'Keep the answer block to 40-60 words for optimal extraction',
        'Use bullet points or numbered lists for multi-part answers',
        'Include relevant statistics, dates, or specific numbers',
        'Add schema markup if applicable (FAQ, HowTo, etc.)',
        'Ensure the answer can stand alone without surrounding context'
      ]
    });
    
    // Step 4: Add Authority Signals
    steps.push({
      title: 'Strengthen Authority Markers',
      icon: '⭐',
      description: 'Add credibility signals that LLMs recognize and value.',
      tasks: [
        'Include author credentials or business certifications',
        'Add publication or last updated dates',
        'Reference industry standards or regulations',
        'Link to authoritative sources if making claims',
        'Include years of experience or service area',
        'Add customer testimonials or case study data related to this topic'
      ]
    });
    
    return steps;
  }
  
  /**
   * Get answer guidance based on signal type
   */
  function getAnswerGuidanceBySignalType(signalType, query) {
    const guidance = {
      'How': {
        description: 'Create a step-by-step answer block that directly addresses the "how" question.',
        tasks: [
          'Start with a direct answer: "To [accomplish goal], follow these steps:"',
          'Use numbered list format (3-5 clear steps)',
          'Keep each step concise (1-2 sentences)',
          'Include time estimates or difficulty level',
          'End with expected outcome or result'
        ]
      },
      'What': {
        description: 'Provide a clear, definition-style answer that explains the concept.',
        tasks: [
          'Start with: "[Term] is..." or "[Term] refers to..."',
          'Define in 2-3 sentences (40-50 words)',
          'Explain why it matters or key benefits',
          'Use analogies or examples if helpful',
          'Avoid jargon; use plain language'
        ]
      },
      'Why': {
        description: 'Create a reasons-based answer highlighting key benefits or causes.',
        tasks: [
          'Open with the main reason or benefit',
          'List 3-4 key reasons in bullet points',
          'Include supporting data or statistics',
          'Address common concerns or objections',
          'Conclude with the strongest benefit'
        ]
      },
      'Cost': {
        description: 'Provide transparent, structured pricing information.',
        tasks: [
          'State typical cost range upfront: "$X - $Y"',
          'List 3-4 factors that affect pricing',
          'Break down cost by tier or category if applicable',
          'Include average or most common price point',
          'Mention any warranties or guarantees included'
        ]
      },
      'When': {
        description: 'Specify timeframes, schedules, or optimal timing.',
        tasks: [
          'Provide direct timing answer in first sentence',
          'List seasonal considerations or best times',
          'Include duration or how long it takes',
          'Mention any time-sensitive factors',
          'Reference industry standards for timing'
        ]
      },
      'Where': {
        description: 'Clarify location, service area, or geographic information.',
        tasks: [
          'State primary service area clearly',
          'List specific cities, counties, or regions',
          'Include radius or coverage map reference',
          'Mention any location-specific expertise',
          'Add local landmarks or area identifiers'
        ]
      },
      'Who': {
        description: 'Establish expertise and identify the right professional.',
        tasks: [
          'Start with credential or specialization',
          'List relevant certifications or licenses',
          'Include years of experience in this area',
          'Mention team size or expertise areas',
          'Reference notable projects or clients'
        ]
      },
      'Lifespan': {
        description: 'Provide specific duration data and longevity information.',
        tasks: [
          'State typical lifespan upfront: "X years on average"',
          'List factors that extend or reduce lifespan',
          'Include range: "typically between X-Y years"',
          'Mention maintenance requirements',
          'Compare to alternatives if relevant'
        ]
      },
      'Warranty': {
        description: 'Detail warranty and guarantee information clearly.',
        tasks: [
          'State warranty length in opening: "X-year warranty"',
          'List what\'s covered vs. not covered',
          'Explain claim or service process',
          'Mention any extended warranty options',
          'Include manufacturer vs. workmanship warranties'
        ]
      }
    };
    
    return guidance[signalType] || {
      description: 'Create a direct, concise answer to the user\'s question.',
      tasks: [
        'Answer the question in the first 2-3 sentences',
        'Use 40-60 words total for the answer block',
        'Include specific details, numbers, or examples',
        'Structure with clear headings or bullet points',
        'Ensure it can be quoted as a standalone answer'
      ]
    };
  }
  
  /**
   * Open AI Optimization modal
   */
  function openAIOptimizeModal(item, steps) {
    const modal = document.getElementById('ai-optimize-modal');
    if (!modal) return;
    
    // Store current workflow
    modal.dataset.currentStep = '0';
    modal.dataset.totalSteps = steps.length.toString();
    modal.dataset.steps = JSON.stringify(steps);
    modal.dataset.query = item.query;
    modal.dataset.topic = item.topic;
    
    // Update modal header
    document.getElementById('ai-topic').textContent = item.topic;
    document.getElementById('ai-geo-score').textContent = item.geoScore;
    
    // Update progress
    document.getElementById('ai-total-steps').textContent = steps.length;
    
    // Show first step
    showAIStep(0, steps);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Show a specific step in the AI modal
   */
  function showAIStep(stepIndex, steps) {
    const step = steps[stepIndex];
    const contentDiv = document.getElementById('ai-step-content');
    
    // Build tasks HTML
    const tasksHTML = step.tasks.map(task => `<li>${task}</li>`).join('');
    
    contentDiv.innerHTML = `
      <div class="step-header">
        <span class="step-icon">${step.icon}</span>
        <h3 class="step-title">${step.title}</h3>
      </div>
      <p class="step-description">${step.description}</p>
      <ul class="step-tasks">
        ${tasksHTML}
      </ul>
    `;
    
    // Update progress bar
    const progress = ((stepIndex + 1) / steps.length) * 100;
    document.getElementById('ai-progress-fill').style.width = progress + '%';
    document.getElementById('ai-current-step').textContent = stepIndex + 1;
    
    // Update button visibility
    const prevBtn = document.getElementById('ai-btn-prev');
    const nextBtn = document.getElementById('ai-btn-next');
    const completeBtn = document.getElementById('ai-btn-complete');
    
    prevBtn.style.visibility = stepIndex > 0 ? 'visible' : 'hidden';
    
    if (stepIndex === steps.length - 1) {
      nextBtn.style.display = 'none';
      completeBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      completeBtn.style.display = 'none';
    }
  }
  
  /**
   * Setup AI modal navigation
   */
  function setupAIModalNavigation() {
    const modal = document.getElementById('ai-optimize-modal');
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    // Previous button
    document.getElementById('ai-btn-prev').addEventListener('click', () => {
      const currentStep = parseInt(modal.dataset.currentStep);
      const steps = JSON.parse(modal.dataset.steps);
      
      if (currentStep > 0) {
        modal.dataset.currentStep = (currentStep - 1).toString();
        showAIStep(currentStep - 1, steps);
      }
    });
    
    // Next button
    document.getElementById('ai-btn-next').addEventListener('click', () => {
      const currentStep = parseInt(modal.dataset.currentStep);
      const steps = JSON.parse(modal.dataset.steps);
      
      if (currentStep < steps.length - 1) {
        modal.dataset.currentStep = (currentStep + 1).toString();
        showAIStep(currentStep + 1, steps);
      }
    });
    
    // Complete button
    document.getElementById('ai-btn-complete').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Could add completion tracking here
      console.log('✓ AI Optimization completed for:', modal.dataset.query);
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAIOptimizationModal, 500);
    });
  } else {
    setTimeout(initAIOptimizationModal, 500);
  }
  
  // Also expose for manual initialization after cards are populated
  window.initAIOptimizationModal = initAIOptimizationModal;
  
  // Export functions
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
      populateQuickWinsCards, 
      createQuickWinCard, 
      populateUntappedMarketsCards,
      populateAIVisibilityCards 
    };
  }