"""Company knowledge block for OM Constructions & Engineering Consultants.
Used as grounding context for the AI Advisor assistant.
"""
from .service_catalog import SERVICES

SERVICE_DESCRIPTIONS = {
    "architectural-design": "Creative, functional, and sustainable architectural design centered around the unique purpose and character of each project, from concept development to space planning and architectural coordination.",
    "architectural-2d-plans": "Precise, clear 2D architectural drawings, floor plans, layout blueprints, Vaastu-compliant designs, and technical documentation for authority sanction and site execution.",
    "structural-design": "Comprehensive structural engineering analysis and high-integrity design for RCC and steel structures, engineered to withstand gravity, seismic (earthquake), and wind loads per national and international building standards.",
    "project-planning": "Holistic project management and planning covering scheduling, resource allocation, critical-path analysis, quality checks, and construction milestone controls.",
    "interior-design": "Tailored interior design focusing on functional space planning, modern aesthetics, material selections, lighting layouts, and ergonomic residential and commercial environments.",
    "geotechnical-report": "Geotechnical soil investigation, borehole testing, SPT analysis, and soil bearing capacity (SBC) reports to determine safe foundation depth and foundation type.",
    "mep-designs": "Integrated Mechanical, Electrical, and Plumbing (MEP) design, HVAC planning, power distribution, and firefighting systems compliant with building safety standards.",
    "3d-building-design": "Complete 3D spatial building design, BIM coordination, and digital volumetric modeling to align architectural, structural, and aesthetic requirements before construction.",
    "realistic-rendering": "Ultra-realistic 3D architectural renderings, exterior facade presentations, interior walk-throughs, and lighting visualizations.",
    "estimation-costing": "Detailed Bill of Quantities (BOQ), material take-offs, itemized rate analysis, and transparent budgeting to forecast construction costs accurately.",
    "total-station-survey": "Professional site measurement, spot levels, boundary coordinates, existing feature mapping, digital survey drawings, and contour surveying using advanced Total Station instruments.",
    "interior-design-execution": "Turnkey interior design combined with on-site execution, including 3D visualization, material procurement, bespoke furniture fabrication, lighting planning, and skilled labour coordination.",
    "complete-design-package": "Most popular multidisciplinary engineering & design package combining 2D architectural plans, 3D exterior elevation, structural design, MEP engineering, and BOQ/cost estimation.",
    "premium-complete-design-package": "Premium comprehensive design package with advanced architectural layouts, luxury 3D facade modeling, rigorous structural engineering, full MEP building systems, and itemized BOQ.",
    "turnkey-home-construction": "Complete residential construction solution from architectural and structural designs through premium material procurement, labor management, rigorous quality supervision, and final turnkey handover."
}

def _build_company_info() -> str:
    lines = [
        "COMPANY OVERVIEW:",
        "OM Constructions & Engineering Consultants is a premier construction, structural engineering, and architectural consultancy firm.",
        "",
        "CORE SERVICES OFFERED:"
    ]

    for slug, meta in SERVICES.items():
        name = meta["name"]
        desc = SERVICE_DESCRIPTIONS.get(slug, meta.get("client_line", ""))
        lines.append(f"- {name}: {desc}")

    lines.extend([
        "",
        "ENQUIRIES & CONSULTATIONS:",
        "Visitors can submit an enquiry from any service page or the contact/consultation section on the website. Our senior engineering and architectural team reviews every project scope and responds within 24 to 48 hours.",
        "",
        "TYPICAL PROJECT PROCESS:",
        "1. Initial Enquiry: Client shares preliminary requirements, sketches, or site details.",
        "2. Consultation: Engineering review to understand soil conditions, structural goals, and architectural preferences.",
        "3. Proposal & Estimation: Indicative timeline, material specifications, and itemized BOQ/cost breakdown.",
        "4. Execution & Coordination: Detailed drawings, structural analysis, site validation, and delivery.",
        "",
        "CONTACT & REACHABILITY:",
        "Email: omengineeringconsultants06@gmail.com",
        "Phone: +91 831 016 0257",
        "Offices and consultation available for residential, commercial, and industrial engineering projects."
    ])

    return "\n".join(lines)

COMPANY_INFO = _build_company_info()
