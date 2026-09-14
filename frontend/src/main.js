import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { LogoSystem } from './logo.js';
import { playLogoAnimation } from './animation.js';
import { LogoInteraction } from './interaction.js';
import { initHeroVisual } from './heroVisual.js';
import { initServicesHover } from './servicesHover.js';
import { initAIAssistant } from './aiAssistant.js';
import { initServiceContactCards } from './serviceEnquiry.js';

gsap.registerPlugin(ScrollTrigger);

let scene, camera, renderer, logoSystem, interaction;

async function init() {
    // 1. Initialize enquiry forms
    try {
        await initServiceContactCards();
    } catch (e) {
        console.warn('initServiceContactCards warning:', e);
    }

    // 2. Initialize AI Assistant
    try {
        initAIAssistant();
    } catch (e) {
        console.warn('initAIAssistant warning:', e);
    }

    // 3. Check if page has the WebGL 3D intro splash (only homepage has this)
    const splashCanvas = document.getElementById('webgl-canvas');
    const splashSection = document.getElementById('intro-splash');

    if (!splashCanvas || !splashSection) {
        // We are on a subpage or service detail page: reveal content immediately
        const hpContent = document.getElementById('homepage-content');
        if (hpContent) {
            hpContent.style.opacity = '1';
            hpContent.style.visibility = 'visible';
        }
        const nav = document.getElementById('navbar');
        if (nav) {
            nav.style.opacity = '1';
            nav.style.visibility = 'visible';
        }
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';

        initNavbarScroll();
        initMobileNav();
        return;
    }

    // 4. On Homepage: initialize homepage-specific components safely
    try {
        initHeroVisual();
        initScrollAnimations();
        initNavbarScroll();
        initMobileNav();
        initServicesHover();
    } catch (e) {
        console.warn('Component initialization warning:', e);
    }

    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const w = window.innerWidth;
        const h = window.innerHeight;

        camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 1, 1000);
        camera.position.z = 100;

        renderer = new THREE.WebGLRenderer({ canvas: splashCanvas, antialias: true, alpha: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        logoSystem = new LogoSystem(scene);
        
        // Timeout race: if textures take longer than 4s on slow networks, fail gracefully to reveal page
        const loadTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Logo texture loading timed out")), 4000)
        );
        await Promise.race([logoSystem.loadAssets(), loadTimeout]);
        logoSystem.updateScale(w, h);

        interaction = new LogoInteraction(camera, logoSystem, renderer);

        window.addEventListener('resize', onWindowResize);
        
        // Immediately start render loop so canvas draws frame 1
        renderer.setAnimationLoop(render);

        // Pause WebGL rendering when intro-splash is scrolled out of view
        if (splashSection && window.IntersectionObserver) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    renderer.setAnimationLoop(render);
                } else {
                    renderer.setAnimationLoop(null);
                }
            });
            observer.observe(splashSection);
        }

        playLogoAnimation(logoSystem, interaction, renderer);
    } catch (err) {
        console.warn('WebGL initialization skipped or failed, revealing homepage content:', err);
        if (splashSection) splashSection.style.display = 'none';
        gsap.to(['#navbar', '#homepage-content', 'footer', '#om-ai-widget'], {
            opacity: 1,
            visibility: "visible",
            duration: 0.5
        });
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
    }
}

function initScrollAnimations() {
    // Subtle fade-up for section titles and cards
    const sections = gsap.utils.toArray('section:not(#intro-splash):not(#hero)');

    sections.forEach(section => {
        gsap.fromTo(section,
            { opacity: 0, y: 40 },
            {
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out"
            }
        );
    });

    // Founder Profile Specific Animations
    const founderProfile = document.querySelector('.founder-profile');
    if (founderProfile) {
        gsap.fromTo('.founder-image-col',
            { opacity: 0, x: -30 },
            {
                scrollTrigger: {
                    trigger: '.founder-profile',
                    start: "top 75%",
                    toggleActions: "play none none none"
                },
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: "power2.out"
            }
        );

        gsap.fromTo('.founder-info-col > *',
            { opacity: 0, y: 20 },
            {
                scrollTrigger: {
                    trigger: '.founder-profile',
                    start: "top 75%",
                    toggleActions: "play none none none"
                },
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            }
        );
    }
}

function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initMobileNav() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const navMenu = document.getElementById('nav-menu');
    const backdrop = document.getElementById('mobile-nav-backdrop');

    if (!mobileMenuBtn || !navMenu) return;

    function openMenu() {
        navMenu.classList.add('active');
        if (backdrop) {
            backdrop.style.display = 'block';
            // Force reflow
            void backdrop.offsetWidth;
            backdrop.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navMenu.classList.remove('active');
        if (backdrop) {
            backdrop.classList.remove('active');
            setTimeout(() => {
                backdrop.style.display = 'none';
            }, 300);
        }
        document.body.style.overflow = '';
    }

    mobileMenuBtn.addEventListener('click', openMenu);

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMenu);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeMenu);
    }

    // Close menu when a link is clicked
    const links = navMenu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.left = w / -2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = h / -2;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);

    if (logoSystem) {
        logoSystem.updateScale(w, h);
    }
}

function render() {
    if (interaction) interaction.update();
    renderer.render(scene, camera);
}

init();
