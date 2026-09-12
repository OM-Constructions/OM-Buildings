import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { LogoSystem } from './logo.js';
import { playLogoAnimation } from './animation.js';
import { LogoInteraction } from './interaction.js';
import { initHeroVisual } from './heroVisual.js';
import { initServicesHover } from './servicesHover.js';

gsap.registerPlugin(ScrollTrigger);

let scene, camera, renderer, logoSystem, interaction;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 1, 1000);
    camera.position.z = 100;
    
    const canvas = document.getElementById('webgl-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    logoSystem = new LogoSystem(scene);
    await logoSystem.loadAssets();
    logoSystem.updateScale(w, h);
    
    interaction = new LogoInteraction(camera, logoSystem, renderer);
    
    window.addEventListener('resize', onWindowResize);
    
    renderer.setAnimationLoop(render);
    
    playLogoAnimation(logoSystem, interaction);

    // Initialize Hero right-side visual
    initHeroVisual();

    // Initialize ScrollTrigger Animations for homepage
    initScrollAnimations();
    
    // Initialize Navbar scroll effect
    initNavbarScroll();

    // Initialize Services Hover Interrupt Management
    initServicesHover();
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
