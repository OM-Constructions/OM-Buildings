from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.email_service import send_contact_email

router = APIRouter()

@router.post("/", response_model=schemas.ContactMessageResponse)
def submit_contact(message: schemas.ContactMessageCreate, db: Session = Depends(get_db)):
    # Save to database
    db_message = models.ContactMessage(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Send email (mock)
    send_contact_email(message)
    
    return db_message
