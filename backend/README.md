# OM Buildings Backend API

FastAPI backend service powering OM Constructions website, customer accounts, and project enquiries.

## Features

- **Customer Authentication**: Secure signup and login using bcrypt password hashing (`passlib`) and signed JWT session tokens stored in `httpOnly`, `SameSite=Lax` cookies.
- **Rate Limiting**: Integrated `slowapi` on auth endpoints (`5/minute`) to deter brute-force and credential stuffing.
- **Account Enumeration Protection**: Generic error responses prevent revealing whether an email address is already registered.
- **Customer Submissions ("My Requests")**: Protected endpoint `GET /api/v1/me/submissions` strictly scoped to the logged-in customer's own enquiries.
- **Contact Form & Service Enquiries**: Seamless integration with the public contact form and per-service enquiry cards. Automatically associates `user_id` when authenticated; preserves guest submissions with `user_id = None`.
- **Honeypot Bot Protection**: Hidden honeypot field (`website`) silently catches bot submissions without writing them to the database.
- **Alembic Database Migrations**: Automated schema migrations for SQLite and PostgreSQL.

## API Endpoints

### Auth (`/api/v1/auth`)
- `POST /api/v1/auth/signup` — Register a customer account (`name`, `email`, `password` >= 8 chars). Sets session cookie.
- `POST /api/v1/auth/login` — Authenticate customer (`email`, `password`). Sets session cookie.
- `POST /api/v1/auth/logout` — Clear session cookie.
- `GET /api/v1/auth/me` — Return current logged-in customer's profile `{ name, email }`.

### Customer Portal (`/api/v1/me`)
- `GET /api/v1/me/submissions` — Retrieve the logged-in customer's own enquiries ordered by creation date descending.

### Contact (`/api/v1/contact`)
- `POST /api/v1/contact/` — Submit a general or per-service enquiry.

## Running Locally

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

## Future Scope / Planned Improvements

The following items are intentionally out-of-scope for the initial customer accounts milestone:
1. **Password Reset Flow**: Secure tokenized email links for resetting forgotten passwords.
2. **Email Verification**: Confirming ownership of email addresses upon initial registration.
3. **Automated Status Email Notifications**: Triggering transactional status update emails when an enquiry moves from `Received` to `Under Review` or `Completed`.
4. **Admin Dashboard / Staff Roles**: Internal backoffice management panel for staff to update enquiry statuses.
