import { submitEnquiry } from './api.js';
import { getCurrentUser, isStoredUserLoggedIn } from './auth.js';

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
 * Main initialization entry point.
 * Note: Homepage service cards remain clean navigation links without enquiry tags.
 */
export async function initServiceContactCards() {
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
    const serviceName = box.getAttribute('data-service-name') || 'Project Consultation';

    const form = box.querySelector('#form-service-detail-enquiry');
    if (!form) return;

    const successEl = box.querySelector('.service-enquiry-success');
    const errorEl = box.querySelector('.service-enquiry-error');
    const submitBtn = box.querySelector('.service-enquiry-submit-btn');
    const isServicePage = typeof window !== 'undefined' && window.location.pathname.includes('/services/');

    // Form submission handler (direct submission without mandatory login)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const name = form.elements.name ? form.elements.name.value.trim() : '';
        const email = form.elements.email ? form.elements.email.value.trim() : '';
        const phone = form.elements.phone ? form.elements.phone.value.trim() : '';
        const message = form.elements.message ? form.elements.message.value.trim() : '';
        const honeypot = form.elements.website ? form.elements.website.value : (form.elements.honeypot ? form.elements.honeypot.value : '');

        if (!name || !email || !message) {
            if (errorEl) {
                errorEl.textContent = 'Please fill in all required fields (Name, Email, Message).';
                errorEl.style.display = 'block';
            }
            return;
        }

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry &rarr;';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }
        if (errorEl) errorEl.style.display = 'none';

        try {
            await submitEnquiry({
                name,
                email,
                phone: phone || null,
                serviceSlug: serviceSlug,
                message,
                honeypot: honeypot || ''
            });

            form.reset();
            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Service page enquiry error:', err);
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

    // If user is already logged in, optionally pre-fill information and show portal banner
    getCurrentUser().then(currentUser => {
        if (currentUser) {
            if (form.elements.name && !form.elements.name.value) form.elements.name.value = currentUser.name || '';
            if (form.elements.email && !form.elements.email.value) form.elements.email.value = currentUser.email || '';

            let statusBar = box.querySelector('.client-portal-status-bar');
            if (!statusBar) {
                statusBar = document.createElement('div');
                statusBar.className = 'client-portal-status-bar';
                statusBar.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; margin-bottom: 20px;';
                statusBar.innerHTML = `
                    <div class="client-portal-user-info" style="color: #0f172a;">
                        <span class="client-status-indicator"></span>
                        <span>Logged in as: <strong>${escapeHTML(currentUser.name)}</strong> <span style="color: #64748b;">(${escapeHTML(currentUser.email)})</span></span>
                    </div>
                    <a href="${isServicePage ? '../../my-requests.html' : './my-requests.html'}" class="client-portal-link" style="color: #07152F;">
                        My Requests &rarr;
                    </a>
                `;
                form.parentNode.insertBefore(statusBar, form);
            }
        }
    }).catch(() => {});
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

    // Form submission handler (direct submission without mandatory login)
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
        const honeypot = form.elements.website ? form.elements.website.value : (form.elements.honeypot ? form.elements.honeypot.value : '');

        if (!name || !email || !rawMessage) {
            if (errorEl) {
                errorEl.textContent = 'Please fill in all required fields (Name, Email, Requirements).';
                errorEl.style.display = 'block';
            }
            return;
        }

        // Combine location and area into the project message for comprehensive company context
        const metaParts = [];
        if (locationVal) metaParts.push(`Location: ${locationVal}`);
        if (areaVal) metaParts.push(`Approx. Area / Type: ${areaVal}`);

        let message = rawMessage;
        if (metaParts.length > 0) {
            message = `[${metaParts.join(' | ')}]\n\n${rawMessage}`;
        }

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Project Enquiry &rarr;';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }
        if (errorEl) errorEl.style.display = 'none';

        try {
            await submitEnquiry({
                name,
                email,
                phone: phone || null,
                serviceSlug: serviceSlug,
                message: message,
                honeypot: honeypot || ''
            });

            form.reset();
            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Global enquiry submission error:', err);
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

    // If user is already logged in, pre-fill form fields and show portal status bar
    getCurrentUser().then(currentUser => {
        if (currentUser) {
            if (form.elements.name && !form.elements.name.value) form.elements.name.value = currentUser.name || '';
            if (form.elements.email && !form.elements.email.value) form.elements.email.value = currentUser.email || '';

            let statusBar = card.querySelector('.client-portal-status-bar');
            if (!statusBar) {
                statusBar = document.createElement('div');
                statusBar.className = 'client-portal-status-bar';
                statusBar.innerHTML = `
                    <div class="client-portal-user-info">
                        <span class="client-status-indicator"></span>
                        <span>Logged in as: <strong>${escapeHTML(currentUser.name)}</strong> <span style="color: rgba(255, 255, 255, 0.65);">(${escapeHTML(currentUser.email)})</span></span>
                    </div>
                    <a href="./my-requests.html" class="client-portal-link">
                        My Requests &rarr;
                    </a>
                `;
                form.parentNode.insertBefore(statusBar, form);
            }
        }
    }).catch(() => {});
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
