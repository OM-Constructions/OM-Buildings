import { getCurrentUser } from './auth.js';

/**
 * Service Page Authentication Guard
 * Protects all /services/* detail pages.
 * If the visitor is not logged in, immediately redirects to login with return redirect.
 */
(async function enforceServiceAuth() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            triggerRedirect();
        } else {
            // User is authenticated, reveal content if initially guarded
            document.documentElement.classList.add('client-authenticated');
            const guardEl = document.getElementById('service-auth-loading-guard');
            if (guardEl) {
                guardEl.remove();
            }
        }
    } catch (err) {
        console.warn('Service guard auth check failed:', err);
        triggerRedirect();
    }

    function triggerRedirect() {
        const currentPath = window.location.pathname + (window.location.search || '') + (window.location.hash || '');
        const targetUrl = `../../login.html?redirect=${encodeURIComponent(currentPath)}&reason=service_access`;
        window.location.replace(targetUrl);
    }
})();
