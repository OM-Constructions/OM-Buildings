/**
 * blueprint-sync.js
 * Handles the seamless background animation syncing and page transitions 
 * between the authentication pages (login.html and signup.html).
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync the background animations to a global clock
    // This ensures that when the page reloads, the CSS animations 
    // pick up exactly where they left off, creating a seamless background.
    const syncAnimations = () => {
        const animatedElements = document.querySelectorAll('.blueprint-line');
        const now = Date.now();
        
        animatedElements.forEach(el => {
            // Read duration from computed style (e.g., "25s")
            const style = window.getComputedStyle(el);
            const durationStr = style.animationDuration || "25s";
            const durationMs = parseFloat(durationStr) * 1000;
            
            if (durationMs > 0) {
                // Read any pre-existing delay assigned via CSS classes (like .bp-1, .bp-2)
                const baseDelayStr = style.animationDelay || "0s";
                const baseDelayMs = parseFloat(baseDelayStr) * 1000;
                
                // Calculate elapsed time within the global cycle
                const elapsed = now % durationMs;
                
                // Calculate new negative delay
                // CSS negative delay means "start the animation as if it had already been running for this long"
                const syncDelayMs = -(elapsed) + baseDelayMs;
                
                el.style.animationDelay = `${syncDelayMs}ms`;
            }
        });
    };

    syncAnimations();

    // 2. Handle Page Entrance Transition
    const authCard = document.querySelector('.auth-card');
    const bgContainer = document.querySelector('.blueprint-animation-container');
    const pageWrapper = document.querySelector('.auth-page-wrapper');
    
    // Check URL params for transition direction
    const urlParams = new URLSearchParams(window.location.search);
    const transitionType = urlParams.get('nav_transition');
    
    if (authCard) {
        if (transitionType === 'from_signup') {
            // Arriving at Login from Signup
            authCard.classList.add('page-enter-right');
            bgContainer.classList.add('blueprint-sweep-right');
            pageWrapper.classList.add('bg-sweep-right');
        } else if (transitionType === 'from_login') {
            // Arriving at Signup from Login
            authCard.classList.add('page-enter-left');
            bgContainer.classList.add('blueprint-sweep-left');
            pageWrapper.classList.add('bg-sweep-left');
        } else {
            // Direct load
            authCard.classList.add('page-enter-direct');
        }
        
        // Trigger reflow
        void authCard.offsetWidth;
        
        // Remove classes to animate in
        requestAnimationFrame(() => {
            authCard.classList.remove('page-enter-right', 'page-enter-left', 'page-enter-direct');
            if (bgContainer) bgContainer.classList.remove('blueprint-sweep-right', 'blueprint-sweep-left');
            if (pageWrapper) pageWrapper.classList.remove('bg-sweep-right', 'bg-sweep-left');
        });
        
        // Clean URL to avoid repeating on refresh
        if (transitionType) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // 3. Handle Page Exit Transition
    const transitionLinks = document.querySelectorAll('a[href="./login.html"], a[href="./signup.html"]');
    
    transitionLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const targetUrl = e.currentTarget.href;
            
            if (targetUrl.includes('login.html') || targetUrl.includes('signup.html')) {
                e.preventDefault();
                
                const isGoingToLogin = targetUrl.includes('login.html');
                
                if (authCard) {
                    if (isGoingToLogin) {
                        // We are currently on Signup, moving left
                        authCard.classList.add('page-exit-left');
                        if (bgContainer) bgContainer.classList.add('blueprint-sweep-right');
                        if (pageWrapper) pageWrapper.classList.add('bg-sweep-right');
                    } else {
                        // We are currently on Login, moving right (symmetrical)
                        authCard.classList.add('page-exit-right');
                        if (bgContainer) bgContainer.classList.add('blueprint-sweep-left');
                        if (pageWrapper) pageWrapper.classList.add('bg-sweep-left');
                    }
                }
                
                // Wait for the transition (750ms) before actual navigation
                setTimeout(() => {
                    const params = isGoingToLogin ? '?nav_transition=from_signup' : '?nav_transition=from_login';
                    window.location.href = targetUrl + params;
                }, 750);
            }
        });
    });
});
