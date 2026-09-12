from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import contact

app = FastAPI(
    title="OM Buildings API",
    description="Backend API for OM Buildings",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contact.router, prefix="/api/v1/contact", tags=["contact"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "message": "OM Buildings API is running"}
