import gsap from 'gsap';

export function initHeroVisual() {
    const video = document.getElementById('hero-video');
    const annotations = document.querySelectorAll('.annotation');
    
    if (!video) return;

    // 1. Initial Entrance Animation (Revealed when intro finishes)
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#hero",
            start: "top 60%",
            toggleActions: "play none none none"
        }
    });

    // Fade in background and video
    tl.fromTo(video, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1, ease: "power2.inOut" }
    );

    // Stagger annotations fade and subtle movement
    if (annotations.length > 0) {
        tl.fromTo(annotations,
            { opacity: 0, y: 15, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.3, ease: "power2.out" },
            "-=0.5"
        );
    }
}
