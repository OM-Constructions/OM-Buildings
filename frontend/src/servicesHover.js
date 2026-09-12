export function initServicesHover() {
    const cards = document.querySelectorAll('.service-card');
    const grid = document.querySelector('.services-grid');

    if (!cards.length || !grid) return;

    let activeIndex = -1;
    let hoverTimeout = null;

    cards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            // Cancel any pending clears so the layout stays perfectly stable
            if (hoverTimeout) clearTimeout(hoverTimeout);
            
            // If this card is already the active one, do nothing
            if (activeIndex === index) return;
            
            // Immediately deactivate all other cards to prevent stacking
            cards.forEach(c => c.classList.remove('is-active'));
            
            // Activate the newly hovered card
            card.classList.add('is-active');
            activeIndex = index;

            // Update the grid wrapper to reflect which column is expanding
            // We use columns 0, 1, 2 for the math (0 = left, 1 = middle, 2 = right)
            const col = index % 3;
            grid.classList.remove('active-col-0', 'active-col-1', 'active-col-2');
            grid.classList.add(`active-col-${col}`);
        });

        card.addEventListener('mouseleave', () => {
            // Wait 50ms before clearing. 
            // If the user is just moving to a neighboring card, the 'mouseenter' on that 
            // next card will cancel this timeout, preventing the grid from abruptly collapsing
            // and shaking the layout.
            hoverTimeout = setTimeout(() => {
                card.classList.remove('is-active');
                activeIndex = -1;
                grid.classList.remove('active-col-0', 'active-col-1', 'active-col-2');
            }, 50);
        });
    });
}
