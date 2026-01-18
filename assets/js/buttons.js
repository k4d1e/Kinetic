document.addEventListener('DOMContentLoaded', () => {
  // 1. Select ALL slider wrappers on the page (Module 1, Module 2, etc.)
  const allSliders = document.querySelectorAll('.slider-wrapper');

  // 2. Iterate through each slider individually
  allSliders.forEach(sliderWrapper => {
    
    // Scope variables to THIS specific slider instance
    const track = sliderWrapper.querySelector('.card-track');
    const prevButton = sliderWrapper.querySelector('.nav-arrow[aria-label="Previous"]');
    const nextButton = sliderWrapper.querySelector('.nav-arrow[aria-label="Next"]');

    // Safety check: ensure all parts exist in this wrapper before adding logic
    if (!track || !prevButton || !nextButton) return;

    // 3. Dynamic Scroll Calculation
    // We calculate this specific track's card width to support different card types
    const getScrollAmount = () => {
      const firstCard = track.firstElementChild; // Works for .seo-card OR .market-card
      if (!firstCard) return 300; // Fallback if empty

      const cardWidth = firstCard.offsetWidth;
      
      // Get the actual gap from CSS (handles the 24px gap defined in layout.css)
      const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
      
      return cardWidth + gap;
    };

    // 4. Attach Event Listeners
    nextButton.addEventListener('click', () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: 'smooth'
      });
    });

    prevButton.addEventListener('click', () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: 'smooth'
      });
    });
    
  });
});