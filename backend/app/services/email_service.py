def send_contact_email(message_data):
    # This is a mock service. In a real application, 
    # integrate with SendGrid, AWS SES, or similar.
    print(f"Sending email notification for contact message from: {message_data.email}")
    return True
