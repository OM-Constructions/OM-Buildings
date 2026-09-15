import os
from typing import TypedDict


class ServiceItem(TypedDict):
    slug: str
    eyebrow: str
    title: str
    intro: str
    img: str
    focus: list[str]


services_data: list[ServiceItem] = [
    {
        "slug": "construction-cost",
        "eyebrow": "PRICE",
        "title": "CONSTRUCTION COST",
        "intro": "Construction cost estimation and budgeting for your project.",
        "img": "construction-cost.png",
        "focus": [
            "Cost Estimation",
            "Budget Planning",
            "Project Cost Understanding"
        ]
    },
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
        "img": "geotechnical-report.png",
        "focus": [
            "Ground investigation",
            "Soil-related information",
            "Foundation considerations",
            "Site-related analysis",
            "Engineering decision support"
        ]
    },
    {
        "slug": "mep-design",
        "eyebrow": "MECHANICAL • ELECTRICAL • PLUMBING",
        "title": "MEP DESIGNS",
        "intro": "Integrated MEP planning that supports functional, efficient and coordinated building systems.",
        "img": "mep-design.png",
        "focus": [
            "Mechanical systems",
            "Electrical planning",
            "Plumbing coordination",
            "Services coordination",
            "Building-system integration",
            "Technical planning"
        ]
    },
    {
        "slug": "3d-building-design",
        "eyebrow": "3D ARCHITECTURAL VISUALIZATION",
        "title": "3D BUILDING DESIGN",
        "intro": "Detailed three-dimensional building designs that help visualize architectural form, spaces and project intent before construction.",
        "img": "3d-building-design.png",
        "focus": [
            "3D building modeling",
            "Architectural visualization",
            "Exterior design development",
            "Spatial visualization",
            "Design presentation",
            "Design refinement"
        ]
    },
    {
        "slug": "realistic-rendering",
        "eyebrow": "ARCHITECTURAL VISUALIZATION",
        "title": "REALISTIC RENDERING",
        "intro": "High-quality architectural renders that communicate the appearance, materials and atmosphere of a proposed space or building.",
        "img": "realistic-rendering.png",
        "focus": [
            "Photorealistic visualization",
            "Exterior rendering",
            "Interior rendering",
            "Material visualization",
            "Lighting visualization",
            "Presentation imagery"
        ]
    },
    {
        "slug": "estimation-costing",
        "eyebrow": "COST PLANNING",
        "title": "ESTIMATION & COSTING",
        "intro": "Structured construction estimation and costing to support informed project planning, budgeting and decision-making.",
        "img": "estimation-costing.png",
        "focus": [
            "Quantity estimation",
            "Cost planning",
            "Material considerations",
            "Budget analysis",
            "Project costing",
            "Cost documentation"
        ]
    },
    {
        "slug": "total-station-survey",
        "eyebrow": "LAND & SITE SURVEYING",
        "title": "TOTAL STATION SURVEY",
        "intro": "Professional site measurement and surveying using Total Station equipment for precise boundary, elevation, and contour documentation.",
        "img": "total-station-survey.png",
        "focus": [
            "Site measurement",
            "Boundary measurement",
            "Existing structure measurement",
            "Ground-level survey",
            "Spot levels",
            "Site coordinates",
            "Existing features mapping",
            "Digital survey drawing",
            "Contour information where required"
        ]
    },
    {
        "slug": "interior-design-execution",
        "eyebrow": "TURNKEY INTERIORS",
        "title": "INTERIOR DESIGN + EXECUTION",
        "intro": "Complete turnkey interior design and on-site execution, spanning 3D concepts, custom woodwork, lighting design, material procurement, and contractor supervision.",
        "img": "interior-design-execution.png",
        "focus": [
            "Interior design",
            "Space planning",
            "3D visualization",
            "Material selection",
            "Furniture planning",
            "Ceiling design",
            "Lighting planning",
            "Execution",
            "Material procurement",
            "Labour coordination"
        ]
    },
    {
        "slug": "complete-design-package",
        "eyebrow": "MOST POPULAR • RECOMMENDED",
        "title": "COMPLETE DESIGN PACKAGE",
        "intro": "A complete design package combining architectural planning, 3D elevation, structural design, MEP design and BOQ/estimation for an integrated build experience.",
        "img": "complete-design-package.png",
        "focus": [
            "2D Architectural Plan",
            "3D Elevation Design",
            "Structural Engineering Design",
            "Integrated MEP Design",
            "BOQ & Quantity Estimation",
            "Integrated Project Coordination"
        ]
    },
    {
        "slug": "premium-complete-design-package",
        "eyebrow": "PREMIUM ARCHITECTURAL SUITE",
        "title": "PREMIUM COMPLETE DESIGN PACKAGE",
        "intro": "Comprehensive luxury complete design package with advanced architectural layouts, bespoke 3D facade styling, high-integrity structural calculations, coordinated MEP, and detailed BOQ.",
        "img": "premium-complete-design-package.png",
        "focus": [
            "Advanced 2D Architectural Layouts",
            "Luxury 3D Facade & Elevation",
            "High-Integrity Structural Calculations",
            "Comprehensive MEP Systems",
            "Itemized BOQ & Material Schedules",
            "Dedicated Architectural Consultation"
        ]
    },
    {
        "slug": "turnkey-home-construction",
        "eyebrow": "COMPLETE SOLUTION",
        "title": "TURNKEY HOME CONSTRUCTION",
        "intro": "Complete end-to-end residential home construction from architectural design and foundation engineering to material procurement, labor management, and final turnkey handover.",
        "img": "turnkey-home-construction.png",
        "focus": [
            "Architectural & Structural Design",
            "MEP Building Systems",
            "BOQ & Cost Planning",
            "Material Procurement",
            "Labour Management",
            "Construction Execution",
            "Quality Supervision",
            "Site Coordination",
            "Project Management"
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
            <div class="nav-actions">
                <span id="nav-auth-container" class="nav-auth-group">
                    <a href="../../login.html" class="nav-auth-link nav-auth-login">Log In</a>
                    <a href="../../signup.html" class="nav-auth-link nav-auth-signup">Sign Up</a>
                </span>
                <a href="../../index.html#cta" class="btn-primary">Let's Talk</a>
                <script type="module">
                    import {{ getCurrentUser, logout }} from "../../src/auth.js";
                    const container = document.getElementById("nav-auth-container");
                    if (container) {{
                        getCurrentUser().then(user => {{
                            if (user) {{
                                container.innerHTML = `
                                    <a href="../../my-requests.html" class="nav-auth-link nav-auth-login" style="color: var(--gold-accent); font-weight: 600;">My Requests</a>
                                    <a href="#" id="nav-logout-link" class="nav-auth-link nav-auth-signup">Log Out</a>
                                `;
                                document.getElementById("nav-logout-link")?.addEventListener("click", async (e) => {{
                                    e.preventDefault();
                                    await logout().catch(() => {{}});
                                    window.location.reload();
                                }});
                            }}
                        }});
                    }}
                </script>
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
                {price_html}
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
                        <p>Understand the project requirements.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>PLAN</h4>
                        <p>Establish the appropriate design or technical approach.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>DEVELOP</h4>
                        <p>Develop the required design, documentation or visualization.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>COORDINATE</h4>
                        <p>Coordinate the relevant project requirements.</p>
                    </div>
                    <div class="sp-approach-step">
                        <h4>DELIVER</h4>
                        <p>Prepare the final output for the next stage of the project.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- VISUAL SECTION -->
        <section class="sp-visual">
            <img src="../../assets/services/{img}" alt="{title} Visual" class="gsap-reveal">
        </section>

        <!-- 04 CTA -->
        <section class="sp-section sp-cta">
            <div class="container gsap-reveal">
                <span class="sp-label" style="color: var(--navy-primary);">04 &mdash; READY?</span>
                <h2>HAVE A PROJECT IN MIND?</h2>
                <p>Let's discuss your requirements.</p>
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
                    <p>& ENGINEERING CONSULTANTS</p>
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

# Determine the absolute path to the project root assuming the script is run from project root or inside tools/
base_dir = os.path.dirname(os.path.abspath(__file__))
# If running from tools/, go up one level to root. If running from root, use current dir.
if os.path.basename(base_dir) == 'tools':
    project_root = os.path.dirname(base_dir)
else:
    project_root = base_dir

services_dir = os.path.join(project_root, 'frontend', 'services')
os.makedirs(services_dir, exist_ok=True)

for service in services_data:
    service_path = os.path.join(services_dir, service['slug'])
    os.makedirs(service_path, exist_ok=True)
    
    # Generate focus items
    focus_html = ""
    for item in service['focus']:
        focus_html += f"""
                    <div class="sp-focus-item">
                        <h3>{item}</h3>
                        <p>Providing exact, professional outcomes focused on practical value and precision.</p>
                    </div>"""
    
    price_html = ""
    if service.get("slug") == "construction-cost":
        price_html = '<div class="service-price-block" style="margin-bottom: 24px; max-width: 300px;"><span class="price-label">PRICE</span><span class="price-value" style="font-size: 1.5rem; color: var(--gold-accent);">₹2,500 / sqft</span></div>'

    html = template.format(
        eyebrow=service["eyebrow"],
        title=service["title"],
        intro=service["intro"],
        price_html=price_html,
        focus_items=focus_html,
        img=service["img"]
    )
    
    with open(os.path.join(service_path, "index.html"), "w") as f:
        f.write(html)

print(f"Successfully generated {len(services_data)} service pages.")
