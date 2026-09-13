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

    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.login(user, password)
                server.sendmail(settings.EMAIL_FROM, recipients, msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(settings.EMAIL_FROM, recipients, msg.as_string())

        print(f"[SMTP SUCCESS] Email successfully delivered to {recipients}")
        return "smtp_delivered"
    except Exception as err:
        print(f"[SMTP ERROR] Failed sending to {recipients}: {err}")
        raise err

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

def send_verification_email(to_email, name, verification_link):
    """Sends account verification email with branded HTML template via SMTP."""
    subject = "Verify your email — OM Constructions"
    body_html = f"""
    <p style="font-size:15px; color:#334155; line-height:1.6;">
      Hello <strong>{name}</strong>,
    </p>
    <p style="font-size:15px; color:#334155; line-height:1.6;">
      Thank you for registering an account with OM Constructions. Please confirm your email address to activate your customer portal and access your project enquiries:
    </p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="{verification_link}" style="background-color:#0d1b2a; color:#ffffff !important; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:15px; display:inline-block;">Verify Email Address</a>
    </div>
    <p style="font-size:13px; color:#64748b;">This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this message.</p>
    <p style="font-size:12px; color:#94a3b8; word-break:break-all;">Direct link: <a href="{verification_link}">{verification_link}</a></p>
    """
    html = render_email(
        preheader="Confirm your OM Constructions account",
        heading="Verify Your Email",
        body_html=body_html
    )

    print(f"\n==================== VERIFICATION EMAIL ====================")
    print(f"TO: {name} <{to_email}>")
    print(f"SUBJECT: {subject}")
    print(f"VERIFICATION LINK: {verification_link}")
    print(f"===========================================================\n")

    try:
        if settings.SMTP_PASSWORD or settings.GMAIL_APP_PASSWORD:
            send_email(to=to_email, subject=subject, html=html)
    except Exception as err:
        print(f"[EMAIL SERVICE] Verification email dispatch notice: {err}")

    return True

# Backward compatibility alias
def send_contact_email(enquiry):
    return send_company_notification(enquiry)
