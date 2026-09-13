import { submitEnquiry } from './api.js';
import { getCurrentUser } from './auth.js';

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
 * Initializes the enquiry form on Service Detail Pages (/services/*/index.html)
 */
export async function initServiceDetailPageEnquiry() {
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

    const currentUser = await getCurrentUser().catch(() => null);
    const isServicePage = typeof window !== 'undefined' && window.location.pathname.includes('/services/');
    const loginPath = isServicePage ? '../../login.html' : './login.html';

    // If user is authenticated, prefill and show verified status bar
    if (currentUser) {
        if (form.elements.name) form.elements.name.value = currentUser.name || '';
        if (form.elements.email) form.elements.email.value = currentUser.email || '';

        let statusBar = box.querySelector('.client-portal-status-bar');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'client-portal-status-bar';
            statusBar.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; margin-bottom: 20px;';
            statusBar.innerHTML = `
                <div class="client-portal-user-info" style="color: #0f172a;">
                    <span class="client-status-indicator"></span>
                    <span>Verified Client: <strong>${escapeHTML(currentUser.name)}</strong> <span style="color: #64748b;">(${escapeHTML(currentUser.email)})</span></span>
                </div>
                <a href="${isServicePage ? '../../my-requests.html' : './my-requests.html'}" class="client-portal-link" style="color: #07152F;">
                    Open Client Portal &rarr;
                </a>
            `;
            form.parentNode.insertBefore(statusBar, form);
        }
    }

    // Restore draft if present
    let savedDraft = null;
    try {
        const rawDraft = sessionStorage.getItem('om_service_detail_enquiry_' + serviceSlug);
        if (rawDraft) savedDraft = JSON.parse(rawDraft);
    } catch (e) {}

    if (savedDraft) {
        if (!currentUser && form.elements.name && savedDraft.name) form.elements.name.value = savedDraft.name;
        if (!currentUser && form.elements.email && savedDraft.email) form.elements.email.value = savedDraft.email;
        if (form.elements.phone && savedDraft.phone) form.elements.phone.value = savedDraft.phone;
        if (form.elements.message && savedDraft.message) form.elements.message.value = savedDraft.message;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        const name = form.elements.name ? form.elements.name.value.trim() : (currentUser ? currentUser.name || '' : '');
        const email = form.elements.email ? form.elements.email.value.trim() : (currentUser ? currentUser.email || '' : '');
        const phone = form.elements.phone ? form.elements.phone.value.trim() : '';
        const message = form.elements.message ? form.elements.message.value.trim() : `I'm interested in ${serviceName}.`;
        const honeypot = form.elements.honeypot ? form.elements.honeypot.value : '';

        if (honeypot) {
            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
            return;
        }

        // If not logged in, save draft to sessionStorage and redirect to login
        if (!currentUser) {
            try {
                sessionStorage.setItem('om_service_detail_enquiry_' + serviceSlug, JSON.stringify({ name, email, phone, message }));
            } catch (err) {}
            const returnUrl = encodeURIComponent(window.location.pathname + (window.location.search || '') + '#service-detail-enquiry-box');
            window.location.href = `${loginPath}?redirect=${returnUrl}&reason=enquiry_submit`;
            return;
        }

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry &rarr;';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }

        try {
            await submitEnquiry({
                name,
                email,
                phone: phone || null,
                serviceSlug: serviceSlug,
                message,
                honeypot: honeypot || ''
            });

            try {
                sessionStorage.removeItem('om_service_detail_enquiry_' + serviceSlug);
            } catch (err) {}

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Service page enquiry error:', err);
            if (err.message && (err.message.includes('401') || err.message.includes('Not authenticated'))) {
                window.location.href = `${loginPath}?redirect=${encodeURIComponent(window.location.pathname + '#service-detail-enquiry-box')}&reason=enquiry_submit`;
                return;
            }
            if (errorEl) {
                errorEl.textContent = 'Failed to send your enquiry. Please check your connection or contact us directly.';
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
export async function initGlobalEnquiryForm() {
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

    const currentUser = await getCurrentUser().catch(() => null);

    // Restore draft if present
    let savedDraft = null;
    try {
        const rawDraft = sessionStorage.getItem('om_global_enquiry_draft');
        if (rawDraft) savedDraft = JSON.parse(rawDraft);
    } catch (e) {}

    if (currentUser) {
        if (form.elements.name) form.elements.name.value = currentUser.name || '';
        if (form.elements.email) form.elements.email.value = currentUser.email || '';

        // Show verified user executive status bar inside formWrapper
        let statusBar = card.querySelector('.client-portal-status-bar');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'client-portal-status-bar';
            statusBar.innerHTML = `
                <div class="client-portal-user-info">
                    <span class="client-status-indicator"></span>
                    <span>Verified Client: <strong>${escapeHTML(currentUser.name)}</strong> <span style="color: rgba(255, 255, 255, 0.65);">(${escapeHTML(currentUser.email)})</span></span>
                </div>
                <a href="./my-requests.html" class="client-portal-link">
                    Open Client Portal &rarr;
                </a>
            `;
            form.parentNode.insertBefore(statusBar, form);
        }
    }

    if (savedDraft) {
        if (!currentUser && form.elements.name && savedDraft.name) form.elements.name.value = savedDraft.name;
        if (!currentUser && form.elements.email && savedDraft.email) form.elements.email.value = savedDraft.email;
        if (form.elements.phone && savedDraft.phone) form.elements.phone.value = savedDraft.phone;
        if (form.elements.service_slug && savedDraft.service_slug) form.elements.service_slug.value = savedDraft.service_slug;
        if (form.elements.location && savedDraft.location) form.elements.location.value = savedDraft.location;
        if (form.elements.area && savedDraft.area) form.elements.area.value = savedDraft.area;
        if (form.elements.message && savedDraft.message) form.elements.message.value = savedDraft.message;
    }

    if (form.dataset.enquiryBound === 'true') return;
    form.dataset.enquiryBound = 'true';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        const name = form.elements.name ? form.elements.name.value.trim() : (currentUser ? currentUser.name || '' : '');
        const email = form.elements.email ? form.elements.email.value.trim() : (currentUser ? currentUser.email || '' : '');
        const phone = form.elements.phone ? form.elements.phone.value.trim() : '';
        const serviceSlug = form.elements.service_slug ? form.elements.service_slug.value : 'project-planning';
        const location = form.elements.location ? form.elements.location.value.trim() : '';
        const area = form.elements.area ? form.elements.area.value.trim() : '';
        const rawMessage = form.elements.message ? form.elements.message.value.trim() : '';
        const honeypot = form.elements.honeypot ? form.elements.honeypot.value : '';

        // Bot honeypot detection
        if (honeypot) {
            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
            return;
        }

        // If not logged in, save draft to sessionStorage and redirect to login
        if (!currentUser) {
            try {
                sessionStorage.setItem('om_global_enquiry_draft', JSON.stringify({
                    name,
                    email,
                    phone,
                    service_slug: serviceSlug,
                    location,
                    area,
                    message: rawMessage
                }));
            } catch (e) {}
            const returnUrl = encodeURIComponent(window.location.pathname + (window.location.search || '') + '#cta');
            window.location.href = `./login.html?redirect=${returnUrl}&reason=enquiry_submit`;
            return;
        }

        // Combine location and area into the project message for comprehensive company context
        const metaParts = [];
        if (location) metaParts.push(`Location: ${location}`);
        if (area) metaParts.push(`Approx. Area / Type: ${area}`);
        
        let message = rawMessage;
        if (metaParts.length > 0) {
            message = `[${metaParts.join(' | ')}]\n\n${rawMessage}`;
        }

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Project Enquiry &rarr;';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending enquiry...';
        }

        try {
            await submitEnquiry({
                name,
                email,
                phone: phone || null,
                serviceSlug: serviceSlug,
                message: message,
                honeypot: honeypot || ''
            });

            try {
                sessionStorage.removeItem('om_global_enquiry_draft');
            } catch (e) {}

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Global enquiry submission error:', err);
            if (err.message && (err.message.includes('401') || err.message.includes('Not authenticated'))) {
                window.location.href = `./login.html?redirect=${encodeURIComponent(window.location.pathname + '#cta')}&reason=enquiry_submit`;
                return;
            }
            if (errorEl) {
                errorEl.textContent = 'Failed to send your enquiry. Please check your network connection or reach us directly at omengineeringconsultants06@gmail.com.';
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
