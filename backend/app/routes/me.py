from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/submissions", response_model=List[schemas.SubmissionItem])
def get_user_submissions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve only the logged-in customer's own enquiries, ordered by created_at desc."""
    submissions = (
        db.query(models.ContactMessage)
        .filter(models.ContactMessage.user_id == current_user.id)
        .order_by(models.ContactMessage.created_at.desc())
        .all()
    )
    return submissions
