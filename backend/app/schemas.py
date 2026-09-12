import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = "General Inquiry"
    project_type: Optional[str] = None
    message: str = Field(..., min_length=1)
    estimated_budget: Optional[str] = None
    location: Optional[str] = None
    timeline: Optional[str] = None
    # Honeypot field - bots will fill this out, real users won't
    website: Optional[str] = None

class ContactMessageResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    project_type: Optional[str] = None
    message: str
    estimated_budget: Optional[str] = None
    location: Optional[str] = None
    timeline: Optional[str] = None
    status: str = "Received"
    created_at: datetime

    class Config:
        from_attributes = True

class UserSignup(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class AuthSuccessResponse(BaseModel):
    success: bool = True
    name: str

class GenericMessageResponse(BaseModel):
    success: bool = True
    message: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class SubmissionItem(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    project_type: Optional[str] = None
    message: str
    estimated_budget: Optional[str] = None
    location: Optional[str] = None
    timeline: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
