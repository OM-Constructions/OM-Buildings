import html

def render_email(preheader: str, heading: str, body_html: str) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background:#0d1b2a; padding: 24px 32px;">
        <span style="color:#e0a951; font-size:20px; font-weight:700;">OM Constructions</span>
        <span style="color:#ffffff; font-size:14px; margin-left:8px;">& Engineering Consultants</span>
      </div>
      <div style="padding: 32px;">
        <h2 style="color:#0d1b2a; margin-top:0; font-size: 22px; border-bottom: 2px solid #e0a951; padding-bottom: 8px;">{heading}</h2>
        {body_html}
      </div>
      <div style="background:#f8fafc; padding:20px 32px; color:#64748b; font-size:12px; border-top: 1px solid #e2e8f0;">
        <p style="margin:0; font-weight: 600; color: #334155;">OM Constructions & Engineering Consultants</p>
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
    """Returns (subject, html) for acknowledging client submission with clear confirmation."""
    service_name = service_meta.get("name", "Project Planning")
    client_line = service_meta.get(
        "client_line",
        "Our engineering team will review your project requirements and follow up with you shortly."
    )
    clean_name = html.escape(enquiry.name)
    clean_phone = html.escape(enquiry.phone or "Not provided")
    clean_msg = html.escape(enquiry.message).replace("\n", "<br>")
    ref_id = str(enquiry.id)[:8].upper()

    subject = f"We've received your enquiry: {service_name} — OM Constructions [Ref #{ref_id}]"

    body_html = f"""
    <p style="font-size: 16px; color: #1e293b; line-height: 1.6; margin-top: 0;">
      Dear <strong>{clean_name}</strong>,
    </p>
    <p style="font-size: 15px; color: #334155; line-height: 1.6;">
      Thank you for reaching out to <strong>OM Constructions & Engineering Consultants</strong>.
    </p>
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
      <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600;">
        ✓ Your enquiry has been received and registered under Reference #{ref_id}.
      </p>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #047857; line-height: 1.5;">
        {client_line} Our team is analyzing your specifications and we will get back to you with preliminary details, timelines, and an indicative estimate shortly.
      </p>
    </div>

    <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h3 style="margin: 0 0 14px 0; color: #0d1b2a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
        Details of Your Submission
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Service Requested:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">{service_name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Contact Phone:</td>
          <td style="padding: 8px 0; color: #0f172a;">{clean_phone}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Enquiry Ref:</td>
          <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">#{ref_id}</td>
        </tr>
      </table>
      <div style="margin-top: 14px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Your Message / Requirements:</p>
        <div style="font-size: 14px; color: #334155; line-height: 1.6; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          {clean_msg}
        </div>
      </div>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
      <strong>Have drawings or site photos?</strong> You can reply directly to this email with attachments (PDFs, CAD drawings, or site images) to help us assess your project faster.
    </p>

    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 14px; color: #0d1b2a; font-weight: 700;">OM Constructions & Engineering Consultants</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Direct Engineering Consultation & Project Planning</p>
    </div>
    """

    rendered = render_email(
        preheader=f"Enquiry received for {service_name} — Ref #{ref_id}",
        heading="We Got Your Enquiry",
        body_html=body_html
    )
    return subject, rendered
