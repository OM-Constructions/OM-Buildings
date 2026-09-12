from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.routes import contact, auth, me

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

# Configure CORS: with allow_credentials=True, allow_origin_regex allows any localhost/127.0.0.1 port
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(me.router, prefix="/api/v1/me", tags=["me"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["contact"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "message": "OM Buildings API is running"}
