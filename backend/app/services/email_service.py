from .service_catalog import SERVICES, resolve_service
from ..config import settings
from .email_templates import (
    render_email,
    build_company_notification_html,
    build_client_acknowledgement_html,
)

def send_via_resend(to, subject, html, reply_to=None):
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL MOCK - RESEND] To: {to} | Subject: {subject} (RESEND_API_KEY not configured, logging locally)")
        return "mock_resend_id_local"

    import resend
    resend.api_key = settings.RESEND_API_KEY

    # Resend requires a verified domain OR onboarding@resend.dev (cannot send from @gmail.com)
    from_addr = settings.EMAIL_FROM
    if not from_addr or "@gmail.com" in from_addr or "@yahoo.com" in from_addr or "@hotmail.com" in from_addr:
        from_addr = "OM Constructions <onboarding@resend.dev>"

    recipient = to if isinstance(to, list) else [to]
    reply_target = reply_to or settings.EMAIL_TO
    if "@gmail.com" in str(reply_target):
        # reply_to can be any email address
        pass

    try:
        result = resend.Emails.send({
            "from": from_addr,
            "to": recipient,
            "reply_to": reply_target,
            "subject": subject,
            "html": html,
        })
        email_id = result.get("id")
        print(f"[RESEND SUCCESS] Email delivered to {recipient} | Resend ID: {email_id}")
        return email_id
    except Exception as err:
        err_msg = str(err)
        if "You can only send testing emails to your own email address" in err_msg:
            print(f"\n[RESEND SANDBOX NOTICE] Resend is in free testing mode. It only delivers to your registered account email.")
            print(f"Target was: {recipient}. To send to any external client, verify your custom domain at https://resend.com/domains")
            print(f"Enquiry is safely stored in Supabase database.\n")
            return "resend_sandbox_restricted"
        print(f"[RESEND ERROR] Failed to send email to {recipient}: {err}")
        raise err

def send_via_gmail_smtp(to, subject, html, reply_to=None):
    if not settings.GMAIL_APP_PASSWORD:
        print(f"[EMAIL MOCK - GMAIL] To: {to} | Subject: {subject} (GMAIL_APP_PASSWORD not configured, logging locally)")
        return None

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.EMAIL_FROM          # your real Gmail address
    msg["To"] = to if isinstance(to, str) else ", ".join(to)
    msg["Subject"] = subject
    msg["Reply-To"] = reply_to or settings.EMAIL_TO
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.EMAIL_FROM, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
    return None  # gmail doesn't give back a provider message id

def send_email(to, subject, html, reply_to=None):
    if settings.EMAIL_PROVIDER == "gmail_smtp":
        return send_via_gmail_smtp(to, subject, html, reply_to)
    return send_via_resend(to, subject, html, reply_to)

def send_company_notification(enquiry):
    """Sends company notification to settings.EMAIL_TO with reply_to = client email."""
    _, service_meta = resolve_service(getattr(enquiry, "service_slug", None))
    subject, html = build_company_notification_html(enquiry, service_meta)
    return send_email(
        to=settings.EMAIL_TO,
        subject=subject,
        html=html,
        reply_to=enquiry.email
    )

def send_client_acknowledgement(enquiry):
    """Sends client acknowledgement to enquiry.email with reply_to = settings.EMAIL_TO."""
    _, service_meta = resolve_service(getattr(enquiry, "service_slug", None))
    subject, html = build_client_acknowledgement_html(enquiry, service_meta)
    return send_email(
        to=enquiry.email,
        subject=subject,
        html=html,
        reply_to=settings.EMAIL_TO
    )

def send_verification_email(to_email, name, verification_link):
    """Sends account verification email with branded HTML template."""
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
        if settings.RESEND_API_KEY or (settings.EMAIL_PROVIDER == "gmail_smtp" and settings.GMAIL_APP_PASSWORD):
            send_email(to=to_email, subject=subject, html=html)
    except Exception as err:
        print(f"[EMAIL SERVICE] Verification email dispatch error: {err}")

    return True

# Backward compatibility alias
def send_contact_email(enquiry):
    return send_company_notification(enquiry)
