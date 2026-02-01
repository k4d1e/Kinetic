// checklistAnimation.js - Animated checklist with moving spinner

// Initialize the completion page animation
// This should be called when the sprint card is opened or the completion page is shown
function initCompletionAnimation() {
    // Find the completion page dynamically (should be the last page in the card)
    const cardContainer = document.getElementById('sprint-plan-card-container');
    if (!cardContainer) return;
    
    const allPages = cardContainer.querySelectorAll('.sprint-card-page[data-page]');
    if (allPages.length === 0) return;
    
    // Get the highest page number (completion page)
    let maxPageNum = 0;
    let completionPage = null;
    
    allPages.forEach(page => {
        const pageNum = parseInt(page.getAttribute('data-page'));
        if (pageNum > maxPageNum) {
            maxPageNum = pageNum;
            completionPage = page;
        }
    });
    
    if (!completionPage) return;
    
    console.log(`📄 Completion animation initialized for page ${maxPageNum}`);
    
    const sprintChecklist = completionPage.querySelector('.sprint-checklist');
    const checklistItems = completionPage.querySelectorAll('.sprint-checklist .checklist-item');
    
    let animationStarted = false;
    let currentIndex = 0;
    const animationDuration = 1300; // 1.3 seconds between items
    const hideDelay = 500; // Shorter delay before hiding all items
    
    // Observer to watch when the completion page becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const displayStyle = window.getComputedStyle(completionPage).display;
                if (displayStyle !== 'none' && !animationStarted) {
                    // Completion page is now visible, start the animation
                    setTimeout(() => {
                        startAnimation();
                    }, 300); // Small delay before starting
                }
            }
        });
    });
    
    // Start observing the completion page for style changes
    observer.observe(completionPage, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    function startAnimation() {
        if (animationStarted) {
            return; // Prevent multiple starts
        }
        animationStarted = true;
        
        console.log('🎬 Starting completion page animation');
        
        // If no checklist items, run simplified animation
        if (checklistItems.length === 0) {
            // Blink dots animate for 3 seconds, then hide and show status lines
            setTimeout(() => {
                showStatusLines();
            }, 3000); // 3 seconds
            return;
        }
        
        // Make checklist visible
        if (sprintChecklist) {
            sprintChecklist.style.opacity = '1';
            sprintChecklist.style.visibility = 'visible';
        }
        
        // Initialize: Set first item as active and shown, others as inactive
        checklistItems.forEach((item, index) => {
            if (index === 0) {
                item.classList.add('active', 'shown');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Start moving to next item after the first item's animation duration
        setTimeout(() => {
            moveToNextItem();
        }, animationDuration);
    }
    
    function moveToNextItem() {
        // Remove active class from current item (but keep it shown)
        if (checklistItems[currentIndex]) {
            checklistItems[currentIndex].classList.remove('active');
        }
        
        // Check if this was the last item
        if (currentIndex === checklistItems.length - 1) {
            // After the last item fades to 0.5 opacity, hide all items (shorter delay)
            setTimeout(() => {
                checklistItems.forEach(item => {
                    item.classList.remove('shown', 'active');
                });
                
                showStatusLines();
            }, hideDelay);
            return;
        }
        
        // Move to next item
        currentIndex++;
        
        // Add active and shown classes to new current item
        if (currentIndex < checklistItems.length && checklistItems[currentIndex]) {
            checklistItems[currentIndex].classList.add('active', 'shown');
            
            // Continue animation after duration
            setTimeout(() => {
                moveToNextItem();
            }, animationDuration);
        }
    }
    
    function showStatusLines() {
        console.log('🎬 Starting status line animation for completion page');
        
        // Hide the blinking dots after animation completes
        const blinkDots = completionPage.querySelectorAll('.blink-dot');
        console.log(`   └─ Found ${blinkDots.length} blink dots to hide`);
        blinkDots.forEach(dot => {
            dot.style.display = 'none';
        });
        
        // Show the hidden status lines after checklist animation completes
        const statusLines = completionPage.querySelectorAll('.status-container .status-line');
        console.log(`   └─ Found ${statusLines.length} status lines`);
        
        if (statusLines.length > 1) {
            // Show second status line
            setTimeout(() => {
                statusLines[1].style.display = 'block';
                console.log('   └─ Status line 2 displayed');
                
                // Show third status line after a brief delay
                setTimeout(() => {
                    statusLines[2].style.display = 'block';
                    console.log('   └─ Status line 3 displayed');
                    
                    // After success message appears, update progress line to 100% and change colors
                    setTimeout(() => {
                        const progressLine = document.querySelector('.progress-line');
                        const entitySignalLabel = document.querySelector('.entity-signal-label');
                        const notificationDot = document.querySelector('.notification-dot');
                        
                        if (progressLine) {
                            // Update the fill percentage
                            progressLine.style.setProperty('--progress-fill', '100%');
                            // Add a custom CSS variable for the green color
                            progressLine.style.setProperty('--progress-color', 'var(--color-bright-green)');
                            // Add a class to change the color
                            progressLine.classList.add('complete');
                        }
                        
                        if (entitySignalLabel) {
                            entitySignalLabel.style.color = 'var(--color-bright-green)';
                        }
                        
                        if (notificationDot) {
                            setTimeout(() => {
                                notificationDot.style.backgroundColor = 'var(--color-bright-green)';
                                notificationDot.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.8)';
                                
                                // Dispatch completion animation finished event
                                window.dispatchEvent(new CustomEvent('sprintCardAnimationComplete'));
                                console.log('✓ Sprint card animation complete event dispatched');
                            }, 400);
                        }
                    }, 100);
                }, 800);
            }, 500);
        } else {
            console.warn('⚠️ Not enough status lines found for animation');
        }
    }
}

// Initialize on DOMContentLoaded as fallback
document.addEventListener('DOMContentLoaded', function() {
    initCompletionAnimation();
});

// Expose globally so sprintPlan.js can call it
window.initCompletionAnimation = initCompletionAnimation;
