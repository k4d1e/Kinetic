// typingEffect.js - Typing animation for greeting title and sprint title

document.addEventListener('DOMContentLoaded', function() {
    const greetingTextElement = document.getElementById('greeting-typing-text');
    const sprintTextElement = document.getElementById('sprint-typing-text');
    
    if (!greetingTextElement || !sprintTextElement) {
        return; // Exit if elements don't exist
    }
    
    const greetingText = 'Good Morning, Kadie';
    const sprintText = 'Your SEO Sprint Plan';
    const typingSpeed = 100; // milliseconds per character
    
    // Function to type text into an element
    function typeText(element, text, callback) {
        let currentIndex = 0;
        
        function typeCharacter() {
            if (currentIndex < text.length) {
                element.textContent += text[currentIndex];
                currentIndex++;
                setTimeout(typeCharacter, typingSpeed);
            } else {
                // Typing complete, call callback if provided
                if (callback) {
                    callback();
                }
            }
        }
        
        typeCharacter();
    }
    
    // Function to start the typing animation sequence
    let animationStarted = false;
    function startTypingAnimation() {
        if (animationStarted) return; // Prevent double-start
        animationStarted = true;
        
        console.log('✓ Starting typing animation');
        
        // Wait 0.3 seconds before starting the greeting
        setTimeout(function() {
            // Start with greeting title, then sprint title after it finishes
            typeText(greetingTextElement, greetingText, function() {
                // After greeting finishes, start sprint title
                typeText(sprintTextElement, sprintText, function() {
                    // After sprint title finishes, show the checklist
                    const sprintChecklist = document.querySelector('.sprint-checklist');
                    if (sprintChecklist) {
                        sprintChecklist.style.opacity = '1';
                        sprintChecklist.style.visibility = 'visible';
                        // Dispatch custom event to start checklist animation
                        sprintChecklist.dispatchEvent(new CustomEvent('checklistVisible'));
                    }
                });
            });
        }, 500); // 0.5 second delay
    }
    
    // Always listen for onboarding completion event
    window.addEventListener('onboardingComplete', function() {
        console.log('✓ Received onboardingComplete event');
        startTypingAnimation();
    }, { once: true });
    
    // Wait for onboarding.js to initialize and check if onboarding will run
    // We delay this check to give onboarding.js time to add the 'onboarding-active' class
    setTimeout(function() {
        const isOnboardingActive = document.body.classList.contains('onboarding-active');
        
        if (isOnboardingActive) {
            console.log('⏳ Onboarding is active, waiting for completion...');
        } else {
            // Onboarding won't run or was skipped, start animation now if event wasn't fired yet
            console.log('✓ Onboarding not active, starting animation');
            startTypingAnimation();
        }
    }, 200); // Wait 200ms for onboarding to initialize
});
