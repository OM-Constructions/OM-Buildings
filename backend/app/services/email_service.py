import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .service_catalog import SERVICES, resolve_service
from ..config import settings
from .email_templates import (
    render_email,
    build_company_notification_html,
    build_client_acknowledgement_html,
)

def send_via_smtp(to, subject, html, reply_to=None):
    """Sends email directly via SMTP (e.g. Gmail SSL port 465 or STARTTLS 587)."""
    password = (settings.SMTP_PASSWORD or settings.GMAIL_APP_PASSWORD or "").replace(" ", "")
    user = settings.SMTP_USER or settings.EMAIL_FROM

    if not password:
        print(f"\n[EMAIL NOTICE - SMTP LOCAL] To: {to} | Subject: {subject}")
        print(f"SMTP_PASSWORD is not set yet in backend/.env. Email content logged locally.\n")
        return "mock_smtp_id_local"

    msg = MIMEMultipart("alternative")
    msg["From"] = f"OM Constructions <{settings.EMAIL_FROM}>"
    msg["To"] = to if isinstance(to, str) else ", ".join(to)
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to or settings.EMAIL_TO
    msg.attach(MIMEText(html, "html"))

    if isinstance(to, str):
        recipients = [addr.strip() for addr in to.split(",") if addr.strip()]
    elif isinstance(to, (list, tuple)):
        recipients = list(to)
    else:
        recipients = [str(to)]

    # Try configured port first with 4s timeout, then try fallback port (465 <-> 587)
    ports_to_try = [settings.SMTP_PORT]
    if settings.SMTP_PORT == 465 and 587 not in ports_to_try:
        ports_to_try.append(587)
    elif settings.SMTP_PORT == 587 and 465 not in ports_to_try:
        ports_to_try.append(465)

    last_err = None
    for port in ports_to_try:
        try:
            if port == 465:
                with smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=4) as server:
                    server.login(user, password)
                    server.sendmail(settings.EMAIL_FROM, recipients, msg.as_string())
            else:
                with smtplib.SMTP(settings.SMTP_HOST, port, timeout=4) as server:
                    server.starttls()
                    server.login(user, password)
                    server.sendmail(settings.EMAIL_FROM, recipients, msg.as_string())
            print(f"[SMTP SUCCESS] Email successfully delivered to {recipients} via port {port}")
            return "smtp_delivered"
        except Exception as err:
            last_err = err
            print(f"[SMTP ATTEMPT FAILED] Port {port} error: {err}")

    print(f"[SMTP ERROR] Failed sending to {recipients} on all attempted ports: {last_err}")
    raise last_err

def send_email(to, subject, html, reply_to=None):
    """Primary email dispatcher using SMTP."""
    return send_via_smtp(to, subject, html, reply_to)

def send_company_notification(enquiry):
    """Sends company notification to settings.EMAIL_TO with reply_to = client's email."""
    _, service_meta = resolve_service(getattr(enquiry, "service_slug", None))
    subject, html = build_company_notification_html(enquiry, service_meta)
    return send_email(
        to=settings.EMAIL_TO,
        subject=subject,
        html=html,
        reply_to=enquiry.email
    )

def send_client_acknowledgement(enquiry):
    """Sends client acknowledgement to enquiry.email with reply_to = company inbox."""
    _, service_meta = resolve_service(getattr(enquiry, "service_slug", None))
    subject, html = build_client_acknowledgement_html(enquiry, service_meta)
    return send_email(
        to=enquiry.email,
        subject=subject,
        html=html,
        reply_to=settings.EMAIL_TO
    )

def send_otp_email(to_email: str, name: str, otp: str):
    """Sends 6-digit OTP verification email with branded HTML template via SMTP."""
    subject = f"{otp} is your OM Constructions verification code"
    body_html = f"""
    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:16px;">
      Hello <strong>{name}</strong>,
    </p>
    <p style="font-size:15px; color:#334155; line-height:1.6; margin-bottom:24px;">
      Thank you for registering with OM Constructions. Use the verification code below to verify your email address and activate your client account:
    </p>
    <div style="text-align:center; margin: 30px 0;">
      <div style="display:inline-block; letter-spacing: 8px; font-size: 36px; font-weight: 800; color: #0d1b2a; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 14px 28px; font-family: 'Courier New', Courier, monospace;">
        {otp}
      </div>
    </div>
    <p style="font-size:14px; color:#475569; text-align:center; font-weight: 600; margin-bottom: 24px;">
      This verification code will expire in <strong>5 minutes</strong>.
    </p>
    <p style="font-size:13px; color:#64748b; line-height:1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      If you did not request this verification code, please disregard this email. Your email address remains secure.
    </p>
    """
    html = render_email(
        preheader=f"Your OM Constructions verification code is {otp}",
        heading="Verify Your Account",
        body_html=body_html
    )

    print(f"\n==================== OTP VERIFICATION EMAIL ====================")
    print(f"TO: {name} <{to_email}>")
    print(f"SUBJECT: {subject}")
    print(f"OTP CODE: {otp} (Expires in 5 minutes)")
    print(f"================================================================\n")

    try:
        if settings.SMTP_PASSWORD or settings.GMAIL_APP_PASSWORD:
            send_email(to=to_email, subject=subject, html=html)
            return True
        else:
            return False
    except Exception as err:
        print(f"[EMAIL SERVICE] OTP email dispatch failed: {err}")
        return False

# Backward compatibility alias
def send_contact_email(enquiry):
    return send_company_notification(enquiry)
