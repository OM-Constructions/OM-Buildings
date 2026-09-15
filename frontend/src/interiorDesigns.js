const interiorDesignsList = [
    { src: 'botanical-bedroom.webp', title: 'MASTER BEDROOM' },
    { src: 'classic-living-room.webp', title: 'CLASSIC LIVING ROOM' },
    { src: 'contemporary-bedroom.webp', title: 'CONTEMPORARY BEDROOM' },
    { src: 'contemporary-dining-room.webp', title: 'CONTEMPORARY DINING ROOM' },
    { src: 'pooja-room.webp', title: 'POOJA ROOM' },
    { src: 'executive-living-room.webp', title: 'EXECUTIVE LIVING ROOM' },
    { src: 'executive-office-01.webp', title: 'EXECUTIVE OFFICE' },
    { src: 'executive-office-02.webp', title: 'EXECUTIVE OFFICE 2' },
    { src: 'modern-balcony.webp', title: 'MODERN BALCONY' },
    { src: 'modern-living-room-03.webp', title: 'MODERN LIVING ROOM' },
    { src: 'modern-living-room-04.webp', title: 'MODERN LIVING ROOM 2' },
    { src: 'modern-reception-area.webp', title: 'MODERN RECEPTION AREA' },
    { src: 'modern-tv-lounge.webp', title: 'MODERN TV LOUNGE' },
    { src: 'modern-tv-unit.webp', title: 'MODERN TV UNIT' },
    { src: 'modern-vanity-room.webp', title: 'MODERN VANITY ROOM' },
    { src: 'modular-kitchen.webp', title: 'MODULAR KITCHEN' },
    { src: 'staircase-living-room.webp', title: 'STAIRCASE LIVING ROOM' }
];

function renderInteriorDesigns(containerId, isHomepage = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear the container in case of hardcoded fallbacks
    container.innerHTML = '';

    const designsToRender = isHomepage ? interiorDesignsList.slice(0, 8) : interiorDesignsList;

    designsToRender.forEach(design => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        // Set aspect-ratio on the card to prevent layout shift
        card.style.aspectRatio = '1.5 / 1';
        card.style.overflow = 'hidden';
        
        // Add tabIndex so it's accessible via keyboard
        card.tabIndex = 0;
        
        card.innerHTML = `
            <img src="./assets/designs/${design.src}" alt="${design.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;">
            <div class="gallery-label">${design.title}</div>
        `;
        container.appendChild(card);
    });
}
