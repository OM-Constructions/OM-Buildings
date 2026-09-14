from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app import models, schemas
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/submissions", response_model=List[schemas.SubmissionItem])
def get_user_submissions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve only the logged-in customer's own enquiries, ordered by created_at desc.
    Matches by user_id OR case-insensitive customer email so all past enquiries are recalled.
    """
    user_email = (current_user.email or "").strip().lower()
    submissions = (
        db.query(models.Enquiry)
        .filter(
            or_(
                models.Enquiry.user_id == current_user.id,
                func.lower(models.Enquiry.email) == user_email
            )
        )
        .order_by(models.Enquiry.created_at.desc())
        .all()
    )

    # Link any unlinked submissions to this user account
    needs_commit = False
    for sub in submissions:
        if sub.user_id != current_user.id:
            sub.user_id = current_user.id
            needs_commit = True
    if needs_commit:
        try:
            db.commit()
        except Exception:
            db.rollback()

    return submissions
