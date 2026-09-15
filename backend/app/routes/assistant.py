import logging
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.services.company_info import COMPANY_INFO

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

SYSTEM_PROMPT = """You are the OM AI Advisor, the virtual consultant for OM Constructions & Engineering Consultants, a construction and structural engineering firm.

STRICT INSTRUCTIONS & SAFETY GUARDRAILS:
1. Scope: Only answer questions about OM Constructions & Engineering Consultants: our 10 core services, our engineering process, typical workflows in general terms, industries we work with, and how to get in touch or book a consultation.
2. Safety & Engineering Calculations: NEVER provide specific structural, load-bearing, beam/column/slab dimensions, reinforcement sizing, or safety-critical calculations. Explain clearly that site soil conditions, architectural loads, and IS/international building codes require a qualified structural engineer to review project blueprints, and direct the client to submit a project enquiry or book a consultation.
3. Pricing & Quotes: NEVER quote firm or definitive prices. You may describe the estimation process in general terms and direct the client to our Estimation & Costing service or project enquiry form for an itemized Bill of Quantities (BOQ).
4. Unrelated Questions: If asked about topics unrelated to OM Constructions, civil/structural engineering, or construction (e.g. general trivia, coding, unrelated subjects), politely decline and redirect back to how OM Constructions can assist with their building project.
5. Identity & Tone: Never claim to be a human. Never invent testimonials, client names, or statistics not provided in the company knowledge below. Keep answers concise, grounded, professional, and helpful.

COMPANY KNOWLEDGE BASE:
{company_info}
"""

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[List[ChatMessage]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str

def _get_anthropic_client():
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    except Exception as err:
        logger.error(f"[ASSISTANT] Failed to initialize Anthropic client: {err}")
        return None

def get_assistant_reply(message: str, history: List[ChatMessage]) -> str:
    client = _get_anthropic_client()
    if not client:
        # Fallback when Anthropic API key is not configured
        return (
            "Thank you for contacting OM Constructions & Engineering Consultants. "
            "Our team of senior structural engineers and architects specializes in Architectural Design, "
            "Structural Analysis, Geotechnical Soil Testing, 3D Building Visualization, and Cost Estimation. "
            "Please submit your project details using our enquiry form below or reach us directly at "
            "omengineeringconsultants06@gmail.com / +91 831 016 0257."
        )

    # Sanitize and cap history to last 6 exchanges (up to 12 messages)
    sanitized_history = []
    if history:
        for turn in history[-12:]:
            sanitized_history.append({
                "role": turn.role,
                "content": turn.content
            })

    messages_payload = [
        *sanitized_history,
        {"role": "user", "content": message}
    ]

    try:
        response = client.messages.create(
            model=settings.ASSISTANT_MODEL,
            max_tokens=400,
            system=SYSTEM_PROMPT.format(company_info=COMPANY_INFO),
            messages=messages_payload,
        )
        if response and response.content:
            return response.content[0].text
        return "I apologize, but I could not generate a response at this moment. Please submit an enquiry to speak with an engineer."
    except Exception as err:
        logger.error(f"[ASSISTANT API ERROR] Anthropic call failed: {err}")
        return (
            "Our AI Advisor is momentarily experiencing high demand. "
            "You can explore our 10 core services above or submit a project consultation enquiry "
            "at omengineeringconsultants06@gmail.com to connect directly with our engineering team."
        )

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
def chat_with_assistant(request: Request, body: ChatRequest):
    """Public assistant endpoint with 10 requests/minute per IP rate limiting.
    Accepts current user message and conversation history, invokes Claude Haiku with guardrails.
    """
    user_query = body.message.strip()
    if not user_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")

    reply = get_assistant_reply(user_query, body.history or [])
    return ChatResponse(reply=reply)
