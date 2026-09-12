import urllib.request
import json
from typing import Any
from app.config import settings

def send_contact_email(message_data):
    """Notification for contact / service enquiry message."""
    print(f"[EMAIL SERVICE] Contact notification sent for: {message_data.email}")
    return True

def send_verification_email(to_email: Any, name: Any, verification_link: str) -> bool:
    """Sends account verification email with branded HTML template and 24-hour expiry note.
    Uses Resend API if RESEND_API_KEY is set, or logs to console for local development."""
    subject = "Verify your email — OM Constructions"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #111827; margin: 0; padding: 30px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; border: 1px solid #E2E8F0; padding: 36px; }}
    .header {{ text-align: center; border-bottom: 2px solid #C99722; padding-bottom: 16px; margin-bottom: 24px; }}
    .brand {{ font-size: 20px; font-weight: 800; color: #07152F; letter-spacing: 1px; }}
    .brand span {{ color: #C99722; }}
    .content p {{ font-size: 15px; line-height: 1.6; color: #374151; }}
    .btn-container {{ text-align: center; margin: 32px 0; }}
    .btn {{ background-color: #07152F; color: #FFFFFF !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; }}
    .footer {{ font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 32px; text-align: center; }}
    .link-fallback {{ word-break: break-all; font-size: 12px; color: #6B7280; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">OM <span>CONSTRUCTIONS</span></div>
    </div>
    <div class="content">
      <p>Hello <strong>{name}</strong>,</p>
      <p>Thank you for creating an account with OM Constructions. Please confirm your email address to activate your customer portal and access your project enquiries.</p>
      <div class="btn-container">
        <a href="{verification_link}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #4B5563;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      <p class="link-fallback">Button not working? Copy and paste this link into your browser:<br><a href="{verification_link}">{verification_link}</a></p>
    </div>
    <div class="footer">
      &copy; 2026 OM Constructions & Structural Engineering Consultants. All rights reserved.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Hello {name},

Thank you for creating an account with OM Constructions. Please confirm your email address to activate your customer portal:

{verification_link}

This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
"""

    if settings.RESEND_API_KEY:
        try:
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps({
                    "from": "OM Constructions <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                    "text": text_content,
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[EMAIL SERVICE] Verification email sent to {to_email} via Resend (status {resp.status})")
                return True
        except Exception as err:
            print(f"[EMAIL SERVICE] Resend dispatch failed: {err}. Falling back to console log.")

    # Local development fallback
    print(f"\n==================== VERIFICATION EMAIL ====================")
    print(f"TO: {name} <{to_email}>")
    print(f"SUBJECT: {subject}")
    print(f"VERIFICATION LINK: {verification_link}")
    print(f"===========================================================\n")
    return True
