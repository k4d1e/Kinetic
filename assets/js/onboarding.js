// onboarding.js - State Machine for Onboarding Wizard with OAuth

// State constants
const STATES = {
  IDLE: 'IDLE',                              // Show "Sign in with Google"
  GOOGLE_AUTH: 'GOOGLE_AUTH',                // OAuth in progress
  FETCHING_PROPERTIES: 'FETCHING_PROPERTIES', // Loading GSC properties
  SELECT_PROPERTY: 'SELECT_PROPERTY',        // Show property dropdown
  CONNECTING: 'CONNECTING',                  // Starting calibration
  SUCCESS: 'SUCCESS'                         // Calibration running/complete
};

// State management
class OnboardingStateMachine {
  constructor(apiService) {
    this.api = apiService;
    this.state = STATES.IDLE;
    this.user = null;
    this.properties = [];
    this.selectedProperty = null;
    this.listeners = [];
    this.calibrationComplete = false;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state, this));
  }

  setState(newState) {
    console.log(`State transition: ${this.state} -> ${newState}`);
    this.state = newState;
    this.notify();
    this.saveState(); // Persist state changes
  }

  setSelectedProperty(property) {
    this.selectedProperty = property;
    this.saveState(); // Persist property selection
  }

  // Persistence: Save state to localStorage
  saveState() {
    try {
      const state = {
        selectedProperty: this.selectedProperty,
        calibrationComplete: this.calibrationComplete,
        timestamp: Date.now()
      };
      localStorage.setItem('kinetic_onboarding_state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Persistence: Load state from localStorage
  loadState() {
    try {
      const saved = localStorage.getItem('kinetic_onboarding_state');
      if (!saved) return false;

      const state = JSON.parse(saved);
      
      // Check if state is still valid (within 24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - state.timestamp > MAX_AGE) {
        console.log('⚠️ Saved state expired, clearing...');
        this.clearState();
        return false;
      }

      // Restore state
      this.selectedProperty = state.selectedProperty;
      this.calibrationComplete = state.calibrationComplete;
      console.log('✓ Restored saved state:', state);
      return true;
    } catch (error) {
      console.error('Error loading state:', error);
      return false;
    }
  }

  // Persistence: Clear saved state
  clearState() {
    localStorage.removeItem('kinetic_onboarding_state');
    localStorage.removeItem('kinetic_quick_wins_data');
    localStorage.removeItem('kinetic_cannibalization_data');
  }

  // Action: Reset session and restart onboarding
  async resetSession() {
    console.log('🔄 Resetting session...');
    this.clearState();
    this.selectedProperty = null;
    this.calibrationComplete = false;
    this.properties = [];
    
    // Reload the page to restart
    window.location.reload();
  }

  // Action: Check if user is already authenticated
  async checkExistingAuth() {
    try {
      // First, try to load saved state
      const hasState = this.loadState();
      
      const { authenticated, user } = await this.api.checkAuth();
      if (authenticated) {
        this.user = user;
        console.log('✓ User already authenticated:', user.email);
        
        // If we have a saved calibrated state, skip onboarding entirely
        if (hasState && this.calibrationComplete && this.selectedProperty) {
          console.log('✓ Restoring previous session:', this.selectedProperty);
          // DON'T set state to SUCCESS - just restore data directly
          await this.restoreCachedData();
          return;
        }
        
        // Otherwise, fetch properties and continue
        this.setState(STATES.FETCHING_PROPERTIES);
        await this.fetchProperties();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  }

  // Action: Check if returning from OAuth redirect
  checkOAuthReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    
    if (authStatus === 'success') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Transition to fetching properties
      this.setState(STATES.FETCHING_PROPERTIES);
      this.fetchProperties();
    } else if (authStatus === 'failure') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('Authentication failed. Please try again.');
      this.setState(STATES.IDLE);
    }
  }

  // Action: User clicks "Sign in with Google"
  initiateGoogleSignIn() {
    // Redirect to Google OAuth
    this.api.initiateGoogleAuth();
    // Note: This will navigate away from the page
    // User will return with ?auth=success or ?auth=failure query param
  }

  // Action: Fetch user's GSC properties
  async fetchProperties() {
    try {
      this.properties = await this.api.fetchGSCProperties();
      
      if (this.properties.length === 0) {
        alert('No Search Console properties found. Please add a property to your Google Search Console account first.');
        this.setState(STATES.IDLE);
        return;
      }

      console.log(`✓ Fetched ${this.properties.length} GSC properties`);
      this.setState(STATES.SELECT_PROPERTY);
    } catch (error) {
      console.error('Error fetching properties:', error);
      alert('Failed to fetch your Search Console properties. Please try again.');
      this.setState(STATES.IDLE);
    }
  }

  // Action: User selects a property and starts calibration
  async startCalibration(siteUrl) {
    try {
      this.selectedProperty = siteUrl;
      this.calibrationComplete = false; // Will be set to true after checklist completes
      this.setState(STATES.CONNECTING);
      
      // Small delay for UX
      await this.delay(1000);
      
      // Start calibration on backend
      await this.api.startCalibration(siteUrl);
      
      // Transition to SUCCESS state where checklist runs
      this.setState(STATES.SUCCESS);
    } catch (error) {
      console.error('Error starting calibration:', error);
      alert('Failed to start calibration. Please try again.');
      this.setState(STATES.SELECT_PROPERTY);
    }
  }

  // Restore cached data from localStorage
  async restoreCachedData() {
    try {
      const quickWinsData = localStorage.getItem('kinetic_quick_wins_data');
      const cannibalizationData = localStorage.getItem('kinetic_cannibalization_data');

      if (quickWinsData && cannibalizationData) {
        const quickWins = JSON.parse(quickWinsData);
        const cannibalization = JSON.parse(cannibalizationData);
        
        console.log(`✓ Restored ${quickWins.length} Quick Wins + ${cannibalization.length} Cannibalization cards from cache`);
        
        // Populate the module using the cached data
        if (window.populateModule1Cards) {
          window.populateModule1Cards(quickWins, cannibalization);
        }
        
        // Completely hide onboarding - no modal should appear
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
          overlay.style.display = 'none'; // Hide immediately
          overlay.classList.remove('active');
        }
        
        // Remove the onboarding-active class to show main content
        document.body.classList.remove('onboarding-active');
        document.body.style.overflow = ''; // Re-enable scrolling
        
        console.log('✓ Session restored - skipped onboarding');
      } else {
        console.log('⚠️ No cached data found, showing onboarding...');
        // If no cache, show onboarding and fetch fresh data
        this.setState(STATES.FETCHING_PROPERTIES);
        await this.fetchProperties();
      }
    } catch (error) {
      console.error('Error restoring cached data:', error);
      // Fallback to showing onboarding
      this.setState(STATES.FETCHING_PROPERTIES);
      await this.fetchProperties();
    }
  }

  // Helper: Delay function for mocking async operations
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock: Randomly decide success/failure for demo purposes
  // In production, this would be based on actual verification result
  shouldSimulateSuccess() {
    // For demo purposes, always show error mismatch to demonstrate the flow
    // Change to `return true` to test success path
    return false;
  }
}

// UI Controller
class OnboardingUI {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.elements = {};
    this.init();
  }

  init() {
    // Cache DOM elements
    this.elements = {
      modal: document.getElementById('onboarding-modal'),
      overlay: document.getElementById('onboarding-overlay'),
      googleSignInBtn: document.getElementById('google-signin-btn'),
      idleState: document.getElementById('state-idle'),
      googleAuthState: document.getElementById('state-google-auth'),
      fetchingPropertiesState: document.getElementById('state-fetching-properties'),
      selectPropertyState: document.getElementById('state-select-property'),
      connectingState: document.getElementById('state-connecting'),
      successState: document.getElementById('state-success'),
      propertySelect: document.getElementById('property-select'),
      selectPropertyBtn: document.getElementById('select-property-btn')
    };

    // Bind events
    this.bindEvents();

    // Subscribe to state changes
    this.stateMachine.subscribe(this.render.bind(this));

    // Check if returning from OAuth
    this.stateMachine.checkOAuthReturn();

    // Check if already authenticated
    this.stateMachine.checkExistingAuth();

    // Initial render
    this.render(this.stateMachine.state, this.stateMachine);
  }

  bindEvents() {
    // Google Sign-In button click - initiates OAuth flow
    if (this.elements.googleSignInBtn) {
      this.elements.googleSignInBtn.addEventListener('click', () => {
        this.stateMachine.initiateGoogleSignIn();
      });
    }

    // Select property button click
    if (this.elements.selectPropertyBtn) {
      this.elements.selectPropertyBtn.addEventListener('click', () => {
        const selectedProperty = this.elements.propertySelect.value;
        if (selectedProperty) {
          this.stateMachine.startCalibration(selectedProperty);
        } else {
          alert('Please select a property');
        }
      });
    }
  }

  populatePropertyDropdown() {
    if (!this.elements.propertySelect) return;
    
    this.elements.propertySelect.innerHTML = '<option value="">-- Select a property --</option>';
    this.stateMachine.properties.forEach(property => {
      const option = document.createElement('option');
      option.value = property.siteUrl;
      option.textContent = property.siteUrl;
      this.elements.propertySelect.appendChild(option);
    });
  }

  render(state, machine) {
    // Hide all state containers
    this.hideAllStates();

    // Show the appropriate state container
    switch (state) {
      case STATES.IDLE:
        this.renderIdleState();
        break;
      case STATES.GOOGLE_AUTH:
        this.renderGoogleAuthState();
        break;
      case STATES.FETCHING_PROPERTIES:
        this.renderFetchingPropertiesState();
        break;
      case STATES.SELECT_PROPERTY:
        this.renderSelectPropertyState();
        break;
      case STATES.CONNECTING:
        this.renderConnectingState();
        break;
      case STATES.SUCCESS:
        this.renderSuccessState();
        break;
    }
  }

  hideAllStates() {
    Object.values(this.elements).forEach(el => {
      if (el && el.classList && el.classList.contains('onboarding-state')) {
        el.classList.remove('active');
      }
    });
  }

  renderIdleState() {
    if (this.elements.idleState) {
      this.elements.idleState.classList.add('active');
    }
  }

  renderGoogleAuthState() {
    if (this.elements.googleAuthState) {
      this.elements.googleAuthState.classList.add('active');
    }
  }

  renderFetchingPropertiesState() {
    if (this.elements.fetchingPropertiesState) {
      this.elements.fetchingPropertiesState.classList.add('active');
    }
  }

  renderSelectPropertyState() {
    if (this.elements.selectPropertyState) {
      this.elements.selectPropertyState.classList.add('active');
      this.populatePropertyDropdown();
    }
  }

  renderConnectingState() {
    if (this.elements.connectingState) {
      this.elements.connectingState.classList.add('active');
    }
  }

  async renderSuccessState() {
    this.elements.successState.classList.add('active');
    
    // Checklist items with delays
    const checklistItems = [
      { id: 'check-1', delay: 500 },   // Already completed
      { id: 'check-2', delay: 1000 },  // Already completed
      { id: 'check-3', delay: 2000, action: 'loadQuickWins' },  // Quick Wins - fetch data
      { id: 'check-4', delay: 1500, action: 'loadCannibalization' },  // Cannibalization - fetch data
      { id: 'check-5', delay: 1500, action: 'loadUntappedMarkets' },  // Untapped Markets - fetch data
      { id: 'check-6', delay: 2500 },  // AI Citation
      { id: 'check-7', delay: 2500 }   // Local Visibility
    ];

    // Animate checklist progression
    for (let i = 0; i < checklistItems.length; i++) {
      await this.stateMachine.delay(checklistItems[i].delay);
      
      const item = document.getElementById(checklistItems[i].id);
      if (item) {
        // Remove loading state from previous item
        if (i > 0) {
          const prevItem = document.getElementById(checklistItems[i - 1].id);
          if (prevItem) {
            prevItem.classList.remove('loading');
            prevItem.classList.add('completed');
          }
        }
        
        // Add loading state to current item (except first two which start completed)
        if (i < 2) {
          item.classList.add('completed');
        } else {
          item.classList.add('loading');
          
          // Execute special action for this checklist item (if any)
          if (checklistItems[i].action === 'loadQuickWins') {
            // Ensure spinner shows for at least 1.5 seconds
            const minDelay = this.stateMachine.delay(1500);
            const dataLoad = this.loadQuickWinsModule();
            
            // Wait for both the minimum delay AND the data to load
            await Promise.all([minDelay, dataLoad]);
            
            // Only complete after data is loaded and cards are populated
            item.classList.remove('loading');
            item.classList.add('completed');
          } else if (checklistItems[i].action === 'loadCannibalization') {
            // Ensure spinner shows for at least 1.5 seconds
            const minDelay = this.stateMachine.delay(1500);
            const dataLoad = this.loadCannibalizationModule();
            
            // Wait for both the minimum delay AND the data to load
            await Promise.all([minDelay, dataLoad]);
            
            // Only complete after data is loaded and cards are populated
            item.classList.remove('loading');
            item.classList.add('completed');
          } else if (checklistItems[i].action === 'loadUntappedMarkets') {
            // Ensure spinner shows for at least 1.5 seconds
            const minDelay = this.stateMachine.delay(1500);
            const dataLoad = this.loadUntappedMarketsModule();
            
            // Wait for both the minimum delay AND the data to load
            await Promise.all([minDelay, dataLoad]);
            
            // Only complete after data is loaded and cards are populated
            item.classList.remove('loading');
            item.classList.add('completed');
          }
        }
      }
    }

    // Complete last item
    const lastItem = document.getElementById(checklistItems[checklistItems.length - 1].id);
    if (lastItem && !lastItem.classList.contains('completed')) {
      await this.stateMachine.delay(2000);
      lastItem.classList.remove('loading');
      lastItem.classList.add('completed');
    }

    // Close onboarding after all items complete
    await this.stateMachine.delay(2000);
    this.closeOnboarding();
  }

  closeOnboarding() {
    // Mark calibration as complete and save state
    this.stateMachine.calibrationComplete = true;
    this.stateMachine.saveState();
    console.log('✓ Calibration complete - state saved');
    
    // Fade out the modal
    this.elements.overlay.style.opacity = '0';
    
    setTimeout(() => {
      this.elements.overlay.style.display = 'none';
      // Show main content (remove blur/hide if applied)
      document.body.classList.remove('onboarding-active');
      // Note: Quick Wins already loaded during calibration checklist
    }, 300);
  }

  async loadQuickWinsModule() {
    try {
      const siteURL = this.stateMachine.selectedProperty;

      // fetch quick wins data with cache refresh during calibration
      const quickWins = await this.stateMachine.api.getMetricData('quick-wins', siteURL, true);

      // Store in window for later merging with cannibalization
      window.quickWinsData = quickWins || [];
      
      // Cache to localStorage
      localStorage.setItem('kinetic_quick_wins_data', JSON.stringify(quickWins || []));
      
      console.log('✓ Quick Wins data loaded:', quickWins.length, 'opportunities');
    } catch (error) {
      console.error('Error loading quick wins module:', error);
      window.quickWinsData = [];
      throw error; // Re-throw so checklist can handle the error
    }
  }

  async loadCannibalizationModule() {
    try {
      const siteURL = this.stateMachine.selectedProperty;

      // fetch cannibalization data with cache refresh during calibration
      const cannibalization = await this.stateMachine.api.getMetricData('cannibalization', siteURL, true);

      // Store in window for later merging
      window.cannibalizationData = cannibalization || [];
      
      // Cache to localStorage
      localStorage.setItem('kinetic_cannibalization_data', JSON.stringify(cannibalization || []));
      
      console.log('✓ Cannibalization data loaded:', cannibalization.length, 'issues');
      
      // Now merge and populate all cards
      this.populateModule1Cards();
    } catch (error) {
      console.error('Error loading cannibalization module:', error);
      window.cannibalizationData = [];
      // Still populate with just Quick Wins if cannibalization fails
      this.populateModule1Cards();
    }
  }

  async loadUntappedMarketsModule() {
    try {
      const siteURL = this.stateMachine.selectedProperty;

      // fetch untapped markets data with cache refresh during calibration
      const untappedMarkets = await this.stateMachine.api.getMetricData('untapped-markets', siteURL, true);

      // Store in window
      window.untappedMarketsData = untappedMarkets || [];
      
      // Cache to localStorage
      localStorage.setItem('kinetic_untapped_markets_data', JSON.stringify(untappedMarkets || []));
      
      console.log('✓ Untapped Markets data loaded:', untappedMarkets.length, 'opportunities');
      
      // Populate Module 2 cards
      if (window.populateUntappedMarketsCards) {
        window.populateUntappedMarketsCards(untappedMarkets);
      }
    } catch (error) {
      console.error('Error loading untapped markets module:', error);
      window.untappedMarketsData = [];
    }
  }

  populateModule1Cards() {
    // Merge Quick Wins and Cannibalization data
    const quickWins = window.quickWinsData || [];
    const cannibalization = window.cannibalizationData || [];
    
    // Call the global function from quickWins.js
    if (typeof populateModule1Cards === 'function') {
      populateModule1Cards(quickWins, cannibalization);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Add onboarding-active class to body (hides main content initially)
  document.body.classList.add('onboarding-active');

  // Initialize API service
  const api = new KineticAPI('http://localhost:8000');

  // Initialize state machine and UI
  const stateMachine = new OnboardingStateMachine(api);
  const ui = new OnboardingUI(stateMachine);
  
  // Check for existing authentication/session
  stateMachine.checkExistingAuth();
  
  // Expose to window for debugging and manual controls
  window.onboarding = { stateMachine, ui, api };
  
  // Expose reset function globally for easy access
  window.resetKineticSession = () => stateMachine.resetSession();
  
  // Log helpful tip for users
  console.log('💡 Tip: To reset your session and restart onboarding, run: resetKineticSession()');
  
  // Optional: Add keyboard shortcut (Ctrl+Shift+R or Cmd+Shift+R)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      if (confirm('Reset Kinetic session and restart onboarding?')) {
        stateMachine.resetSession();
      }
    }
  });
});
