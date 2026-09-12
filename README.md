# OM Buildings

## Project Structure

This repository is organized into distinct frontend and backend directories for clean collaboration.

### `frontend/`
- Website UI
- Three.js (3D experiences)
- GSAP (animations)
- Assets (images, videos, etc.)

**How to run locally:**
1. Navigate to the frontend directory: `cd frontend`
2. Start a local server: `python3 -m http.server 8000`
3. Open `http://localhost:8000` in your browser.

### `backend/`
- Python API (FastAPI)
- Database configuration (SQLAlchemy)
- Contact API routes
- Email service integrations

**How to run locally:**
1. Navigate to the backend directory: `cd backend`
2. Create and activate a virtual environment (recommended).
3. Install dependencies: `pip install -r requirements.txt`
4. Start the backend API: `uvicorn app.main:app --reload`
5. The API will be available at `http://localhost:8000` (ensure it runs on a different port than the frontend if running simultaneously, e.g., using `--port 8080`).

## Collaboration
Please see `CODEOWNERS` for directory responsibilities. Backend changes should be isolated to `/backend/` and frontend changes isolated to `/frontend/` to avoid merge conflicts.
