import { submitEnquiry } from './api.js';

/**
 * Injects a compact per-service enquiry card into:
 * - Every .service-card inside #services (on the homepage)
 * - Any element with [data-service-name] (on service detail pages)
 */
export function initServiceContactCards() {
    // Select both homepage cards and service detail page targets
    const homepageCards = Array.from(document.querySelectorAll('#services .service-card'));
    const detailTargets = Array.from(document.querySelectorAll('[data-service-name]'));

    // Combine and deduplicate
    const targets = Array.from(new Set([...homepageCards, ...detailTargets]));

    targets.forEach((cardEl, index) => {
        // Prevent double injection
        if (cardEl.dataset.enquiryInjected === 'true' || cardEl.querySelector('.enquiry-card-wrapper')) {
            return;
        }
        cardEl.dataset.enquiryInjected = 'true';

        // Determine service name
        let serviceName = '';
        if (cardEl.hasAttribute('data-service-name')) {
            serviceName = cardEl.getAttribute('data-service-name').trim();
        } else {
            const titleEl = cardEl.querySelector('.service-title');
            if (titleEl) {
                serviceName = titleEl.textContent.trim();
            }
        }
        if (!serviceName) {
            serviceName = 'General Construction';
        }

        const uniqueId = `enquiry-${index + 1}`;

        // Create card wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'enquiry-card-wrapper';

        // Stop click events from bubbling to parent link if card is an <a> tag
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'enquiry-toggle';
        toggleBtn.id = `toggle-${uniqueId}`;
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = 'Enquire about this service &rarr;';

        // Form element
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
            <input type="text" name="honeypot" class="enquiry-honeypot" style="position:absolute; left:-9999px;" tabindex="-1" autocomplete="off" />
            <div class="enquiry-actions">
                <button type="submit" class="enquiry-submit-btn">Send Enquiry</button>
            </div>
            <div class="enquiry-error" style="display: none;"></div>
        `;

        // Toggle click handler
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

            // Simple honeypot check: bot triggered
            if (honeypot) {
                form.style.display = 'none';
                const successDiv = document.createElement('div');
                successDiv.className = 'enquiry-success';
                successDiv.textContent = "Thanks \u2014 we'll be in touch.";
                wrapper.appendChild(successDiv);
                toggleBtn.style.display = 'none';
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
                    projectType: serviceName,
                    message,
                    honeypot: honeypot || ''
                });

                // Replace form with inline success message
                form.style.display = 'none';
                toggleBtn.style.display = 'none';

                const successDiv = document.createElement('div');
                successDiv.className = 'enquiry-success';
                successDiv.textContent = "Thanks \u2014 we'll be in touch.";
                wrapper.appendChild(successDiv);
            } catch (err) {
                console.error('Enquiry submission error:', err);
                errorEl.textContent = 'Failed to submit enquiry. Please try again.';
                errorEl.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(form);
        cardEl.appendChild(wrapper);
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
