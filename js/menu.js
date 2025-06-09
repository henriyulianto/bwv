// =============================================================================
// BWV NAVIGATION MENU SYSTEM - Dynamic JSON-based version
// =============================================================================

class BWVNavigationMenu {
  constructor() {
    this.availableWorks = ['bwv1006']; // Fallback default
    this.currentWorkId = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50;
    this.isLoaded = false;

    // Don't auto-initialize - will be called explicitly
  }

  async init() {
    this.updateCurrentWork();
    await this.loadAvailableWorks();
    this.createNavigationButtons();
    this.updateActiveState();
    this.attachEventListeners();
  }

  async loadAvailableWorks() {
    try {
      const response = await fetch('bwvs.json');

      if (!response.ok) {
        throw new Error(`Failed to load bwvs.json: ${response.status}`);
      }

      const bwvsData = await response.json();

      if (bwvsData.bwvs && Array.isArray(bwvsData.bwvs) && bwvsData.bwvs.length > 0) {
        // Numerical sorting by BWV number
        this.availableWorks = bwvsData.bwvs.sort((a, b) => {
          // Extract numeric part (remove 'bwv' prefix)
          const numA = parseInt(a.replace(/^bwv/, ''), 10);
          const numB = parseInt(b.replace(/^bwv/, ''), 10);
          return numA - numB;
        });
      } else {
        throw new Error('Invalid bwvs.json format or empty BWV list');
      }

      this.isLoaded = true;

    } catch (error) {
      console.warn('⚠️ Failed to load BWV list from bwvs.json:', error.message);

      // Show error in UI
      this.showLoadingError('Failed to load BWV navigation. Using fallback.');
      this.isLoaded = false;
    }
  }

  createNavigationButtons() {
    console.log('🎯 createNavigationButtons called');
    
    const container = document.getElementById('bwv-buttons-container');
    const loadingDiv = document.getElementById('bwv-loading');

    if (!container) {
      console.error('❌ BWV buttons container not found');
      return;
    }

    console.log(`🎯 Container found, available works: ${this.availableWorks.length}`);

    // Hide container initially to prevent layout flash
    container.style.visibility = 'hidden';

    // Clear loading message
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // Clear any existing buttons
    container.innerHTML = '';

    // Create buttons for each available work
    this.availableWorks.forEach(workId => {
      const button = document.createElement('button');
      button.className = 'btn btn-sm btn-outline-dark';
      button.type = 'button';
      button.setAttribute('data-work-id', workId);

      // Format display text (BWV 1006 from bwv1006)
      const displayText = workId.replace(/^bwv/, 'BWV ').toUpperCase();
      button.textContent = displayText;

      container.appendChild(button);
      console.log(`🎯 Created button: ${displayText}`);
    });

    console.log(`📱 Created ${this.availableWorks.length} navigation buttons`);
    
    // Force a reflow to ensure buttons are rendered
    container.offsetWidth;
    
    // Log final button count
    const finalButtons = container.querySelectorAll('.btn');
    console.log(`🎯 Final button count in DOM: ${finalButtons.length}`);
  }

  showLoadingError(message) {
    const container = document.getElementById('bwv-buttons-container');
    const loadingDiv = document.getElementById('bwv-loading');

    if (loadingDiv) {
      loadingDiv.className = 'text-warning small';
      loadingDiv.textContent = message;
    }
  }

  updateCurrentWork() {
    // Get current work from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const werkParam = urlParams.get('werk');

    if (werkParam) {
      this.currentWorkId = werkParam.match(/^\d+$/) ? `bwv${werkParam}` : werkParam;
    } else {
      this.currentWorkId = 'bwv1006'; // Default
    }
  }

  updateActiveState() {
    // Remove active styling from all buttons
    document.querySelectorAll('[data-work-id]').forEach(btn => {
      btn.classList.remove('btn-warning');
      btn.classList.add('btn-outline-dark');
    });

    // Add active styling to current work
    const activeBtn = document.querySelector(`[data-work-id="${this.currentWorkId}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('btn-outline-dark');
      activeBtn.classList.add('btn-warning');
    }
  }

  attachEventListeners() {
    // Click events for navigation buttons
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-work-id]');
      if (navBtn) {
        const workId = navBtn.dataset.workId;
        if (workId !== this.currentWorkId) {
          this.navigateToWork(workId);
        }
      }
    });

    // Touch events for swipe gestures
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipeGesture();
    }, { passive: true });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.navigateToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.navigateToNext();
        }
      }
    });
  }

  handleSwipeGesture() {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) < this.minSwipeDistance) {
      return; // Not a significant swipe
    }

    if (swipeDistance > 0) {
      // Swipe right - go to previous work
      this.navigateToPrevious();
    } else {
      // Swipe left - go to next work
      this.navigateToNext();
    }
  }

  getCurrentWorkIndex() {
    return this.availableWorks.findIndex(work => work === this.currentWorkId);
  }

  navigateToPrevious() {
    const currentIndex = this.getCurrentWorkIndex();
    if (currentIndex > 0) {
      const previousWork = this.availableWorks[currentIndex - 1];
      this.navigateToWork(previousWork);
    }
  }

  navigateToNext() {
    const currentIndex = this.getCurrentWorkIndex();
    if (currentIndex < this.availableWorks.length - 1) {
      const nextWork = this.availableWorks[currentIndex + 1];
      this.navigateToWork(nextWork);
    }
  }

  navigateToWork(workId) {
    // Show loading state
    // this.showTransitionLoading();

    // Update URL with new work parameter
    const url = new URL(window.location);
    url.searchParams.set('werk', workId.replace('bwv', ''));

    // Navigate to new work
    window.location.href = url.toString();
  }

  // Method to get navigation info for external use
  getNavigationInfo() {
    return {
      currentWork: this.currentWorkId,
      currentIndex: this.getCurrentWorkIndex(),
      totalWorks: this.availableWorks.length,
      availableWorks: this.availableWorks,
      hasPrevious: this.getCurrentWorkIndex() > 0,
      hasNext: this.getCurrentWorkIndex() < this.availableWorks.length - 1,
      isLoaded: this.isLoaded
    };
  }

  // Method to refresh BWV list (useful for debugging or if bwvs.json updates)
  async refresh() {
    console.log('🔄 Refreshing BWV navigation...');
    await this.loadAvailableWorks();
    this.createNavigationButtons();
    this.updateActiveState();
  }
}

// =============================================================================
// RESPONSIVE BWV BUTTON MANAGEMENT
// =============================================================================

function adjustBWVButtonLayout() {
  console.log('🔧 adjustBWVButtonLayout called');
  
  const container = document.getElementById('bwv-buttons-container');
  if (!container) {
    console.warn('❌ BWV buttons container not found');
    return;
  }

  const buttons = container.querySelectorAll('.btn');
  console.log(`🔧 Found ${buttons.length} buttons in container`);

  if (buttons.length === 0) {
    console.warn('❌ No buttons found in container');
    return;
  }

  // Reset to original text first
  buttons.forEach(btn => {
    const workId = btn.dataset.workId;
    if (workId) {
      const number = workId.replace('bwv', '');
      btn.textContent = `BWV ${number}`;
    }
  });

  // Reset container styles
  container.style.justifyContent = 'center';
  container.style.overflowX = 'visible';

  // Force a reflow
  container.offsetWidth;

  console.log(`🔧 Container width: ${container.scrollWidth}px, Window width: ${window.innerWidth}px`);

  // Check if container exceeds viewport width (with small buffer for margins/padding)
  const buffer = 20; // Small buffer for margins and padding
  if (container.scrollWidth > (window.innerWidth - buffer)) {
    console.log('🔧 Container too wide (including buffer), removing BWV prefix');
    
    // Step 1: Remove "BWV " prefix
    buttons.forEach(btn => {
      const workId = btn.dataset.workId;
      if (workId) {
        const number = workId.replace('bwv', '');
        btn.textContent = number.toUpperCase();
      }
    });

    // Force another reflow
    container.offsetWidth;

    console.log(`🔧 After removing BWV - Container width: ${container.scrollWidth}px`);

    // Check again after removing BWV (still with buffer)
    if (container.scrollWidth > (window.innerWidth - buffer)) {
      console.log('🔧 Still too wide, enabling horizontal scroll');
      // Step 2: Enable horizontal scroll
      container.style.justifyContent = 'flex-start';
      container.style.overflowX = 'auto';
    }
  } else {
    console.log('🔧 Container fits, no adjustment needed');
  }

  // Show the container now that layout is finalized
  container.style.visibility = 'visible';
  console.log('✨ BWV button layout finalized and made visible');
}

// =============================================================================
// INITIALIZATION FUNCTION
// =============================================================================

let bwvNavigation = null;

async function initializeBWVNavigation() {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', async () => {
        bwvNavigation = new BWVNavigationMenu();
        await bwvNavigation.init();
        resolve(bwvNavigation);
      });
    });
  } else {
    bwvNavigation = new BWVNavigationMenu();
    await bwvNavigation.init();
    return bwvNavigation;
  }
}

// =============================================================================
// ES6 MODULE EXPORTS
// =============================================================================

export { BWVNavigationMenu, initializeBWVNavigation, adjustBWVButtonLayout };