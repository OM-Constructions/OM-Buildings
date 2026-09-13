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
    // Target every .service-card element inside #services
    const homepageCards = Array.from(document.querySelectorAll('#services .service-card'));
    // Also support any detail page element with [data-service-name] or .service-page-enquiry-card
    const detailTargets = Array.from(document.querySelectorAll('.service-page-enquiry-card, [data-service-name]'));
    const targets = Array.from(new Set([...homepageCards, ...detailTargets]));

    targets.forEach((cardEl, index) => {
        // Skip headings if data-service-name was on h1/h2
        if (cardEl.tagName === 'H1' || cardEl.tagName === 'H2') {
            return;
        }

        // Prevent double injection
        if (cardEl.dataset.enquiryInjected === 'true' || cardEl.querySelector('.enquiry-card-wrapper')) {
            return;
        }

        // Read service name from [data-service-name] or child .service-title
        let rawTitle = cardEl.getAttribute('data-service-name') || '';
        if (!rawTitle) {
            const titleEl = cardEl.querySelector('.service-title');
            if (titleEl) {
                rawTitle = titleEl.textContent.trim();
            }
        }

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
