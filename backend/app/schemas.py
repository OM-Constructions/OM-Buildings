import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field

class EnquiryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: Optional[str] = None
    service_slug: Optional[str] = None
    project_type: Optional[str] = None  # Backward compatibility
    subject: Optional[str] = None       # Backward compatibility
    message: str = Field(..., min_length=1)
    # Honeypot fields
    website: Optional[str] = None
    honeypot: Optional[str] = None

class EnquirySuccessResponse(BaseModel):
    success: bool = True
    id: str
    message: Optional[str] = "Enquiry received successfully"

# Backward compatibility schema
ContactMessageCreate = EnquiryCreate

class ContactMessageResponse(BaseModel):
    id: Any
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = "General Inquiry"
    project_type: Optional[str] = None
    service_slug: Optional[str] = None
    message: str
    status: str = "new"
    client_ack_status: Optional[str] = "pending"
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
    token: Optional[str] = None

class GenericMessageResponse(BaseModel):
    success: bool = True
    message: str

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResendOtpRequest(BaseModel):
    email: EmailStr

class SignupResponse(BaseModel):
    success: bool = True
    message: str = "Enter the code sent to your email"
    email: str

class SubmissionItem(BaseModel):
    id: Any
    name: str
    phone: Optional[str] = None
    service_slug: Optional[str] = None
    project_type: Optional[str] = None
    message: str
    status: str
    client_ack_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
