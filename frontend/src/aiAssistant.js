/**
 * OM AI Assistant - Interactive Engineering & Construction Consultant
 * Provides real-time guidance on architectural design, structural engineering,
 * estimation & costing, tech capabilities, and project consultation.
 */
import { askAssistant } from './api.js';

export function initAIAssistant() {
    if (document.getElementById('om-ai-widget')) return;

    const isServicePage = window.location.pathname.includes('/services/');
    const basePath = isServicePage ? '../../' : '';
    const atlasAvatarPath = `${basePath}assets/atlas-avatar.png`;

    // 1. Create Widget DOM Container
    const container = document.createElement('div');
    container.id = 'om-ai-widget';
    container.className = 'om-ai-widget-container';
    container.innerHTML = `
        <!-- Floating Teaser Prompt -->
        <div class="om-ai-teaser" id="om-ai-teaser">
            <div class="om-ai-teaser-content">
                <span class="om-ai-teaser-icon">✨</span>
                <span class="om-ai-teaser-text">Have a project? Ask <strong>Atlas</strong></span>
            </div>
            <button class="om-ai-teaser-close" id="om-ai-teaser-close" aria-label="Close teaser">&times;</button>
        </div>

        <!-- Floating Action Button -->
        <button class="om-ai-launcher" id="om-ai-launcher" aria-label="Open Atlas Assistant">
            <div class="om-ai-launcher-icon">
                <img src="${atlasAvatarPath}" alt="Atlas Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <span class="om-ai-status-indicator" title="Atlas Active"></span>
        </button>

        <!-- AI Assistant Chat Window -->
        <div class="om-ai-window" id="om-ai-window" aria-hidden="true">
            <!-- Header -->
            <div class="om-ai-header">
                <div class="om-ai-header-info">
                    <div class="om-ai-avatar">
                        <img src="${atlasAvatarPath}" alt="Atlas" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    </div>
                    <div>
                        <div class="om-ai-title">Atlas</div>
                        <div class="om-ai-subtitle"><span class="om-ai-green-dot"></span> Virtual Engineering Consultant &bull; Always Online</div>
                    </div>
                </div>
                <div class="om-ai-controls">
                    <button class="om-ai-btn-icon" id="om-ai-reset-btn" title="Restart conversation">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                    <button class="om-ai-btn-icon" id="om-ai-close-btn" title="Close chat">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>

            <!-- Quick Action Chips Carousel -->
            <div class="om-ai-chips-wrapper">
                <div class="om-ai-chips" id="om-ai-chips">
                    <button class="om-ai-chip" data-query="services">🏗️ Our 10 Services</button>
                    <button class="om-ai-chip" data-query="estimator">📐 Cost & Timeline Estimator</button>
                    <button class="om-ai-chip" data-query="structural">🏢 Structural & Soil Safety</button>
                    <button class="om-ai-chip" data-query="tech">🤖 AI & Tech Stack</button>
                    <button class="om-ai-chip" data-query="contact">📞 Book Consultation</button>
                </div>
            </div>

            <!-- Chat Message List -->
            <div class="om-ai-messages" id="om-ai-messages" role="log" aria-live="polite">
                <!-- Welcome message is injected via JS -->
            </div>

            <!-- Input Area -->
            <form class="om-ai-input-area" id="om-ai-form">
                <input 
                    type="text" 
                    id="om-ai-input" 
                    class="om-ai-input" 
                    placeholder="Ask about architectural plans, structural safety, costs..." 
                    autocomplete="off"
                    aria-label="Your question"
                />
                <button type="submit" class="om-ai-send-btn" id="om-ai-send-btn" aria-label="Send message">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </form>

            <div class="om-ai-footer-brand">
                Powered by <strong>OM Constructions</strong> Engineering Intelligence
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // 2. Initialize Logic & Event Listeners
    setupAIAssistantEvents(atlasAvatarPath);
}

/**
 * Knowledge Base & Intent Resolution for OM Constructions & Engineering Consultants
 */
const KNOWLEDGE_BASE = {
    services: {
        title: "Comprehensive Construction & Engineering Services",
        content: `At **OM Constructions & Engineering Consultants**, we provide end-to-end built-environment services from concept to handover:

1. 🏛️ **Architectural Design**: Creative, functional, aesthetic & sustainable building layouts.
2. 📐 **Architectural 2D Plans**: Technical working drawings, Vaastu compliant layouts & authority approval blueprints.
3. 🏗️ **Structural Design**: High-integrity reinforced concrete and steel designs, seismic/earthquake resistant, wind load engineered per IS/international codes.
4. 📊 **Project Planning & Management**: Rigorous scheduling, critical path tracking, milestone controls, and quality audits.
5. 🛋️ **Interior Design**: Space planning, luxury modern finishes, lighting, ergonomics, and 3D interior renders.
6. 🔬 **Geotechnical Soil Investigation**: Standard penetration tests, borehole drilling, soil bearing capacity (SBC) reports & foundation depth calculations.
7. ⚡ **MEP Design**: Complete Mechanical, Electrical, Plumbing, HVAC & Firefighting system layouts.
8. 🏢 **3D Building Design**: Full 3D BIM spatial models with precise material specifications.
9. 🎨 **Realistic 3D Rendering**: Ultra-high-definition photorealistic day/dusk visual presentations and architectural walk-throughs.
10. 💰 **Quantity Estimation & Costing**: Item-wise BOQ (Bill of Quantities), material take-offs, and transparent budgeting to eliminate cost overruns.

Would you like details on a specific service or an instant estimation?`,
        actions: [
            { text: "📐 Estimate Project Cost", query: "estimator" },
            { text: "🏢 Structural & Soil Safety", query: "structural" },
            { text: "📞 Book Free Consultation", query: "contact" }
        ]
    },

    structural: {
        title: "Structural Engineering & Geotechnical Safety",
        content: `**Safety & Durability are our core engineering principles.**

- **Structural Engineering**:
  - Seismic-resistant ductile detailing (IS 1893 & IS 13920 compliant).
  - High-rise RCC framed structures, post-tensioned slabs, and pre-engineered steel buildings (PEB).
  - Advanced computational finite element analysis (FEA) to withstand extreme seismic and wind shear forces.

- **Geotechnical Soil Investigation**:
  - Standard Penetration Test (SPT), borehole sampling & core logging.
  - Safe Bearing Capacity (SBC) determination to prevent differential settlement or foundation failure.
  - Custom foundation design recommendations (Isolated footings, Raft/Mat, or Deep Pile foundations).

Would you like to schedule a site soil test or structural assessment?`,
        actions: [
            { text: "📞 Request Site Assessment", query: "contact" },
            { text: "📐 Architectural 2D Plans", query: "architectural" },
            { text: "🏗️ View All Services", query: "services" }
        ]
    },

    architectural: {
        title: "Architectural Design & 2D Working Plans",
        content: `Our architectural team crafts spaces that harmonize aesthetics, functional circulation, and regulatory compliance:

- **Vaastu Compliant Planning**: Aligning entrances, kitchens, master bedrooms, and staircases according to traditional principles without compromising modern functionality.
- **Authority Approvals & Sanction Drawings**: Layouts drafted to local municipal bylaws and building codes.
- **Comprehensive Working Drawings**: Detailed sectional elevations, dimensioned structural grids, door/window schedules, and electrical conduit routing.
- **3D Elevations & Walkthroughs**: Visualize your residential villa, commercial complex, or industrial warehouse in high fidelity before laying the first brick.`,
        actions: [
            { text: "📐 Run Cost Estimator", query: "estimator" },
            { text: "🎨 3D Rendering Info", query: "rendering" },
            { text: "📞 Contact an Architect", query: "contact" }
        ]
    },

    rendering: {
        title: "3D Building Design & Photorealistic Rendering",
        content: `Bring your architectural visions to life before construction begins!

- **3D Exterior Elevations**: Modern contemporary, neo-classical, minimalist, or industrial facade designs with accurate lighting, textures, and landscape.
- **Interior 3D Visualization**: Virtual walkthroughs of living spaces, executive cabins, lobbies, and master bedrooms.
- **BIM Modeling**: Integrated 3D models coordinating architecture, structural elements, and MEP services to detect clashes early.`,
        actions: [
            { text: "🏗️ All 10 Services", query: "services" },
            { text: "📞 Request 3D Renders", query: "contact" }
        ]
    },

    tech: {
        title: "Technology Capabilities & AI in Engineering",
        content: `OM Constructions combines traditional civil engineering with state-of-the-art computational intelligence:

- 🤖 **Gen AI & LLM**: Custom AI agents for automated plan verification, regulatory compliance checking, and project data RAG pipelines.
- 🧠 **Machine Learning**: Predictive scheduling, cost risk modeling, and concrete curing estimation using Scikit-Learn, PyTorch & TensorFlow.
- ☁️ **Cloud & DevOps**: Scalable infrastructure on AWS, Azure & GCP with Docker & Kubernetes for real-time site telemetry.
- 📱 **Modern Web & Mobile**: High-performance digital portals in React, Next.js, Node.js, and Flutter for client tracking and real-time site logs.
- 🗄️ **Databases**: Vector databases for blueprint search, PostgreSQL, MySQL & MongoDB.`,
        actions: [
            { text: "🏗️ Explore Construction Services", query: "services" },
            { text: "📞 Discuss Tech Partnerships", query: "contact" }
        ]
    },

    industries: {
        title: "Industries We Serve",
        content: `We engineer solutions across both built environments and technological domains:

- **Construction & Real Estate**: Luxury villas, multi-storey apartments, gated communities & commercial complexes.
- **Industrial & Manufacturing**: Pre-engineered buildings (PEB), heavy manufacturing plants, and warehousing facilities.
- **Smart Mobility & Infrastructure**: Smart city transit hubs, road networks, and structural assets.
- **Healthcare, Education & Corporate**: Specialized hospital facilities, educational campuses, and corporate headquarters.`,
        actions: [
            { text: "📐 Estimate Project Cost", query: "estimator" },
            { text: "📞 Talk to Us", query: "contact" }
        ]
    },

    estimator: {
        title: "Interactive Construction Cost & Timeline Estimator",
        content: `To help you plan your project, here are standard indicative metrics for turnkey architectural, structural, and construction execution:

🏢 **Residential Buildings (Villas & Apartments)**:
- Planning & Structural Design: ~₹25 - ₹50 per sq. ft.
- Standard Construction (Structure + Basic Finishes): ~₹1,700 - ₹2,100 per sq. ft.
- Premium Luxury Construction: ~₹2,200 - ₹3,000+ per sq. ft.
- Typical Timeline: 6 - 14 months depending on plot size & floors.

🏭 **Commercial & Pre-Engineered Steel (PEB)**:
- Turnkey Execution: ~₹1,400 - ₹2,200 per sq. ft.
- Fast-track PEB Timeline: 4 - 8 months.

*Note: Soil bearing capacity, structural loads, and custom finishes affect the exact estimate.*

Would you like a customized, itemized BOQ estimate for your specific plot and built-up area?`,
        actions: [
            { text: "🚀 Submit Project Enquiry", action: "scrollToCta" },
            { text: "📞 Contact Engineering Team", query: "contact" },
            { text: "🏗️ View Services", query: "services" }
        ]
    },

    contact: {
        title: "Get in Touch with OM Constructions",
        content: `We'd love to help you build your project!

- 📍 **Consultation Office**: OM Constructions & Engineering Consultants
- 📞 **Direct Contact**: Reach out via phone or email to discuss blueprints & site visits
- 💬 **Fast Turnaround**: Comprehensive quotation within 24-48 hours
- 📋 **Services**: Architectural Design, Structural Engineering, Geotechnical Soil Investigation, 3D Elevation, Cost Estimation & Turnkey Execution.

You can also submit your details directly using the contact section below.`,
        actions: [
            { text: "🚀 Go to Contact Section", action: "scrollToCta" },
            { text: "📐 Try Cost Estimator", query: "estimator" },
            { text: "🏗️ Explore Services", query: "services" }
        ]
    }
};

/**
 * Intelligent Query Classifier
 */
function resolveQuery(input) {
    const text = input.toLowerCase().trim();

    if (!text) return null;

    // Direct key matches
    if (text === 'services' || text === 'all services' || text.includes('what services') || text.includes('service') || text.includes('what do you do') || text.includes('offering')) {
        return KNOWLEDGE_BASE.services;
    }
    if (text === 'structural' || text.includes('structure') || text.includes('soil') || text.includes('earthquake') || text.includes('seismic') || text.includes('geotechnical') || text.includes('bearing capacity') || text.includes('foundation')) {
        return KNOWLEDGE_BASE.structural;
    }
    if (text === 'architectural' || text.includes('architect') || text.includes('2d') || text.includes('floor plan') || text.includes('blue print') || text.includes('vaastu') || text.includes('vastu') || text.includes('layout')) {
        return KNOWLEDGE_BASE.architectural;
    }
    if (text === 'rendering' || text.includes('render') || text.includes('3d') || text.includes('elevation') || text.includes('interior') || text.includes('walkthrough')) {
        return KNOWLEDGE_BASE.rendering;
    }
    if (text === 'tech' || text.includes('technology') || text.includes('ai') || text.includes('llm') || text.includes('machine learning') || text.includes('cloud') || text.includes('software') || text.includes('devops')) {
        return KNOWLEDGE_BASE.tech;
    }
    if (text === 'estimator' || text.includes('cost') || text.includes('price') || text.includes('budget') || text.includes('rate') || text.includes('estimate') || text.includes('timeline') || text.includes('duration') || text.includes('how much') || text.includes('sq ft') || text.includes('square feet')) {
        return KNOWLEDGE_BASE.estimator;
    }
    if (text === 'contact' || text.includes('contact') || text.includes('phone') || text.includes('call') || text.includes('email') || text.includes('reach') || text.includes('address') || text.includes('location') || text.includes('hire') || text.includes('book') || text.includes('consultation')) {
        return KNOWLEDGE_BASE.contact;
    }
    if (text.includes('industry') || text.includes('sector') || text.includes('commercial') || text.includes('residential') || text.includes('warehouse') || text.includes('factory')) {
        return KNOWLEDGE_BASE.industries;
    }

    // Smart compound match
    if (text.includes('mep') || text.includes('plumbing') || text.includes('electrical')) {
        return {
            title: "MEP (Mechanical, Electrical & Plumbing) Design",
            content: `Our **MEP engineering division** ensures your building operates with peak energy efficiency and safety:
- **Electrical Design**: Load calculations, transformer sizing, DG backup, single-line diagrams (SLD), lighting automation & lightning protection.
- **Plumbing & Sanitation**: Water supply loops, STP/sewage piping, rainwater harvesting systems, and pressure pumping designs.
- **HVAC & Fire Safety**: Heat load analysis, central ducting, sprinkler grids & smoke evacuation compliant with National Building Code (NBC).`,
            actions: [
                { text: "🏗️ All 10 Services", query: "services" },
                { text: "📞 Inquire about MEP", query: "contact" }
            ]
        };
    }

    // Lead detection: If user provided a phone number or email
    const phoneRegex = /(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}|\d{10}/;
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    if (phoneRegex.test(text) || emailRegex.test(text)) {
        return {
            title: "Inquiry Received! 🤝",
            content: `Thank you for sharing your contact information. Our senior structural engineer & architectural consultant will review your request and reach out shortly to discuss your project requirements!

In the meantime, feel free to explore our services or calculate indicative costs.`,
            actions: [
                { text: "📐 Cost & Timeline Estimator", query: "estimator" },
                { text: "🏗️ Explore Services", query: "services" }
            ]
        };
    }

    // Unmatched query: return null to trigger real AI backend
    return null;
}

/**
 * Event handling and UI interactions
 */
function setupAIAssistantEvents(atlasAvatarPath) {
    const launcher = document.getElementById('om-ai-launcher');
    const windowEl = document.getElementById('om-ai-window');
    const teaser = document.getElementById('om-ai-teaser');
    const teaserClose = document.getElementById('om-ai-teaser-close');
    const closeBtn = document.getElementById('om-ai-close-btn');
    const resetBtn = document.getElementById('om-ai-reset-btn');
    const form = document.getElementById('om-ai-form');
    const input = document.getElementById('om-ai-input');
    const messagesEl = document.getElementById('om-ai-messages');
    const chips = document.getElementById('om-ai-chips');

    let isOpen = false;
    let isTyping = false;
    let chatHistory = [];
    let userMessageCount = 0;
    const SESSION_CAP = 20;

    // Show initial greeting
    function renderWelcome() {
        messagesEl.innerHTML = '';
        addBotMessage({
            title: "",
            content: `Hello! I am Atlas, your Virtual Engineering Consultant for OM Constructions & Engineering Consultants.

I can guide you through our **10 core built-environment services**, calculate an **indicative project cost & timeline estimate**, or help you book a **free site consultation**.

Choose a topic below or type any question!`,
            actions: [
                { text: "🏗️ Our 10 Services", query: "services" },
                { text: "📐 Cost & Timeline Estimator", query: "estimator" },
                { text: "🏢 Structural & Soil Safety", query: "structural" },
                { text: "🤖 AI & Tech Capabilities", query: "tech" },
                { text: "📞 Book Free Consultation", query: "contact" }
            ]
        }, false);
        messagesEl.scrollTop = 0;
    }

    renderWelcome();

    // Toggle window open / close
    function toggleChat(open) {
        isOpen = open !== undefined ? open : !isOpen;
        if (isOpen) {
            windowEl.classList.add('om-ai-open');
            windowEl.setAttribute('aria-hidden', 'false');
            launcher.classList.add('om-ai-launcher-active');
            if (teaser) teaser.style.display = 'none';
            setTimeout(() => input.focus(), 250);
            if (messagesEl.children.length <= 1) {
                messagesEl.scrollTop = 0;
            } else {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        } else {
            windowEl.classList.remove('om-ai-open');
            windowEl.setAttribute('aria-hidden', 'true');
            launcher.classList.remove('om-ai-launcher-active');
        }
    }

    launcher.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    if (teaser) {
        teaser.addEventListener('click', (e) => {
            if (e.target !== teaserClose) {
                toggleChat(true);
            }
        });
        teaserClose.addEventListener('click', (e) => {
            e.stopPropagation();
            teaser.style.display = 'none';
        });
    }

    resetBtn.addEventListener('click', () => {
        chatHistory = [];
        userMessageCount = 0;
        renderWelcome();
    });

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query || isTyping) return;

        input.value = '';
        addUserMessage(query);
        userMessageCount++;

        // 1. First check instant zero-token match from hardcoded knowledge base
        const localMatch = resolveQuery(query);
        if (localMatch) {
            isTyping = true;
            showTypingIndicator();
            chatHistory.push({ role: 'user', content: query });
            chatHistory.push({ role: 'assistant', content: localMatch.content });
            setTimeout(() => {
                removeTypingIndicator();
                addBotMessage(localMatch, true);
                isTyping = false;
            }, 350 + Math.random() * 200);
            return;
        }

        // 2. Check session cap for open-ended queries
        if (userMessageCount > SESSION_CAP) {
            isTyping = true;
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                addBotMessage({
                    title: "Consultation Limit Reached",
                    content: "You've asked several questions in this session. For custom structural reviews, site soil testing, or detailed project quotations, please submit an enquiry below to speak directly with our senior engineering consultants.",
                    actions: [
                        { text: "🚀 Submit Project Enquiry", action: "scrollToCta" },
                        { text: "📞 Book Free Consultation", query: "contact" }
                    ]
                }, true);
                isTyping = false;
            }, 350);
            return;
        }

        // 3. Fallback to real AI backend for open-ended queries
        isTyping = true;
        showTypingIndicator();
        chatHistory.push({ role: 'user', content: query });

        try {
            // Pass last few exchanges to keep token usage small and predictable
            const recentHistory = chatHistory.slice(-12);
            const data = await askAssistant(query, recentHistory);
            removeTypingIndicator();
            const replyText = data && data.reply ? data.reply : "Thank you for your enquiry. Please submit your project details to speak with our engineering team.";
            chatHistory.push({ role: 'assistant', content: replyText });
            addBotMessage({
                content: replyText,
                actions: [
                    { text: "🚀 Submit Project Enquiry", action: "scrollToCta" },
                    { text: "🏗️ View 10 Services", query: "services" }
                ]
            }, true);
        } catch (err) {
            console.error('[ATLAS ASSISTANT ERROR]', err);
            removeTypingIndicator();
            const fallbackMsg = "I'd be glad to assist with that! At **OM Constructions & Engineering Consultants**, we specialize in Architectural Design, Structural Engineering, Geotechnical Soil Reports, 3D Elevation, and Cost Estimation. Please submit your project details below to consult directly with our engineers.";
            chatHistory.push({ role: 'assistant', content: fallbackMsg });
            addBotMessage({
                title: "OM Engineering Consultation",
                content: fallbackMsg,
                actions: [
                    { text: "🚀 Submit Project Enquiry", action: "scrollToCta" },
                    { text: "🏗️ View 10 Services", query: "services" },
                    { text: "📞 Contact Engineer", query: "contact" }
                ]
            }, true);
        } finally {
            isTyping = false;
        }
    });

    // Handle Quick Action Chips
    chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.om-ai-chip');
        if (!btn || isTyping) return;
        const query = btn.getAttribute('data-query');
        triggerQuery(query, btn.textContent);
    });

    // Handle message actions
    messagesEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.om-ai-action-btn');
        if (!btn || isTyping) return;

        const actionType = btn.getAttribute('data-action');
        const query = btn.getAttribute('data-query');

        if (actionType === 'scrollToCta') {
            toggleChat(false);
            const cta = document.getElementById('cta');
            if (cta) {
                cta.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }


        if (query) {
            triggerQuery(query, btn.textContent);
        }
    });

    function triggerQuery(key, displayText) {
        addUserMessage(displayText || key);
        const response = KNOWLEDGE_BASE[key] || resolveQuery(key);
        if (response) {
            chatHistory.push({ role: 'user', content: displayText || key });
            chatHistory.push({ role: 'assistant', content: response.content });
            isTyping = true;
            showTypingIndicator();

            setTimeout(() => {
                removeTypingIndicator();
                addBotMessage(response, true);
                isTyping = false;
            }, 350 + Math.random() * 200);
        }
    }

    function addUserMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'om-ai-msg om-ai-msg-user';
        msg.innerHTML = `
            <div class="om-ai-msg-bubble">${escapeHTML(text)}</div>
        `;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'om-ai-msg om-ai-msg-bot om-ai-typing-indicator';
        indicator.id = 'om-ai-typing';
        indicator.innerHTML = `
            <div class="om-ai-msg-avatar">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#C99722"><circle cx="12" cy="12" r="8"/></svg>
            </div>
            <div class="om-ai-msg-bubble om-ai-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesEl.appendChild(indicator);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('om-ai-typing');
        if (indicator) indicator.remove();
    }

    function addBotMessage(responseObj, stream = false) {
        const msg = document.createElement('div');
        msg.className = 'om-ai-msg om-ai-msg-bot';

        let formattedText = formatMarkdown(responseObj.content);

        let actionsHTML = '';
        if (responseObj.actions && responseObj.actions.length > 0) {
            actionsHTML = `
                <div class="om-ai-msg-actions">
                    ${responseObj.actions.map(act => `
                        <button class="om-ai-action-btn" 
                                ${act.query ? `data-query="${act.query}"` : ''} 
                                ${act.action ? `data-action="${act.action}"` : ''}>
                            ${act.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        msg.innerHTML = `
            <div class="om-ai-msg-avatar">
                <img src="${atlasAvatarPath}" alt="Atlas" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div class="om-ai-msg-body">
                ${responseObj.title ? `<div class="om-ai-msg-heading">${escapeHTML(responseObj.title)}</div>` : ''}
                <div class="om-ai-msg-bubble om-ai-stream-target">${formattedText}</div>
                ${actionsHTML}
            </div>
        `;

        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (stream) {
            const target = msg.querySelector('.om-ai-stream-target');
            target.classList.add('om-ai-stream-fade');
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    function formatMarkdown(str) {
        if (!str) return '';
        let html = str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(?:^|\n)- (.*?)(?=\n|$)/g, '<br>&bull; $1')
            .replace(/(?:^|\n)(\d+)\. (.*?)(?=\n|$)/g, '<br><strong>$1.</strong> $2')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        // Trim leading <br> if generated by first bullet
        if (html.startsWith('<br>')) {
            html = html.substring(4);
        }
        return html;
    }
}
