// checklistAnimation.js - Animated checklist with moving spinner

document.addEventListener('DOMContentLoaded', function() {
    const sprintChecklist = document.querySelector('.sprint-checklist');
    const checklistItems = document.querySelectorAll('.sprint-checklist .checklist-item');
    
    if (checklistItems.length === 0) {
        return; // Exit if no checklist items found
    }
    
    let animationStarted = false;
    let currentIndex = 0;
    const animationDuration = 1300; // 1.3 seconds between items
    const hideDelay = 500; // Shorter delay before hiding all items
    
    function startAnimation() {
        if (animationStarted) {
            return; // Prevent multiple starts
        }
        animationStarted = true;
        
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
    
    // Listen for the custom event when checklist becomes visible
    if (sprintChecklist) {
        sprintChecklist.addEventListener('checklistVisible', startAnimation);
    }
});
