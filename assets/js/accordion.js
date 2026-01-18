document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.city-accordion-card');
        const isExpanded = card.classList.contains('is-expanded');
        
        // Toggle Class
        card.classList.toggle('is-expanded');
        
        // Toggle ARIA
        header.setAttribute('aria-expanded', !isExpanded);
    });
});