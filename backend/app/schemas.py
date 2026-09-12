from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactMessageResponse(ContactMessageCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
