import { submitEnquiry } from './api.js';
import { 
    getCurrentUser, 
    isStoredUserLoggedIn, 
    getStoredToken,
    initAuth,
    waitForAuth,
    isAuthLoading,
    getCachedUser
} from './auth.js';

// This map must stay in sync with backend/app/services/service_catalog.py
const SERVICE_SLUGS = {
    "Architectural Design": "architectural-design",
    "Architectural 2D Plans": "architectural-2d-plans",
    "Structural Design": "structural-design",
    "Project Planning": "project-planning",
    "Interior Design": "interior-design",
    "Geotechnical Report": "geotechnical-report",
    "MEP Designs": "mep-designs",
    "3D Building Design": "3d-building-design",
    "Realistic Rendering": "realistic-rendering",
    "Estimation & Costing": "estimation-costing",
    "Construction Cost": "estimation-costing",
    "Construction Cost Estimation": "estimation-costing"
};

/**
 * Resolves visible service title to canonical name and slug in SERVICE_SLUGS.
 */
function resolveServiceSlug(rawTitle) {
    if (!rawTitle) return { name: 'Project Planning', slug: 'project-planning' };
    const trimmed = rawTitle.trim();
    if (SERVICE_SLUGS[trimmed]) {
        return { name: trimmed, slug: SERVICE_SLUGS[trimmed] };
    }
    const lower = trimmed.toLowerCase();
    for (const [name, slug] of Object.entries(SERVICE_SLUGS)) {
        if (name.toLowerCase() === lower || lower.includes(name.toLowerCase())) {
            return { name, slug };
        }
    }
    return { name: trimmed, slug: 'project-planning' };
}

/**
 * Helper to check whether user is authenticated based on local storage credentials or cached user.
 */
function isUserAuthenticated() {
    return isStoredUserLoggedIn() || !!getStoredToken() || !!getCachedUser();
}

/**
 * Main initialization entry point.
 * Note: Homepage service cards remain clean navigation links without enquiry tags.
 */
export async function initServiceContactCards() {
    // Start auth verification immediately in background
    initAuth();

    // 1. Target Service Detail Pages (Dedicated Enquiry Box)
    initServiceDetailPageEnquiry();

    // 2. Target Global Project Enquiry Card (#cta)
    initGlobalEnquiryForm();
}

/**
 * Initializes the enquiry form on Service Detail Pages (/services/[slug]/index.html)
 */
export function initServiceDetailPageEnquiry() {
    // Deduplicate any duplicate enquiry boxes if present
    const allBoxes = Array.from(document.querySelectorAll('.service-enquiry-box, #service-detail-enquiry-box'));
    if (allBoxes.length > 1) {
        // Keep the first static box, remove all extra duplicates
        for (let i = 1; i < allBoxes.length; i++) {
            allBoxes[i].remove();
        }
    }
    const strayPanels = document.querySelectorAll('.service-page-auth-panel');
    strayPanels.forEach(p => p.remove());

    const box = document.getElementById('service-detail-enquiry-box') || allBoxes[0];
    if (!box) return;

    if (box.dataset.enquiryBound === 'true') return;
    box.dataset.enquiryBound = 'true';

    // Watch for any dynamically injected duplicate box and remove immediately
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
            const boxes = document.querySelectorAll('.service-enquiry-box');
            if (boxes.length > 1) {
                for (let i = 1; i < boxes.length; i++) {
                    boxes[i].remove();
                }
            }
        });
        const ctaSec = document.querySelector('.sp-cta') || document.body;
        if (ctaSec) {
            observer.observe(ctaSec, { childList: true, subtree: true });
        }
    }

    const serviceSlug = box.getAttribute('data-service-slug') || 'project-planning';
    const form = box.querySelector('#form-service-detail-enquiry');
    if (!form) return;

    const successEl = box.querySelector('.service-enquiry-success');
    const errorEl = box.querySelector('.service-enquiry-error');
    const submitBtn = box.querySelector('.service-enquiry-submit-btn');

    const isServicePage = typeof window !== 'undefined' && window.location.pathname.includes('/services/');
    const loginPath = isServicePage ? '../../login.html' : './login.html';

    // Helper to render verified client badge
    function renderStatusBar(user) {
        let statusBar = box.querySelector('.client-portal-status-bar');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'client-portal-status-bar';
            statusBar.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; margin-bottom: 20px;';
            form.parentNode.insertBefore(statusBar, form);
        }
        const emailPart = user && user.email ? ` <span style="color: #64748b;">(${escapeHTML(user.email)})</span>` : '';
        const namePart = (user && user.name) || localStorage.getItem('om_user_name') || 'Account';
        statusBar.innerHTML = `
            <div class="client-portal-user-info" style="color: #0f172a;">
                <span class="client-status-indicator"></span>
                <span>Verified Client: <strong>${escapeHTML(namePart)}</strong>${emailPart}</span>
            </div>
            <a href="${isServicePage ? '../../my-requests.html' : './my-requests.html'}" class="client-portal-link" style="color: #07152F;">
                Open Client Portal &rarr;
            </a>
        `;
    }

    // Immediate pre-fill from stored local data if user is logged in
    const storedName = localStorage.getItem('om_user_name');
    if (isUserAuthenticated() && storedName) {
        if (form.elements.name && !form.elements.name.value) {
            form.elements.name.value = storedName;
        }
        renderStatusBar({ name: storedName, email: '' });
    }

    // Restore draft if present
    let savedDraft = null;
    try {
        const rawDraft = sessionStorage.getItem('om_service_detail_enquiry_' + serviceSlug);
        if (rawDraft) savedDraft = JSON.parse(rawDraft);
    } catch (e) { }

    if (savedDraft) {
        if (!isUserAuthenticated() && form.elements.name && savedDraft.name) form.elements.name.value = savedDraft.name;
        if (!isUserAuthenticated() && form.elements.email && savedDraft.email) form.elements.email.value = savedDraft.email;
        if (form.elements.phone && savedDraft.phone) form.elements.phone.value = savedDraft.phone;
        if (form.elements.message && savedDraft.message) form.elements.message.value = savedDraft.message;
    }

    // Update verified badge once async auth resolves
    waitForAuth().then(user => {
        if (user) {
            if (form.elements.name && (!form.elements.name.value || form.elements.name.value === '')) {
                form.elements.name.value = user.name || '';
            }
            if (form.elements.email && (!form.elements.email.value || form.elements.email.value === '')) {
                form.elements.email.value = user.email || '';
            }
            renderStatusBar(user);
        } else if (!isUserAuthenticated()) {
            const statusBar = box.querySelector('.client-portal-status-bar');
            if (statusBar) statusBar.remove();
        }
    }).catch(err => {
        console.warn('Background auth check in service detail:', err.message);
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = form.elements.name ? form.elements.name.value.trim() : '';
        const email = form.elements.email ? form.elements.email.value.trim() : '';
        const phone = form.elements.phone ? form.elements.phone.value.trim() : '';
        const message = form.elements.message ? form.elements.message.value.trim() : '';
        const honeypot = form.elements.website ? form.elements.website.value : '';

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry &rarr;';

        // 1. Wait for authentication state if necessary
        if (isAuthLoading()) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Verifying session...';
            }
            try {
                await waitForAuth();
            } catch (authErr) {
                console.warn('Auth check error while submitting:', authErr);
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }

        // 2. Get current authenticated user/session
        const user = getCachedUser() || (isStoredUserLoggedIn() ? { name: localStorage.getItem('om_user_name') || 'Client', email: '' } : null);
        const authenticated = isUserAuthenticated() || !!user;

        // 3. If no authenticated user: save draft and redirect to login
        if (!authenticated) {
            try {
                sessionStorage.setItem('om_service_detail_enquiry_' + serviceSlug, JSON.stringify({ name, email, phone, message }));
            } catch (err) { }
            const returnUrl = encodeURIComponent(window.location.pathname + (window.location.search || '') + '#service-detail-enquiry-box');
            window.location.href = `${loginPath}?redirect=${returnUrl}&reason=enquiry_submit`;
            return false;
        }

        // 4. If authenticated: DO NOT REDIRECT! Submit enquiry
        if (errorEl) errorEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }

        try {
            await submitEnquiry({
                name: name || (user && user.name) || (localStorage.getItem('om_user_name') || 'Client'),
                email: email || (user && user.email) || '',
                phone: phone || null,
                serviceSlug: serviceSlug,
                message,
                honeypot: honeypot || ''
            });

            try {
                sessionStorage.removeItem('om_service_detail_enquiry_' + serviceSlug);
            } catch (err) { }

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Service page enquiry error:', err);
            // Only redirect if backend explicitly returns 401 unauthorized (session expired)
            if (err.status === 401 || (err.message && (err.message.includes('401') || err.message.includes('Not authenticated')))) {
                try {
                    localStorage.removeItem('om_logged_in');
                    localStorage.removeItem('om_auth_token');
                    sessionStorage.setItem('om_service_detail_enquiry_' + serviceSlug, JSON.stringify({ name, email, phone, message }));
                } catch (e) { }
                const returnUrl = encodeURIComponent(window.location.pathname + (window.location.search || '') + '#service-detail-enquiry-box');
                window.location.href = `${loginPath}?redirect=${returnUrl}&reason=enquiry_submit`;
                return;
            }
            if (errorEl) {
                errorEl.textContent = err.message || 'Failed to send your enquiry. Please check your connection or contact us directly.';
                errorEl.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });
}

/**
 * Initializes the global project enquiry form on the Homepage (#cta)
 */
export function initGlobalEnquiryForm() {
    const card = document.getElementById('global-enquiry-box');
    if (!card) return;

    const authGate = card.querySelector('#global-enquiry-auth-gate');
    if (authGate) authGate.style.display = 'none';

    const formWrapper = card.querySelector('#global-enquiry-form-wrapper');
    if (formWrapper) formWrapper.style.display = 'block';

    const form = document.getElementById('global-enquiry-form');
    if (!form) return;
    form.style.display = 'block';

    const successEl = card.querySelector('.global-enquiry-success');
    const errorEl = form.querySelector('.global-enquiry-error');
    const submitBtn = form.querySelector('.global-enquiry-submit-btn');

    // Helper to render verified client badge
    function renderGlobalStatusBar(user) {
        let statusBar = card.querySelector('.client-portal-status-bar');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'client-portal-status-bar';
            form.parentNode.insertBefore(statusBar, form);
        }
        const emailPart = user && user.email ? ` <span style="color: rgba(255, 255, 255, 0.65);">(${escapeHTML(user.email)})</span>` : '';
        const namePart = (user && user.name) || localStorage.getItem('om_user_name') || 'Account';
        statusBar.innerHTML = `
            <div class="client-portal-user-info">
                <span class="client-status-indicator"></span>
                <span>Verified Client: <strong>${escapeHTML(namePart)}</strong>${emailPart}</span>
            </div>
            <a href="./my-requests.html" class="client-portal-link">
                Open Client Portal &rarr;
            </a>
        `;
    }

    // Immediate pre-fill from stored local data if user is logged in
    const storedName = localStorage.getItem('om_user_name');
    if (isUserAuthenticated() && storedName) {
        if (form.elements.name && !form.elements.name.value) {
            form.elements.name.value = storedName;
        }
        renderGlobalStatusBar({ name: storedName, email: '' });
    }

    // Restore draft if present
    let savedDraft = null;
    try {
        const rawDraft = sessionStorage.getItem('om_global_enquiry_draft');
        if (rawDraft) savedDraft = JSON.parse(rawDraft);
    } catch (e) { }

    if (savedDraft) {
        if (!isUserAuthenticated() && form.elements.name && savedDraft.name) form.elements.name.value = savedDraft.name;
        if (!isUserAuthenticated() && form.elements.email && savedDraft.email) form.elements.email.value = savedDraft.email;
        if (form.elements.phone && savedDraft.phone) form.elements.phone.value = savedDraft.phone;
        if (form.elements.service_slug && savedDraft.service_slug) form.elements.service_slug.value = savedDraft.service_slug;
        if (form.elements.location && savedDraft.location) form.elements.location.value = savedDraft.location;
        if (form.elements.area && savedDraft.area) form.elements.area.value = savedDraft.area;
        if (form.elements.message && savedDraft.message) form.elements.message.value = savedDraft.message;
    }

    // Update verified badge once async auth resolves
    waitForAuth().then(user => {
        if (user) {
            if (form.elements.name && (!form.elements.name.value || form.elements.name.value === '')) {
                form.elements.name.value = user.name || '';
            }
            if (form.elements.email && (!form.elements.email.value || form.elements.email.value === '')) {
                form.elements.email.value = user.email || '';
            }
            renderGlobalStatusBar(user);
        } else if (!isUserAuthenticated()) {
            const statusBar = card.querySelector('.client-portal-status-bar');
            if (statusBar) statusBar.remove();
        }
    }).catch(err => {
        console.warn('Background auth check in global form:', err.message);
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = form.elements.name ? form.elements.name.value.trim() : '';
        const email = form.elements.email ? form.elements.email.value.trim() : '';
        const phone = form.elements.phone ? form.elements.phone.value.trim() : '';
        const serviceSlug = form.elements.service_slug ? form.elements.service_slug.value : 'project-planning';
        const locationVal = form.elements.location ? form.elements.location.value.trim() : '';
        const areaVal = form.elements.area ? form.elements.area.value.trim() : '';
        const rawMessage = form.elements.message ? form.elements.message.value.trim() : '';
        const honeypot = form.elements.website ? form.elements.website.value : '';

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Project Enquiry &rarr;';

        // 1. Wait for authentication state if necessary
        if (isAuthLoading()) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Verifying session...';
            }
            try {
                await waitForAuth();
            } catch (authErr) {
                console.warn('Auth check error while submitting global form:', authErr);
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }

        // 2. Get current authenticated user/session
        const user = getCachedUser() || (isStoredUserLoggedIn() ? { name: localStorage.getItem('om_user_name') || 'Client', email: '' } : null);
        const authenticated = isUserAuthenticated() || !!user;

        // 3. If no authenticated user: save draft and redirect to login
        if (!authenticated) {
            try {
                sessionStorage.setItem('om_global_enquiry_draft', JSON.stringify({
                    name, email, phone, service_slug: serviceSlug, location: locationVal, area: areaVal, message: rawMessage
                }));
            } catch (e) { }
            const returnUrl = encodeURIComponent(window.location.pathname + (window.location.search || '') + '#cta');
            window.location.href = `./login.html?redirect=${returnUrl}&reason=enquiry_submit`;
            return false;
        }

        // 4. If authenticated: DO NOT REDIRECT! Submit enquiry
        const metaParts = [];
        if (locationVal) metaParts.push(`Location: ${locationVal}`);
        if (areaVal) metaParts.push(`Approx. Area / Type: ${areaVal}`);

        let message = rawMessage;
        if (metaParts.length > 0) {
            message = `[${metaParts.join(' | ')}]\n\n${rawMessage}`;
        }

        if (errorEl) errorEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }

        try {
            await submitEnquiry({
                name: name || (user && user.name) || (localStorage.getItem('om_user_name') || 'Client'),
                email: email || (user && user.email) || '',
                phone: phone || null,
                serviceSlug: serviceSlug,
                message: message,
                honeypot: honeypot || ''
            });

            try {
                sessionStorage.removeItem('om_global_enquiry_draft');
            } catch (e) { }

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Global enquiry submission error:', err);
            if (err.status === 401 || (err.message && (err.message.includes('401') || err.message.includes('Not authenticated')))) {
                try {
                    localStorage.removeItem('om_logged_in');
                    localStorage.removeItem('om_auth_token');
                } catch (e) { }
                window.location.href = `./login.html?redirect=${encodeURIComponent(window.location.pathname + '#cta')}&reason=enquiry_submit`;
                return;
            }
            if (errorEl) {
                errorEl.textContent = err.message || 'Failed to send your enquiry. Please check your network connection or reach us directly at omengineeringconsultants06@gmail.com.';
                errorEl.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initServiceContactCards);
    } else {
        initServiceContactCards();
    }
}
