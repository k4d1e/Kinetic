// checklistAnimation.js - Animated checklist with moving spinner

document.addEventListener('DOMContentLoaded', function() {
    // Select the checklist inside page 6 specifically
    const page6 = document.querySelector('.sprint-card-page[data-page="6"]');
    if (!page6) return;
    
    const sprintChecklist = page6.querySelector('.sprint-checklist');
    const checklistItems = page6.querySelectorAll('.sprint-checklist .checklist-item');
    
    if (checklistItems.length === 0) {
        return; // Exit if no checklist items found
    }
    
    let animationStarted = false;
    let currentIndex = 0;
    const animationDuration = 1300; // 1.3 seconds between items
    const hideDelay = 500; // Shorter delay before hiding all items
    
    // Observer to watch when page 6 becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const displayStyle = window.getComputedStyle(page6).display;
                if (displayStyle !== 'none' && !animationStarted) {
                    // Page 6 is now visible, start the animation
                    setTimeout(() => {
                        startAnimation();
                    }, 300); // Small delay before starting
                }
            }
        });
    });
    
    // Start observing page 6 for style changes
    observer.observe(page6, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    function startAnimation() {
        if (animationStarted) {
            return; // Prevent multiple starts
        }
        animationStarted = true;
        
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
                
                // Hide the blinking dots after animation completes
                const blinkDots = document.querySelectorAll('.blink-dot');
                blinkDots.forEach(dot => {
                    dot.style.display = 'none';
                });
                
                // Show the hidden status lines after checklist animation completes
                const statusLines = document.querySelectorAll('.status-container .status-line');
                if (statusLines.length > 1) {
                    // Show second status line
                    setTimeout(() => {
                        statusLines[1].style.display = 'block';
                        
                        // Show third status line after a brief delay
                        setTimeout(() => {
                            statusLines[2].style.display = 'block';
                            
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
                                    }, 400);
                                }
                            }, 100);
                        }, 800);
                    }, 500);
                }
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
});
