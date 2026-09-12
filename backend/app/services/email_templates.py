import html

def render_email(preheader: str, heading: str, body_html: str) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background:#0d1b2a; padding: 24px 32px;">
        <span style="color:#e0a951; font-size:20px; font-weight:700;">OM Constructions</span>
        <span style="color:#ffffff; font-size:14px; margin-left:8px;">& Structural Engineering Consultants</span>
      </div>
      <div style="padding: 32px;">
        <h2 style="color:#0d1b2a; margin-top:0; font-size: 22px; border-bottom: 2px solid #e0a951; padding-bottom: 8px;">{heading}</h2>
        {body_html}
      </div>
      <div style="background:#f8fafc; padding:20px 32px; color:#64748b; font-size:12px; border-top: 1px solid #e2e8f0;">
        <p style="margin:0; font-weight: 600; color: #334155;">OM Constructions & Structural Engineering Consultants</p>
        <p style="margin:4px 0 0;">This is an automated notification — replies go straight to our team.</p>
      </div>
    </div>
    """

def build_company_notification_html(enquiry, service_meta: dict) -> tuple[str, str]:
    """Returns (subject, html) for notifying company inbox."""
    service_name = service_meta.get("name", "Project Enquiry")
    company_intro = service_meta.get("company_intro", "a new project enquiry")
    clean_name = html.escape(enquiry.name)
    clean_email = html.escape(enquiry.email)
    clean_phone = html.escape(enquiry.phone or "Not provided")
    clean_msg = html.escape(enquiry.message).replace("\n", "<br>")
    clean_ip = html.escape(enquiry.ip_address or "Unknown")

    subject = f"New enquiry: {service_name} - {enquiry.name}"

    body_html = f"""
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      You've received <strong>{company_intro}</strong> from <strong>{clean_name}</strong> (<a href="mailto:{clean_email}" style="color: #2563eb;">{clean_email}</a>).
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 18px; margin-bottom: 24px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 30%;">Client Name</td>
        <td style="padding: 8px 0; color: #0f172a;">{clean_name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Email Address</td>
        <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:{clean_email}" style="color: #2563eb;">{clean_email}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Phone Number</td>
        <td style="padding: 8px 0; color: #0f172a;">{clean_phone}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Requested Service</td>
        <td style="padding: 8px 0; color: #0f172a;"><strong>{service_name}</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Sender IP</td>
        <td style="padding: 8px 0; color: #64748b;">{clean_ip}</td>
      </tr>
    </table>

    <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; border-left: 4px solid #e0a951;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Project Requirements / Message:</p>
      <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">{clean_msg}</div>
    </div>
    """

    rendered = render_email(
        preheader=f"New enquiry from {enquiry.name} for {service_name}",
        heading=f"New Enquiry: {service_name}",
        body_html=body_html
    )
    return subject, rendered

def build_client_acknowledgement_html(enquiry, service_meta: dict) -> tuple[str, str]:
    """Returns (subject, html) for acknowledging client submission."""
    service_name = service_meta.get("name", "Project Planning")
    client_line = service_meta.get(
        "client_line",
        "Our engineering team will review your project details and follow up shortly."
    )
    clean_name = html.escape(enquiry.name)
    clean_msg = html.escape(enquiry.message).replace("\n", "<br>")

    subject = f"Thanks for reaching out to OM Constructions — {service_name}"

    body_html = f"""
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Dear {clean_name},
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      We've received your enquiry about <strong>{service_name}</strong>. {client_line}
    </p>

    <div style="margin: 24px 0; padding: 16px 20px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #e0a951;">
      <h4 style="margin: 0 0 8px 0; color: #0d1b2a; font-size: 14px;">Summary of Your Request:</h4>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;"><strong>Service:</strong> {service_name}</p>
      <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;"><strong>Details:</strong> {clean_msg}</p>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.5;">
      If you have additional blueprints, floor plans, or site photos you'd like to share, feel free to reply directly to this email.
    </p>

    <p style="font-size: 14px; color: #0d1b2a; margin-top: 24px;">
      Warm regards,<br>
      <strong>OM Constructions & Structural Engineering Team</strong>
    </p>
    """

    rendered = render_email(
        preheader=f"We've received your enquiry for {service_name}",
        heading=f"Thanks for reaching out, {clean_name}",
        body_html=body_html
    )
    return subject, rendered
