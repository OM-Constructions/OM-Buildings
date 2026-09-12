from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routes.auth import get_optional_current_user
from app.services.email_service import send_contact_email

router = APIRouter()

@router.post("/", response_model=schemas.ContactMessageResponse)
def submit_contact(
    message: schemas.ContactMessageCreate,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Submit a contact message. If honeypot is filled, discard silently.
    If a valid session cookie exists, attach user_id. Otherwise save with user_id=None."""
    # Honeypot verification: bots fill hidden fields, humans do not
    if message.website and message.website.strip():
        # Return fake successful response to bot without inserting into DB
        return schemas.ContactMessageResponse(
            id=0,
            name=message.name,
            email=message.email,
            subject=message.subject or "General Inquiry",
            project_type=message.project_type,
            message=message.message,
            status="Received",
            created_at=datetime.utcnow()
        )

    user_id = current_user.id if current_user else None
    project_type = message.project_type or message.subject or "General Inquiry"

    db_message = models.ContactMessage(
        name=message.name,
        email=message.email,
        subject=message.subject or "General Inquiry",
        project_type=project_type,
        message=message.message,
        status="Received",
        user_id=user_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Send email (mock / configured)
    send_contact_email(message)

    return db_message
