import os
import re

css_file = 'frontend/style.css'
with open(css_file, 'r') as f:
    content = f.read()

# Truncate anything after the marker (and including it)
marker = "/* \n==================================================\nSERVICE PAGES STYLING\n================================================== \n*/"
if marker in content:
    content = content.split(marker)[0].strip() + "\n\n"

new_css = """
/* 
==================================================
SERVICE PAGES STYLING
================================================== 
*/
.service-page-hero {
    background-color: var(--navy-primary);
    color: #fff;
    padding: 160px 0 100px;
    position: relative;
    overflow: hidden;
}
.service-page-hero .eyebrow {
    color: var(--gold-accent);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 2px;
    margin-bottom: 20px;
    display: block;
}
.service-page-hero h1 {
    font-family: var(--font-heading);
    font-size: 4rem;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 30px;
    max-width: 900px;
}
.service-page-hero p {
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.8);
    max-width: 700px;
    line-height: 1.6;
}
.service-hero-accent {
    position: absolute;
    right: 5%;
    top: 50%;
    transform: translateY(-50%);
    width: 400px;
    height: 400px;
    border: 1px solid rgba(201, 151, 34, 0.15);
    border-radius: 50%;
    z-index: 0;
}
.service-hero-accent::after {
    content: '';
    position: absolute;
    top: 15%;
    left: 15%;
    width: 70%;
    height: 70%;
    border: 1px dashed rgba(201, 151, 34, 0.2);
    border-radius: 50%;
}
.service-hero-accent::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background: var(--gold-accent);
    border-radius: 50%;
}

/* Common Section padding */
.sp-section {
    padding: 120px 0;
}
.sp-section-dark {
    background-color: var(--navy-primary);
    color: #fff;
}
.sp-section-gray {
    background-color: var(--bg-secondary);
}
.sp-label {
    font-family: var(--font-heading);
    color: var(--gold-accent);
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 20px;
    display: block;
    letter-spacing: 1px;
}
.sp-title {
    font-family: var(--font-heading);
    font-size: 2.5rem;
    margin-bottom: 40px;
    color: var(--navy-primary);
}
.sp-section-dark .sp-title {
    color: #fff;
}

/* 01 - OVERVIEW */
.sp-overview p {
    font-size: 1.3rem;
    line-height: 1.8;
    color: var(--text-muted);
    max-width: 800px;
}

/* 02 - WHAT WE FOCUS ON */
.sp-focus-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    margin-top: 50px;
}
.sp-focus-item {
    background: #fff;
    padding: 40px;
    border-radius: 8px;
    border: 1px solid rgba(7, 21, 47, 0.08);
}
.sp-focus-item h3 {
    font-family: var(--font-heading);
    color: var(--navy-primary);
    font-size: 1.25rem;
    margin-bottom: 15px;
}
.sp-focus-item p {
    color: var(--text-muted);
    line-height: 1.6;
}

/* 03 - OUR APPROACH */
.sp-approach-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-top: 50px;
}
.sp-approach-step {
    position: relative;
    padding-top: 30px;
    border-top: 2px solid rgba(255, 255, 255, 0.1);
}
.sp-approach-step::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--gold-accent);
}
.sp-approach-step h4 {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    margin-bottom: 10px;
    letter-spacing: 1px;
    color: #fff;
}
.sp-approach-step p {
    color: rgba(255,255,255,0.6);
    font-size: 0.95rem;
    line-height: 1.5;
}

/* 04 - VISUAL / CTA */
.sp-visual {
    padding: 0;
    width: 100%;
}
.sp-visual img {
    width: 100%;
    max-height: 700px;
    object-fit: cover;
    display: block;
}

.sp-cta {
    text-align: center;
}
.sp-cta h2 {
    font-family: var(--font-heading);
    font-size: 3.5rem;
    color: var(--navy-primary);
    margin-bottom: 20px;
}
.sp-cta p {
    font-size: 1.2rem;
    color: var(--text-muted);
    margin-bottom: 40px;
}

/* GSAP utility class */
.gsap-reveal {
    opacity: 0;
    visibility: hidden;
}

@media (max-width: 1024px) {
    .sp-approach-grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
    .sp-focus-grid { grid-template-columns: repeat(2, 1fr); }
    .service-page-hero h1 { font-size: 3.2rem; }
}
@media (max-width: 768px) {
    .sp-approach-grid { grid-template-columns: 1fr; }
    .sp-focus-grid { grid-template-columns: 1fr; }
    .service-page-hero h1 { font-size: 2.5rem; }
    .service-hero-accent { display: none; }
}
"""

with open(css_file, 'w') as f:
    f.write(content + new_css)
print("style.css updated successfully.")
