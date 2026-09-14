from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from typing import Any

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
    db_status = "ok"
    db_error = None
    try:
        from app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "error"
        db_error = str(e)
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "message": "OM Buildings API is running",
        "db": {
            "status": db_status,
            "error": db_error,
            "is_sqlite": is_sqlite,
            "configured_url_type": "postgresql" if "postgres" in settings.DATABASE_URL else "sqlite"
        }
    }

@app.get("/api/v1/health/test-smtp")
def test_smtp_diagnostic():
    import smtplib
    import socket
    password = (settings.SMTP_PASSWORD or settings.SMTP_PASS or settings.GMAIL_APP_PASSWORD or "").replace(" ", "")
    user = settings.SMTP_USER or settings.EMAIL_FROM
    results: dict[str, Any] = {
        "smtp_host": settings.SMTP_HOST,
        "smtp_user": user,
        "password_length": len(password)
    }

    # 1. DNS check
    try:
        ip = socket.gethostbyname(settings.SMTP_HOST)
        results["dns"] = {"success": True, "ip": ip}
    except Exception as e:
        results["dns"] = {"success": False, "error": str(e)}

    # 2. Port 465 check
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=10) as server:
            server.login(user, password)
            results["port_465"] = {"success": True, "message": "SSL connection & auth succeeded"}
    except Exception as e:
        results["port_465"] = {"success": False, "error_type": type(e).__name__, "error": str(e)}

    # 3. Port 587 check
    try:
        with smtplib.SMTP(settings.SMTP_HOST, 587, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            results["port_587"] = {"success": True, "message": "STARTTLS connection & auth succeeded"}
    except Exception as e:
        results["port_587"] = {"success": False, "error_type": type(e).__name__, "error": str(e)}

    return results

import os
from fastapi.staticfiles import StaticFiles

FRONTEND_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
