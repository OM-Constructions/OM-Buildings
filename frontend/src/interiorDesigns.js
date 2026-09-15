const interiorDesignsList = [
    { src: 'botanical-bedroom.png', title: 'BOTANICAL BEDROOM' },
    { src: 'ceiling-design.png', title: 'CEILING DESIGN' },
    { src: 'classic-living-room.png', title: 'CLASSIC LIVING ROOM' },
    { src: 'contemporary-bedroom.png', title: 'CONTEMPORARY BEDROOM' },
    { src: 'contemporary-dining-room.png', title: 'CONTEMPORARY DINING ROOM' },
    { src: 'dining-area.png', title: 'DINING AREA' },
    { src: 'executive-living-room.png', title: 'EXECUTIVE LIVING ROOM' },
    { src: 'executive-office-01.png', title: 'EXECUTIVE OFFICE' },
    { src: 'executive-office-02.png', title: 'EXECUTIVE OFFICE 2' },
    { src: 'modern-balcony.png', title: 'MODERN BALCONY' },
    { src: 'modern-living-room-03.png', title: 'MODERN LIVING ROOM' },
    { src: 'modern-living-room-04.png', title: 'MODERN LIVING ROOM 2' },
    { src: 'modern-reception-area.png', title: 'MODERN RECEPTION AREA' },
    { src: 'modern-tv-lounge.png', title: 'MODERN TV LOUNGE' },
    { src: 'modern-tv-unit.png', title: 'MODERN TV UNIT' },
    { src: 'modern-vanity-room.png', title: 'MODERN VANITY ROOM' },
    { src: 'modular-kitchen.png', title: 'MODULAR KITCHEN' },
    { src: 'pooja-room.png', title: 'POOJA ROOM' },
    { src: 'staircase-living-room.png', title: 'STAIRCASE LIVING ROOM' }
];

function renderInteriorDesigns(containerId, isHomepage = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear the container in case of hardcoded fallbacks
    container.innerHTML = '';

    const designsToRender = isHomepage ? interiorDesignsList.slice(0, 8) : interiorDesignsList;

    designsToRender.forEach(design => {
        const card = document.createElement('div');
        if (isHomepage) {
            card.className = 'work-card';
            card.innerHTML = `
                <img src="./assets/designs/${design.src}" alt="${design.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <span class="work-label" style="z-index: 2; pointer-events: none;">${design.title}</span>
            `;
        } else {
            card.className = 'gallery-card';
            card.innerHTML = `
                <img src="./assets/designs/${design.src}" alt="${design.title}" loading="lazy">
                <div class="gallery-label">${design.title}</div>
            `;
        }
        container.appendChild(card);
    });
}
