import { submitEnquiry } from './api.js';

/**
 * Injects a dedicated enquiry card inside service detail pages
 * Targets any element with .service-page-enquiry-card or [data-service-name]
 */
export function initServiceContactCards() {
    const targets = Array.from(document.querySelectorAll('.service-page-enquiry-card, [data-service-name]'));

    targets.forEach((cardEl, index) => {
        // Skip headings if data-service-name was on h1 previously
        if (cardEl.tagName === 'H1' || cardEl.tagName === 'H2') {
            return;
        }

        // Prevent double injection
        if (cardEl.dataset.enquiryInjected === 'true' || cardEl.querySelector('.service-enquiry-box')) {
            return;
        }
        cardEl.dataset.enquiryInjected = 'true';

        // Read service name
        let serviceName = cardEl.getAttribute('data-service-name') || '';
        if (!serviceName) {
            const titleEl = cardEl.querySelector('.service-title') || document.querySelector('h1');
            serviceName = titleEl ? titleEl.textContent.trim() : 'Construction Service';
        }

        const uniqueId = `service-enquiry-${index + 1}`;

        // Create enquiry box container
        const box = document.createElement('div');
        box.className = 'service-enquiry-box';
        box.id = uniqueId;

        box.innerHTML = `
            <div class="service-enquiry-header">
                <div class="service-enquiry-badge">DIRECT SERVICE ENQUIRY</div>
                <h3 class="service-enquiry-title">Enquire About ${escapeHTML(serviceName)}</h3>
                <p class="service-enquiry-subtitle">Fill out the form below to receive a consultation and indicative estimate for your project.</p>
            </div>
            <form class="service-enquiry-form" id="form-${uniqueId}">
                <div class="service-enquiry-row">
                    <div class="service-enquiry-field">
                        <label for="name-${uniqueId}">Your Name *</label>
                        <input type="text" id="name-${uniqueId}" name="name" required placeholder="Full name" class="service-enquiry-input" autocomplete="name" />
                    </div>
                    <div class="service-enquiry-field">
                        <label for="email-${uniqueId}">Email Address *</label>
                        <input type="email" id="email-${uniqueId}" name="email" required placeholder="name@example.com" class="service-enquiry-input" autocomplete="email" />
                    </div>
                </div>
                <div class="service-enquiry-row">
                    <div class="service-enquiry-field">
                        <label for="phone-${uniqueId}">Phone Number (optional)</label>
                        <input type="tel" id="phone-${uniqueId}" name="phone" placeholder="+91 / Phone" class="service-enquiry-input" autocomplete="tel" />
                    </div>
                    <div class="service-enquiry-field">
                        <label for="type-${uniqueId}">Service</label>
                        <input type="text" id="type-${uniqueId}" value="${escapeHTML(serviceName)}" class="service-enquiry-input service-enquiry-readonly" readonly />
                    </div>
                </div>
                <div class="service-enquiry-field">
                    <label for="msg-${uniqueId}">Project Details / Requirements (optional)</label>
                    <textarea id="msg-${uniqueId}" name="message" rows="3" placeholder="I'm interested in ${escapeHTML(serviceName)}." class="service-enquiry-textarea"></textarea>
                </div>
                <input type="text" name="honeypot" class="enquiry-honeypot" style="position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" />
                <div class="service-enquiry-actions">
                    <button type="submit" class="service-enquiry-submit-btn">Send Enquiry &rarr;</button>
                </div>
                <div class="service-enquiry-error" style="display: none;"></div>
            </form>
            <div class="service-enquiry-success" style="display: none;">
                <div class="service-enquiry-success-icon">&#10003;</div>
                <h4>Thank you!</h4>
                <p>Your enquiry for <strong>${escapeHTML(serviceName)}</strong> has been received. Our engineering team will review your requirements and get back to you shortly.</p>
            </div>
        `;

        // Stop click events from bubbling
        box.addEventListener('click', (e) => {
            e.stopPropagation();
        });

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

            // Simple bot detection
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
                    projectType: serviceName,
                    message,
                    honeypot: honeypot || ''
                });

                form.style.display = 'none';
                successEl.style.display = 'block';
            } catch (err) {
                console.error('Service enquiry submission error:', err);
                errorEl.textContent = 'Failed to send your enquiry. Please check your connection or contact us directly.';
                errorEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });

        cardEl.appendChild(box);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServiceContactCards);
} else {
    initServiceContactCards();
}
