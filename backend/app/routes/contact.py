import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routes.auth import get_optional_current_user
from app.services.service_catalog import resolve_service
from app.services.email_service import send_company_notification, send_client_acknowledgement

router = APIRouter()

@router.post("/", response_model=schemas.EnquirySuccessResponse)
@router.post("", response_model=schemas.EnquirySuccessResponse)
def submit_enquiry(
    request: Request,
    message: schemas.EnquiryCreate,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Submit an enquiry with dual-send flow:
    1. Honeypot check (silent 200 if tripped, no save, no send).
    2. Save to 'enquiries' table immediately, status='new', attach user_id if logged in.
    3. Send company notification to EMAIL_TO with reply_to=client's email.
    4. Send client acknowledgement to client's email with reply_to=EMAIL_TO.
    5. Always return success if saved.
    """
    # 1. Honeypot check (silent 200 if tripped, no save, no send)
    honeypot_val = message.website or message.honeypot
    if honeypot_val and honeypot_val.strip():
        return {
            "success": True,
            "id": str(uuid.uuid4()),
            "message": "Enquiry received successfully"
        }

    user_id = current_user.id if current_user else None
    raw_service = message.service_slug or message.project_type or message.subject or "project-planning"
    canonical_slug, _ = resolve_service(raw_service)

    # Extract client IP
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    elif request.client:
        ip_address = request.client.host
    else:
        ip_address = None

    # 2. Save to enquiries table immediately
    enquiry = models.Enquiry(
        id=uuid.uuid4(),
        user_id=user_id,
        name=message.name.strip(),
        email=message.email.lower().strip(),
        phone=message.phone.strip() if message.phone else None,
        service_slug=canonical_slug,
        message=message.message.strip(),
        ip_address=ip_address,
        status="new",
        client_ack_status="pending"
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # 3. Send company notification
    try:
        company_email_id = send_company_notification(enquiry)
        enquiry.status = "company_notified"
        enquiry.company_email_id = str(company_email_id) if company_email_id else None
    except Exception as err:
        print(f"[ENQUIRY EMAIL ERROR] Company notification failed: {err}")
        enquiry.status = "company_notify_failed"

    # 4. Send client acknowledgement
    try:
        client_email_id = send_client_acknowledgement(enquiry)
        enquiry.client_ack_status = "sent"
        enquiry.client_email_id = str(client_email_id) if client_email_id else None
    except Exception as err:
        print(f"[ENQUIRY EMAIL ERROR] Client acknowledgement failed: {err}")
        enquiry.client_ack_status = "failed"

    # Commit email dispatch status updates
    try:
        db.commit()
    except Exception as err:
        print(f"[ENQUIRY DB ERROR] Failed to update email dispatch status: {err}")

    # 5. Always return success if step 2 succeeded
    return {
        "success": True,
        "id": str(enquiry.id),
        "message": "Enquiry received successfully"
    }
