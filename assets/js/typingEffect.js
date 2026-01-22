// typingEffect.js - Typing animation for greeting title and sprint title

document.addEventListener('DOMContentLoaded', function() {
    const greetingTextElement = document.getElementById('greeting-typing-text');
    const sprintTextElement = document.getElementById('sprint-typing-text');
    
    if (!greetingTextElement || !sprintTextElement) {
        return; // Exit if elements don't exist
    }
    
    const greetingText = 'Hello, Kadie';
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
});
