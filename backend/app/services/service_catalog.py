SERVICES = {
    "architectural-design": {
        "name": "Architectural Design",
        "company_intro": "a new architectural design enquiry",
        "client_line": "Our architectural design team will review your requirements and get back to you with next steps.",
    },
    "architectural-2d-plans": {
        "name": "Architectural 2D Plans",
        "company_intro": "a request for architectural 2D plans",
        "client_line": "Our drafting team will review your plan requirements and reach out with next steps.",
    },
    "structural-design": {
        "name": "Structural Design",
        "company_intro": "a structural design enquiry",
        "client_line": "Our structural engineers will review your project details and follow up shortly.",
    },
    "project-planning": {
        "name": "Project Planning",
        "company_intro": "a project planning enquiry",
        "client_line": "Our planning team will review your timeline and scope and get back to you soon.",
    },
    "interior-design": {
        "name": "Interior Design",
        "company_intro": "an interior design enquiry",
        "client_line": "Our interior design team will review your space and style preferences and follow up shortly.",
    },
    "geotechnical-report": {
        "name": "Geotechnical Report",
        "company_intro": "a geotechnical report request",
        "client_line": "Our geotechnical team will review your site details and reach out to schedule next steps.",
    },
    "mep-designs": {
        "name": "MEP Designs",
        "company_intro": "an MEP design enquiry",
        "client_line": "Our MEP design team will review your requirements and get back to you shortly.",
    },
    "3d-building-design": {
        "name": "3D Building Design",
        "company_intro": "a 3D building design enquiry",
        "client_line": "Our design visualization team will review your project and follow up with next steps.",
    },
    "realistic-rendering": {
        "name": "Realistic Rendering",
        "company_intro": "a rendering request",
        "client_line": "Our rendering team will review your requirements and reach out shortly.",
    },
    "estimation-costing": {
        "name": "Estimation & Costing",
        "company_intro": "an estimation & costing enquiry",
        "client_line": "Our estimation team will review your project scope and follow up with a cost breakdown.",
    },
    "total-station-survey": {
        "name": "Total Station Survey",
        "company_intro": "a Total Station survey enquiry",
        "client_line": "Our surveying team will review your site coordinates and survey scope and reach out shortly.",
    },
    "interior-design-execution": {
        "name": "Interior Design + Execution",
        "company_intro": "an interior design and execution enquiry",
        "client_line": "Our interior design and turnkey execution team will review your requirements and reach out with next steps.",
    },
    "complete-design-package": {
        "name": "Complete Design Package",
        "company_intro": "a Complete Design Package enquiry",
        "client_line": "Our multidisciplinary engineering and architectural team will review your project scope and follow up promptly.",
    },
    "premium-complete-design-package": {
        "name": "Premium Complete Design Package",
        "company_intro": "a Premium Complete Design Package enquiry",
        "client_line": "Our senior design and structural team will review your premium package requirements and follow up with you.",
    },
    "turnkey-home-construction": {
        "name": "Turnkey Home Construction",
        "company_intro": "a Turnkey Home Construction enquiry",
        "client_line": "Our project management and construction execution team will review your project details and get in touch.",
    },
}

def resolve_service(slug_or_name: str | None) -> tuple[str, dict]:
    """Resolves a service slug or title into canonical (slug, service_dict).
    Falls back gracefully if unrecognized."""
    if not slug_or_name:
        slug = "project-planning"
        return slug, SERVICES[slug]

    raw = slug_or_name.strip().lower()

    # Exact slug match
    if raw in SERVICES:
        return raw, SERVICES[raw]

    # Normalized slug match (e.g., 'PROJECT PLANNING' -> 'project-planning')
    normalized = raw.replace(" & ", "-").replace("&", "-").replace(" ", "-")
    while "--" in normalized:
        normalized = normalized.replace("--", "-")
    if normalized in SERVICES:
        return normalized, SERVICES[normalized]

    # Partial name match
    for slug, meta in SERVICES.items():
        if meta["name"].lower() == raw or slug in raw:
            return slug, meta

    # Fallback to general project planning
    default_slug = "project-planning"
    return default_slug, SERVICES[default_slug]
