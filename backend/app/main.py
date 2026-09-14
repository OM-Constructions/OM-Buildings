from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.routes import contact, auth, me, assistant

app = FastAPI(
    title="OM Buildings API",
    description="Backend API for OM Buildings - Customer Accounts & Enquiries",
    version="1.0.0"
)

# Attach rate limiter to app state
app.state.limiter = auth.limiter

def rate_limit_handler(request, exc):
    return _rate_limit_exceeded_handler(request, exc)

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Configure CORS: with allow_credentials=True, allow localhost and any Vercel deployment domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(me.router, prefix="/api/v1/me", tags=["me"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["contact"])
app.include_router(contact.router, prefix="/api/v1/enquiries", tags=["enquiries"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["assistant"])

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "OM Buildings API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1/health")
def health_check():
    import os
    has_resend = bool(settings.RESEND_API_KEY)
    has_brevo = bool(os.getenv("BREVO_API_KEY"))
    has_smtp = bool(settings.SMTP_PASSWORD or settings.GMAIL_APP_PASSWORD)
    active_provider = "resend" if has_resend else ("brevo" if has_brevo else ("smtp" if has_smtp else "none"))
    return {
        "status": "ok",
        "message": "OM Buildings API is running",
        "email_service": {
            "active_provider": active_provider,
            "has_resend_api_key": has_resend,
            "has_brevo_api_key": has_brevo,
            "has_smtp_password": has_smtp,
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": settings.SMTP_PORT
        }
    }

import os
from fastapi.staticfiles import StaticFiles

FRONTEND_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
