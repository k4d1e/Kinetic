// onboarding.js - State Machine for Onboarding Wizard

// State constants
const STATES = {
  IDLE: 'IDLE',
  CONNECTING: 'CONNECTING',
  VERIFYING: 'VERIFYING',
  ERROR_MISMATCH: 'ERROR_MISMATCH',
  SUCCESS: 'SUCCESS'
};

// Mock GSC properties for the error state
const MOCK_GSC_PROPERTIES = [
  'austinplumbing.com',
  'apexroofing.com',
  'elite-hvac.com'
];

// State management
class OnboardingStateMachine {
  constructor() {
    this.state = STATES.IDLE;
    this.userInputUrl = '';
    this.selectedProperty = '';
    this.listeners = [];
    this.urlHistoryKey = 'kinetic_url_history';
    this.maxHistoryItems = 10;
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
  }

  setUserInputUrl(url) {
    this.userInputUrl = url;
  }

  setSelectedProperty(property) {
    this.selectedProperty = property;
  }

  // Save URL to history in localStorage
  saveUrlToHistory(url) {
    try {
      const history = this.getUrlHistory();
      
      // Remove if already exists (to move it to top)
      const filtered = history.filter(item => item !== url);
      
      // Add to beginning
      filtered.unshift(url);
      
      // Keep only max items
      const trimmed = filtered.slice(0, this.maxHistoryItems);
      
      localStorage.setItem(this.urlHistoryKey, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Could not save URL to history:', error);
    }
  }

  // Get URL history from localStorage
  getUrlHistory() {
    try {
      const stored = localStorage.getItem(this.urlHistoryKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not load URL history:', error);
      return [];
    }
  }

  // Action: User clicks "Connect Search Console"
  async connectSearchConsole() {
    if (!this.userInputUrl) {
      alert('Please enter a valid website URL');
      return;
    }

    // Validate URL format
    if (!this.isValidUrl(this.userInputUrl)) {
      alert('Please enter a valid URL format (e.g., https://www.example.com)');
      return;
    }

    // Save URL to history
    this.saveUrlToHistory(this.userInputUrl);

    // Transition to CONNECTING
    this.setState(STATES.CONNECTING);

    // Mock: Simulate Google OAuth connection delay
    await this.delay(2000);

    // Transition to VERIFYING
    this.setState(STATES.VERIFYING);

    // Mock: Simulate verification process
    await this.delay(2000);

    // Transition to SUCCESS (checklist will animate there)
    this.setState(STATES.SUCCESS);
  }

  // Action: User selects from dropdown in ERROR_MISMATCH state
  async selectAlternativeProperty(property) {
    this.setSelectedProperty(property);
    this.setState(STATES.VERIFYING);

    // Simulate verification delay
    await this.delay(1500);

    // After selecting alternative, proceed to success
    this.setState(STATES.SUCCESS);
  }

  // Helper: URL validation
  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
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
      urlInput: document.getElementById('url-input'),
      urlHistoryDatalist: document.getElementById('url-history'),
      connectBtn: document.getElementById('connect-btn'),
      idleState: document.getElementById('state-idle'),
      connectingState: document.getElementById('state-connecting'),
      verifyingState: document.getElementById('state-verifying'),
      errorState: document.getElementById('state-error-mismatch'),
      successState: document.getElementById('state-success'),
      userUrlDisplay: document.getElementById('user-url-display'),
      propertySelect: document.getElementById('property-select'),
      selectPropertyBtn: document.getElementById('select-property-btn'),
      verifyingUrlDisplay: document.getElementById('verifying-url-display')
    };

    // Bind events
    this.bindEvents();

    // Populate URL history
    this.populateUrlHistory();

    // Subscribe to state changes
    this.stateMachine.subscribe(this.render.bind(this));

    // Initial render
    this.render(this.stateMachine.state, this.stateMachine);
  }

  bindEvents() {
    // Connect button click
    this.elements.connectBtn.addEventListener('click', () => {
      const url = this.elements.urlInput.value.trim();
      this.stateMachine.setUserInputUrl(url);
      this.stateMachine.connectSearchConsole();
    });

    // Enter key in URL input
    this.elements.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const url = this.elements.urlInput.value.trim();
        this.stateMachine.setUserInputUrl(url);
        this.stateMachine.connectSearchConsole();
      }
    });

    // Refresh history when input is focused
    this.elements.urlInput.addEventListener('focus', () => {
      this.populateUrlHistory();
    });

    // Select property button click
    this.elements.selectPropertyBtn.addEventListener('click', () => {
      const selectedProperty = this.elements.propertySelect.value;
      if (selectedProperty) {
        this.stateMachine.selectAlternativeProperty(selectedProperty);
      }
    });

    // Populate mock properties dropdown
    this.populatePropertyDropdown();
  }

  populatePropertyDropdown() {
    this.elements.propertySelect.innerHTML = '<option value="">-- Select a property --</option>';
    MOCK_GSC_PROPERTIES.forEach(property => {
      const option = document.createElement('option');
      option.value = property;
      option.textContent = property;
      this.elements.propertySelect.appendChild(option);
    });
  }

  populateUrlHistory() {
    const history = this.stateMachine.getUrlHistory();
    this.elements.urlHistoryDatalist.innerHTML = '';
    
    history.forEach(url => {
      const option = document.createElement('option');
      option.value = url;
      this.elements.urlHistoryDatalist.appendChild(option);
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
      case STATES.CONNECTING:
        this.renderConnectingState();
        break;
      case STATES.VERIFYING:
        this.renderVerifyingState(machine);
        break;
      case STATES.ERROR_MISMATCH:
        this.renderErrorMismatchState(machine);
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
    this.elements.idleState.classList.add('active');
    // Enable input
    this.elements.urlInput.disabled = false;
    this.elements.connectBtn.disabled = false;
  }

  renderConnectingState() {
    this.elements.connectingState.classList.add('active');
    // Disable input during connection
    this.elements.urlInput.disabled = true;
    this.elements.connectBtn.disabled = true;
  }

  renderVerifyingState(machine) {
    this.elements.verifyingState.classList.add('active');
    // Display the URL being verified
    const displayUrl = machine.selectedProperty || machine.userInputUrl;
    this.elements.verifyingUrlDisplay.textContent = displayUrl;
  }

  renderErrorMismatchState(machine) {
    this.elements.errorState.classList.add('active');
    // Display the user's input URL
    this.elements.userUrlDisplay.textContent = machine.userInputUrl;
  }

  async renderSuccessState() {
    this.elements.successState.classList.add('active');
    
    // Checklist items with delays
    const checklistItems = [
      { id: 'check-1', delay: 500 },   // Already completed
      { id: 'check-2', delay: 1000 },  // Already completed
      { id: 'check-3', delay: 2000 },  // Quick Wins - in progress then complete
      { id: 'check-4', delay: 2500 },  // Cannibalization
      { id: 'check-5', delay: 2500 },  // Untapped Markets
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
        }
      }
    }

    // Complete last item
    const lastItem = document.getElementById(checklistItems[checklistItems.length - 1].id);
    if (lastItem) {
      await this.stateMachine.delay(2000);
      lastItem.classList.remove('loading');
      lastItem.classList.add('completed');
    }

    // Close onboarding after all items complete
    await this.stateMachine.delay(2000);
    this.closeOnboarding();
  }

  closeOnboarding() {
    // Fade out the modal
    this.elements.overlay.style.opacity = '0';
    
    setTimeout(() => {
      this.elements.overlay.style.display = 'none';
      // Show main content (remove blur/hide if applied)
      document.body.classList.remove('onboarding-active');
    }, 300);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Add onboarding-active class to body (hides main content initially)
  document.body.classList.add('onboarding-active');

  // Initialize state machine and UI
  const stateMachine = new OnboardingStateMachine();
  const ui = new OnboardingUI(stateMachine);
  
  // Expose to window for debugging (optional)
  window.onboarding = { stateMachine, ui };
});
