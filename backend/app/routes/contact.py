import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routes.auth import get_current_user
from app.services.service_catalog import resolve_service
from app.services.email_service import send_company_notification, send_client_acknowledgement

router = APIRouter()

@router.post("/", response_model=schemas.EnquirySuccessResponse)
@router.post("", response_model=schemas.EnquirySuccessResponse)
def submit_enquiry(
    request: Request,
    message: schemas.EnquiryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an enquiry with authenticated customer requirement:
    1. Honeypot check (silent 200 if tripped, no save, no send).
    2. Save to 'enquiries' table immediately, bound to current_user.id.
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

    user_id = current_user.id
    client_name = message.name.strip() if message.name and message.name.strip() else current_user.name
    client_email = current_user.email.lower().strip() if current_user.email else message.email.lower().strip()
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
        name=client_name,
        email=client_email,
        phone=message.phone.strip() if message.phone else None,
        service_slug=canonical_slug,
        message=message.message.strip(),
        ip_address=ip_address,
        status="new",
        client_ack_status="pending"
    )
    db_saved = False
    try:
        db.add(enquiry)
        db.commit()
        db.refresh(enquiry)
        db_saved = True
    except Exception as db_err:
        print(f"[ENQUIRY DB ERROR] Could not save to DB, proceeding to email dispatch: {db_err}")
        try:
            db.rollback()
        except Exception:
            pass

    # 3. Send company notification
    company_notified = False
    try:
        company_email_id = send_company_notification(enquiry)
        enquiry.status = "company_notified"
        enquiry.company_email_id = str(company_email_id) if company_email_id else None
        company_notified = True
    except Exception as err:
        print(f"[ENQUIRY EMAIL ERROR] Company notification failed: {err}")
        enquiry.status = "company_notify_failed"

    # 4. Send client acknowledgement
    client_ack_sent = False
    try:
        client_email_id = send_client_acknowledgement(enquiry)
        enquiry.client_ack_status = "sent"
        enquiry.client_email_id = str(client_email_id) if client_email_id else None
        client_ack_sent = True
    except Exception as err:
        print(f"[ENQUIRY EMAIL ERROR] Client acknowledgement failed: {err}")
        enquiry.client_ack_status = "failed"

    # Commit email dispatch status updates if saved
    if db_saved:
        try:
            db.commit()
        except Exception as err:
            print(f"[ENQUIRY DB ERROR] Failed to update email dispatch status: {err}")

    # If neither email could be delivered, do not pretend it succeeded
    if not company_notified and not client_ack_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send enquiry email. Please try again or contact us directly."
        )

    # 5. Return success
    return {
        "success": True,
        "id": str(enquiry.id),
        "message": "Enquiry received successfully"
    }
