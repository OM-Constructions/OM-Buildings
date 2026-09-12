import os

services_data = [
    {
        "slug": "architectural-design",
        "eyebrow": "ARCHITECTURE",
        "title": "ARCHITECTURAL DESIGN",
        "intro": "Creative, functional and sustainable architectural solutions designed around the purpose, character and requirements of each project.",
        "img": "architectural-design.png",
        "focus": [
            "Concept development",
            "Space planning",
            "Functional layouts",
            "Design development",
            "Architectural coordination",
            "Design refinement"
        ]
    },
    {
        "slug": "architectural-2d-plans",
        "eyebrow": "TECHNICAL DRAWINGS",
        "title": "ARCHITECTURAL 2D PLANS",
        "intro": "Clear and detailed architectural drawings that communicate the planned spaces, dimensions and design intent with precision.",
        "img": "architectural-plans.png",
        "focus": [
            "Floor plans",
            "Layout drawings",
            "Detailed 2D documentation",
            "Dimensions",
            "Room and space organization",
            "Technical drawing coordination"
        ]
    },
    {
        "slug": "structural-design",
        "eyebrow": "STRUCTURAL ENGINEERING",
        "title": "STRUCTURAL DESIGN",
        "intro": "Structural solutions focused on safety, strength, reliability and efficient structural planning.",
        "img": "structural-design.png",
        "focus": [
            "Structural planning",
            "Load considerations",
            "Structural layouts",
            "Design coordination",
            "Safety-focused structural thinking",
            "Efficient structural solutions"
        ]
    },
    {
        "slug": "project-planning",
        "eyebrow": "PROJECT MANAGEMENT",
        "title": "PROJECT PLANNING",
        "intro": "Organized project planning focused on efficient execution, clear coordination, time management and cost awareness.",
        "img": "project-planning.png",
        "focus": [
            "Project planning",
            "Scheduling",
            "Coordination",
            "Resource planning",
            "Execution planning",
            "Progress monitoring"
        ]
    },
    {
        "slug": "interior-design",
        "eyebrow": "INTERIORS",
        "title": "INTERIOR DESIGN",
        "intro": "Thoughtful interior environments combining functionality, comfort and visual character to create spaces that work beautifully.",
        "img": "interior-design.png",
        "focus": [
            "Interior concepts",
            "Space utilization",
            "Material direction",
            "Functional planning",
            "Interior detailing",
            "Aesthetic coordination"
        ]
    },
    {
        "slug": "geotechnical-report",
        "eyebrow": "GROUND & FOUNDATION ANALYSIS",
        "title": "GEOTECHNICAL REPORT",
        "intro": "Ground and soil information that supports informed foundation planning and safer structural decisions.",
        "img": None,
        "focus": [
            "Ground investigation",
            "Soil-related information",
            "Foundation considerations",
            "Site-related analysis",
            "Engineering decision support"
        ]
    }
]

template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | OM Constructions</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../style.css?v=4">
    
    <script type="importmap">
        {{
            "imports": {{
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "gsap": "https://unpkg.com/gsap@3.12.2/index.js",
                "gsap/ScrollTrigger": "https://unpkg.com/gsap@3.12.2/ScrollTrigger.js"
            }}
        }}
    </script>
</head>
<body>

    <!-- NAV BAR -->
    <nav id="navbar" class="scrolled">
        <div class="container nav-container">
            <a href="../../index.html" class="nav-brand">OM<span>Constructions</span></a>
            <div class="nav-links">
                <a href="../../index.html#hero">HOME</a>
                <a href="../../index.html#services">SERVICES</a>
            </div>
            <div class="nav-cta">
                <a href="../../index.html#cta" class="btn-primary">Let's Talk</a>
            </div>
            <button class="hamburger">☰</button>
        </div>
    </nav>

    <main id="homepage-content">
        <!-- HERO -->
        <section class="service-page-hero">
            <div class="container gsap-reveal">
                <span class="eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                <p>{intro}</p>
                <div class="service-hero-accent"></div>
            </div>
        </section>

        <!-- 01 OVERVIEW -->
        <section class="sp-section sp-overview">
            <div class="container gsap-reveal">
                <span class="sp-label">01 &mdash; OVERVIEW</span>
                <p>At OM Constructions, we believe that exceptional engineering begins with a deep understanding of purpose. Our {title} services are designed to address both the aesthetic desires and functional necessities of your project. We leverage modern methodologies to ensure everything we design is resilient, sustainable, and built to the highest industry standards.</p>
            </div>
        </section>

        <!-- 02 WHAT WE FOCUS ON -->
        <section class="sp-section sp-section-gray">
            <div class="container gsap-reveal">
                <span class="sp-label" style="color: var(--navy-primary);">02 &mdash; WHAT WE FOCUS ON</span>
                <h2 class="sp-title">Capabilities & Deliverables</h2>
                <div class="sp-focus-grid">
                    {focus_items}
                </div>
            </div>
        </section>

        <!-- 03 OUR APPROACH -->
        <section class="sp-section sp-section-dark">
            <div class="container gsap-reveal">
                <span class="sp-label">03 &mdash; OUR APPROACH</span>
                <h2 class="sp-title">How We Execute</h2>
                
                <div class="sp-approach-grid">
                    <div class="sp-approach-step">
                        <h4>UNDERSTAND</h4>
                        <p>We analyze the site, clarify your core objectives, and define the scope clearly.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>PLAN</h4>
                        <p>Developing strategic plans to optimize resources, budget, and timeline.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>DEVELOP</h4>
                        <p>Crafting precise blueprints and solutions for seamless execution.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>COORDINATE</h4>
                        <p>Integrating disciplines to reduce conflicts and ensure viability.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>DELIVER</h4>
                        <p>Rigorous quality checks and final handover meeting all standards.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- VISUAL SECTION -->
        {visual_section}

        <!-- 04 CTA -->
        <section class="sp-section sp-cta">
            <div class="container gsap-reveal">
                <span class="sp-label" style="color: var(--navy-primary);">04 &mdash; READY?</span>
                <h2>HAVE A PROJECT IN MIND?</h2>
                <p>Let's discuss your requirements and turn the idea into something real.</p>
                <a href="../../index.html#cta" class="btn-primary" style="background-color: var(--gold-accent); color: var(--navy-primary);">START A PROJECT &rarr;</a>
            </div>
        </section>
    </main>

    <!-- FOOTER -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <h3>OM CONSTRUCTIONS</h3>
                    <p>& STRUCTURAL ENGINEERING CONSULTANTS</p>
                </div>
                <div class="footer-col">
                    <h4>Navigation</h4>
                    <ul>
                        <li><a href="../../index.html#hero">Home</a></li>
                        <li><a href="../../index.html#services">Services</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <span>&copy; 2026 OM Constructions. All rights reserved.</span>
            </div>
        </div>
    </footer>

    <!-- GSAP ANIMATIONS & CORE SCRIPTS -->
    <script type="module" src="../../src/main.js"></script>
    <script type="module">
        import gsap from 'gsap';
        import ScrollTrigger from 'gsap/ScrollTrigger';
        
        // Use a short timeout to ensure main.js has finished removing the intro splash cover if it fails WebGL
        setTimeout(() => {{
            const reveals = document.querySelectorAll('.gsap-reveal');
            reveals.forEach((el) => {{
                gsap.fromTo(el, 
                    {{ opacity: 0, y: 50, visibility: 'hidden' }}, 
                    {{
                        scrollTrigger: {{
                            trigger: el,
                            start: "top 85%",
                            toggleActions: "play none none none"
                        }},
                        opacity: 1,
                        y: 0,
                        visibility: 'visible',
                        duration: 1,
                        ease: "power2.out"
                    }}
                );
            }});
        }}, 100);
    </script>
</body>
</html>
"""

os.makedirs('frontend/services', exist_ok=True)

for service in services_data:
    os.makedirs(f"frontend/services/{service['slug']}", exist_ok=True)
    
    # Generate focus items
    focus_html = ""
    for item in service['focus']:
        focus_html += f"""
                    <div class="sp-focus-item">
                        <h3>{item}</h3>
                        <p>Providing exact, professional outcomes focused on practical value and precision.</p>
                    </div>"""
    
    # Generate visual section
    visual_section = ""
    if service["img"]:
        visual_section = f"""
        <section class="sp-visual">
            <img src="../../assets/services/{service['img']}" alt="{service['title']} Visual" class="gsap-reveal">
        </section>"""
        
    html = template.format(
        eyebrow=service["eyebrow"],
        title=service["title"],
        intro=service["intro"],
        focus_items=focus_html,
        visual_section=visual_section
    )
    
    with open(f"frontend/services/{service['slug']}/index.html", "w") as f:
        f.write(html)

print("All 6 service pages generated successfully based on the strict requirements.")
