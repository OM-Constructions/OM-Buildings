import { submitEnquiry } from './api.js';

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
};

/**
 * Resolves visible service title to canonical name and slug in SERVICE_SLUGS.
 * Returns null if not recognized (to defensively skip unmapped cards).
 */
function resolveServiceSlug(rawTitle) {
    if (!rawTitle) return null;
    const trimmed = rawTitle.trim();
    if (SERVICE_SLUGS[trimmed]) {
        return { name: trimmed, slug: SERVICE_SLUGS[trimmed] };
    }
    const lower = trimmed.toLowerCase();
    for (const [name, slug] of Object.entries(SERVICE_SLUGS)) {
        if (name.toLowerCase() === lower) {
            return { name, slug };
        }
    }
    return null;
}

export function initServiceContactCards() {
    // 1. Target every .service-card element inside #services (Homepage)
    const homepageCards = Array.from(document.querySelectorAll('#services .service-card'));

    homepageCards.forEach((cardEl, index) => {
        // Prevent double injection
        if (cardEl.dataset.enquiryInjected === 'true' || cardEl.querySelector('.enquiry-card-wrapper')) {
            return;
        }

        // Read service name from child .service-title
        const titleEl = cardEl.querySelector('.service-title');
        const rawTitle = titleEl ? titleEl.textContent.trim() : '';

        // Defensive: skip any element that doesn't match an entry in SERVICE_SLUGS
        const serviceEntry = resolveServiceSlug(rawTitle);
        if (!serviceEntry) {
            return;
        }

        cardEl.dataset.enquiryInjected = 'true';
        const { name: serviceName, slug: serviceSlug } = serviceEntry;
        const uniqueId = `enquiry-${index + 1}`;

        // Create card wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'enquiry-card-wrapper';
        wrapper.id = uniqueId;

        // Stop click events from bubbling to parent link if card is an <a> tag
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Toggle button: Enquire about this service →
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'enquiry-toggle';
        toggleBtn.id = `toggle-${uniqueId}`;
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = 'Enquire about this service &rarr;';

        // Compact Form
        const form = document.createElement('form');
        form.className = 'enquiry-card-form';
        form.id = `form-${uniqueId}`;
        form.style.display = 'none';

        form.innerHTML = `
            <div class="enquiry-field">
                <input type="text" name="name" required placeholder="Your Name" class="enquiry-input" autocomplete="name" />
            </div>
            <div class="enquiry-field">
                <input type="email" name="email" required placeholder="Your Email" class="enquiry-input" autocomplete="email" />
            </div>
            <div class="enquiry-field">
                <input type="tel" name="phone" placeholder="Phone (optional)" class="enquiry-input" autocomplete="tel" />
            </div>
            <div class="enquiry-field">
                <textarea name="message" rows="2" placeholder="I'm interested in ${escapeHTML(serviceName)}." class="enquiry-textarea"></textarea>
            </div>
            <input type="text" name="honeypot" class="enquiry-honeypot" style="position:absolute; left:-9999px; opacity:0; pointer-events:none;" tabindex="-1" autocomplete="off" />
            <div class="enquiry-actions">
                <button type="submit" class="enquiry-submit-btn">Send Enquiry</button>
            </div>
            <div class="enquiry-error" style="display: none;"></div>
        `;

        // Success state message
        const successDiv = document.createElement('div');
        successDiv.className = 'enquiry-success';
        successDiv.style.display = 'none';
        successDiv.innerHTML = "Thanks &mdash; we've received your enquiry and sent you a confirmation email.";

        // Toggle handler
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = form.style.display !== 'none';
            if (isOpen) {
                form.style.display = 'none';
                toggleBtn.setAttribute('aria-expanded', 'false');
                cardEl.classList.remove('has-enquiry-open');
            } else {
                form.style.display = 'flex';
                toggleBtn.setAttribute('aria-expanded', 'true');
                cardEl.classList.add('has-enquiry-open');
                const nameInput = form.querySelector('input[name="name"]');
                if (nameInput) setTimeout(() => nameInput.focus(), 50);
            }
        });

        // Form submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const submitBtn = form.querySelector('.enquiry-submit-btn');
            const errorEl = form.querySelector('.enquiry-error');
            errorEl.style.display = 'none';
            errorEl.textContent = '';

            const name = form.elements.name.value.trim();
            const email = form.elements.email.value.trim();
            const phone = form.elements.phone.value.trim();
            const message = form.elements.message.value.trim() || `I'm interested in ${serviceName}.`;
            const honeypot = form.elements.honeypot.value;

            // Simple bot honeypot detection
            if (honeypot) {
                form.style.display = 'none';
                toggleBtn.style.display = 'none';
                successDiv.style.display = 'block';
                return;
            }

            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                await submitEnquiry({
                    name,
                    email,
                    phone: phone || null,
                    serviceSlug: serviceSlug,
                    message,
                    honeypot: honeypot || ''
                });

                // On success, replace the form with the confirmation email message
                form.style.display = 'none';
                toggleBtn.style.display = 'none';
                successDiv.style.display = 'block';
            } catch (err) {
                console.error('Service enquiry submission error:', err);
                errorEl.textContent = 'Failed to submit enquiry. Please try again.';
                errorEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(form);
        wrapper.appendChild(successDiv);
        cardEl.appendChild(wrapper);
    });

    // 2. Target Service Detail Pages (Dedicated Enquiry Box)
    initServiceDetailPageEnquiry();

    // 3. Target Global Project Enquiry Card (#cta)
    initGlobalEnquiryForm();
}

function initServiceDetailPageEnquiry() {
    // Look for explicit placeholder or the CTA container on service pages
    const explicitTarget = document.querySelector('.service-page-enquiry-card, [data-service-name]');
    const ctaContainer = document.querySelector('.sp-cta .container');

    const targetEl = explicitTarget || ctaContainer;
    if (!targetEl) return;

    if (targetEl.dataset.detailEnquiryInjected === 'true' || targetEl.querySelector('.service-enquiry-box')) {
        return;
    }

    // Determine service name from hero or attribute
    let rawTitle = explicitTarget ? explicitTarget.getAttribute('data-service-name') : '';
    if (!rawTitle) {
        const heroTitle = document.querySelector('.service-page-hero h1, h1');
        if (heroTitle) {
            rawTitle = heroTitle.textContent.trim();
        }
    }

    const serviceEntry = resolveServiceSlug(rawTitle);
    if (!serviceEntry) return;

    targetEl.dataset.detailEnquiryInjected = 'true';
    const { name: serviceName, slug: serviceSlug } = serviceEntry;

    const box = document.createElement('div');
    box.className = 'service-enquiry-box';
    box.id = 'service-detail-enquiry-box';

    box.innerHTML = `
        <div class="service-enquiry-header">
            <div class="service-enquiry-badge">DIRECT SERVICE ENQUIRY</div>
            <h3 class="service-enquiry-title">Enquire About ${escapeHTML(serviceName)}</h3>
            <p class="service-enquiry-subtitle">Fill out the form below to receive a consultation and indicative estimate for your project.</p>
        </div>
        <form class="service-enquiry-form" id="form-service-detail-enquiry">
            <div class="service-enquiry-row">
                <div class="service-enquiry-field">
                    <label for="sp-name">Your Name *</label>
                    <input type="text" id="sp-name" name="name" required placeholder="Full name" class="service-enquiry-input" autocomplete="name" />
                </div>
                <div class="service-enquiry-field">
                    <label for="sp-email">Email Address *</label>
                    <input type="email" id="sp-email" name="email" required placeholder="name@example.com" class="service-enquiry-input" autocomplete="email" />
                </div>
            </div>
            <div class="service-enquiry-row">
                <div class="service-enquiry-field">
                    <label for="sp-phone">Phone Number (optional)</label>
                    <input type="tel" id="sp-phone" name="phone" placeholder="+91 / Phone" class="service-enquiry-input" autocomplete="tel" />
                </div>
                <div class="service-enquiry-field">
                    <label for="sp-type">Service</label>
                    <input type="text" id="sp-type" value="${escapeHTML(serviceName)}" class="service-enquiry-input service-enquiry-readonly" readonly />
                </div>
            </div>
            <div class="service-enquiry-field">
                <label for="sp-msg">Project Details / Requirements (optional)</label>
                <textarea id="sp-msg" name="message" rows="3" placeholder="I'm interested in ${escapeHTML(serviceName)}." class="service-enquiry-textarea"></textarea>
            </div>
            <input type="text" name="honeypot" class="enquiry-honeypot" style="position:absolute; left:-9999px; opacity:0; pointer-events:none;" tabindex="-1" autocomplete="off" />
            <div class="service-enquiry-actions">
                <button type="submit" class="service-enquiry-submit-btn">Send Enquiry &rarr;</button>
            </div>
            <div class="service-enquiry-error" style="display: none;"></div>
        </form>
        <div class="service-enquiry-success" style="display: none;">
            <div class="service-enquiry-success-icon">&#10003;</div>
            <h4>Thank you!</h4>
            <p>Thanks &mdash; we've received your enquiry for <strong>${escapeHTML(serviceName)}</strong> and sent you a confirmation email.</p>
        </div>
    `;

    const form = box.querySelector('form');
    const successEl = box.querySelector('.service-enquiry-success');
    const errorEl = box.querySelector('.service-enquiry-error');
    const submitBtn = box.querySelector('.service-enquiry-submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        errorEl.style.display = 'none';
        errorEl.textContent = '';

        const name = form.elements.name.value.trim();
        const email = form.elements.email.value.trim();
        const phone = form.elements.phone.value.trim();
        const message = form.elements.message.value.trim() || `I'm interested in ${serviceName}.`;
        const honeypot = form.elements.honeypot.value;

        if (honeypot) {
            form.style.display = 'none';
            successEl.style.display = 'block';
            return;
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending enquiry...';

        try {
            await submitEnquiry({
                name,
                email,
                phone: phone || null,
                serviceSlug: serviceSlug,
                message,
                honeypot: honeypot || ''
            });

            form.style.display = 'none';
            successEl.style.display = 'block';
        } catch (err) {
            console.error('Service page enquiry error:', err);
            errorEl.textContent = 'Failed to send your enquiry. Please check your connection or contact us directly.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    targetEl.appendChild(box);
}

export function initGlobalEnquiryForm() {
    const form = document.getElementById('global-enquiry-form');
    if (!form) return;

    if (form.dataset.enquiryBound === 'true') return;
    form.dataset.enquiryBound = 'true';

    const card = document.getElementById('global-enquiry-box');
    const successEl = card ? card.querySelector('.global-enquiry-success') : null;
    const errorEl = form.querySelector('.global-enquiry-error');
    const submitBtn = form.querySelector('.global-enquiry-submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        const name = form.elements.name ? form.elements.name.value.trim() : '';
        const email = form.elements.email ? form.elements.email.value.trim() : '';
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

            form.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
        } catch (err) {
            console.error('Global enquiry submission error:', err);
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
