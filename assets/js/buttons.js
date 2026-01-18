document.addEventListener('DOMContentLoaded', () => {
    // 1. Select the track and the buttons
    const track = document.querySelector('.card-track');
    const prevButton = document.querySelector('.nav-arrow[aria-label="Previous"]');
    const nextButton = document.querySelector('.nav-arrow[aria-label="Next"]');
  
    // Safety check to ensure elements exist
    if (!track || !prevButton || !nextButton) return;
  
    // 2. Function to calculate scroll distance
    // We compute this dynamically in case you change card width in CSS later
    const getScrollAmount = () => {
      const card = track.querySelector('.seo-card');
      if (!card) return 304; // Fallback (280px width + 24px gap)
      
      const cardWidth = card.offsetWidth;
      const gap = 24; // Matches the gap defined in layout.css
      return cardWidth + gap;
    };
  
    // 3. Add Event Listeners
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