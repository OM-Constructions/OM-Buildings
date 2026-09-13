import gsap from 'gsap';

export function playLogoAnimation(logoSystem, interaction, renderer) {
    // Lock scrolling initially to prevent scrolling during intro
    document.body.style.overflow = 'hidden';

    // Reset states
    gsap.set(logoSystem.materials.ring.uniforms.uProgress, { value: 0.0 });

    gsap.set(logoSystem.meshes.bars.scale, { y: 1.0 });
    gsap.set(logoSystem.materials.bars.uniforms.uProgress, { value: 0.0 });

    gsap.set(logoSystem.materials.m.uniforms.uOpacity, { value: 0.0 });
    gsap.set(logoSystem.materials.m.uniforms.uHighlight, { value: 0.0 });
    gsap.set(logoSystem.meshes.m.scale, { x: 0.96, y: 0.96 });

    gsap.set(".company-name", { opacity: 0, y: 10 });
    gsap.set(".tagline", { opacity: 0, y: 6 });

    // Create master timeline
    const isMobile = window.innerWidth <= 768;

    const tl = gsap.timeline({
        delay: isMobile ? 0.05 : 0.2,
        onComplete: () => {
            if (interaction) {
                console.log("INTRO COMPLETE - ENABLING HOVER");
                interaction.enable();
            }

            // Unlock scrolling after the entire intro finishes
            document.body.style.overflowY = 'auto';
            document.body.style.overflowX = 'hidden';

            // Remove the 'display: none' so the splash stays in the document flow
            const splash = document.getElementById('intro-splash');

            // The render loop is now managed by the IntersectionObserver in main.js
            // which pauses it when the splash section scrolls out of view.
        }
    });

    if (isMobile) {
        tl.timeScale(4.5); // Fast mobile intro ~1s
    }

    // PHASE 1: Q Reveal (0.00s - 2.10s)
    tl.to(logoSystem.materials.ring.uniforms.uProgress, {
        value: 1.05,
        duration: 2.1,
        ease: "power2.inOut"
    }, 0)

        // PHASE 2: Bars Grow & M Reveal (2.10s - 2.80s)
        .add("logoConstruction", 2.1)

        .to(logoSystem.materials.bars.uniforms.uProgress, {
            value: 1.0,
            duration: 0.7,
            ease: "power2.inOut" // Smooth shader growth
        }, "logoConstruction")

        .to(logoSystem.materials.m.uniforms.uOpacity, {
            value: 1.0,
            duration: 0.7,
            ease: "power2.out" // Fade in
        }, "logoConstruction")

        .to(logoSystem.meshes.m.scale, {
            x: 1.0,
            y: 1.0,
            duration: 0.7,
            ease: "power3.out" // Lock into place
        }, "logoConstruction")

        // Subtle continuity glint on M (2.20s - 2.80s)
        .to(logoSystem.materials.m.uniforms.uHighlight, {
            value: 1.0,
            duration: 0.6,
            ease: "power1.inOut"
        }, 2.2)

        // PHASE 3: Logo Settle (2.80s - 3.10s)
        .add("logoSettle", 2.8)

        .to(logoSystem.logoGroup.position, {
            y: -10,
            duration: 0.3,
            ease: "power1.inOut"
        }, "logoSettle")

        // PHASE 4: Text Reveal (3.10s+)
        .add("textReveal", 3.1)

        .to(".company-name", {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out"
        }, "textReveal")

        .to(".tagline", {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
        }, "textReveal+=0.2")

        // PHASE 5: Page Reveal
        .add("pageReveal", "+=0.2") // Wait a moment after text is revealed

        .to(['#navbar', '#homepage-content', 'footer', '#om-ai-widget'], {
            opacity: 1,
            visibility: "visible",
            duration: 1.0,
            ease: "power2.out"
        }, "pageReveal");
}
