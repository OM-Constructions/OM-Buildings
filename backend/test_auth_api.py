import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models
from app.services.token_service import create_verification_token

client = TestClient(app, base_url="http://localhost:8000")

from datetime import datetime, timezone, timedelta
from app.services.auth_service import hash_otp

def run_tests():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clean up test database
    db.query(models.ContactMessage).delete()
    db.query(models.User).delete()
    db.commit()

    print("--- 1. Testing Password & Deliverability / Disposable Validation ---")
    # Short password
    res = client.post("/api/v1/auth/signup", json={"name": "Alice", "email": "alice@gmail.com", "password": "short"})
    assert res.status_code == 400
    assert "Password must be at least 8 characters" in res.json()["detail"]
    print("✓ Short password rejected with 400")

    # Disposable domain (e.g. mailinator.com)
    res = client.post("/api/v1/auth/signup", json={"name": "Alice", "email": "alice@mailinator.com", "password": "password123"})
    assert res.status_code == 400
    assert "Please enter a valid email address" in res.json()["detail"]
    print("✓ Disposable email domain rejected with generic 400")

    # Fake domain without MX records
    res = client.post("/api/v1/auth/signup", json={"name": "Alice", "email": "alice@nonexistent-fake-domain-12345.xyz", "password": "password123"})
    assert res.status_code == 400
    assert "Please enter a valid email address" in res.json()["detail"]
    print("✓ Domain without MX records rejected with generic 400")

    print("--- 2. Testing Successful Signup (OTP Stored, Unverified & No Cookie) ---")
    client.cookies.clear()
    res = client.post("/api/v1/auth/signup", json={"name": "Alice Wonderland", "email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 200, f"Signup failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert "Enter the code" in data["message"]
    assert data["email"] == "alice@gmail.com"
    assert "access_token" not in res.cookies, "Cookie should NOT be issued before OTP verification"

    alice_user = db.query(models.User).filter(models.User.email == "alice@gmail.com").first()
    assert alice_user is not None
    assert alice_user.is_verified is False
    assert alice_user.otp_hash is not None
    assert alice_user.otp_expires_at is not None
    assert alice_user.otp_attempts == 0
    print("✓ Successful signup creates unverified user with hashed OTP and issues NO session cookie")

    print("--- 3. Testing Duplicate Signup Rejection ---")
    res = client.post("/api/v1/auth/signup", json={"name": "Alice 2", "email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 400
    assert "Unable to create account" in res.json()["detail"]
    print("✓ Duplicate signup returns generic 400")

    print("--- 4. Testing Login Block for Unverified User ---")
    res = client.post("/api/v1/auth/login", json={"email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 403, f"Expected 403 for unverified user, got {res.status_code}"
    error_data = res.json()
    assert error_data.get("error") == "email_not_verified"
    assert "access_token" not in res.cookies
    print("✓ Unverified user login blocked with 403 email_not_verified")

    print("--- 5. Testing OTP Verification: Wrong Code, Attempt Limiting, and Expiration ---")
    # Nonexistent user or wrong OTP
    res = client.post("/api/v1/auth/verify-otp", json={"email": "nonexistent@gmail.com", "otp": "123456"})
    assert res.status_code == 400
    assert "Invalid or expired" in res.json()["detail"]
    print("✓ Non-existent account returns generic 400 anti-enumeration")

    # Set known test OTP on Alice
    known_otp = "654321"
    alice_user.otp_hash = hash_otp(known_otp)
    alice_user.otp_attempts = 0
    alice_user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit()

    # Wrong OTP increments attempt count
    res = client.post("/api/v1/auth/verify-otp", json={"email": "alice@gmail.com", "otp": "999999"})
    assert res.status_code == 400
    assert "Invalid or expired" in res.json()["detail"]
    db.refresh(alice_user)
    assert alice_user.otp_attempts == 1
    print("✓ Wrong OTP rejected with generic 400 and increments otp_attempts")

    # Simulate 5 failed attempts (lockout with 429)
    alice_user.otp_attempts = 5
    db.commit()
    res = client.post("/api/v1/auth/verify-otp", json={"email": "alice@gmail.com", "otp": known_otp})
    assert res.status_code == 429
    assert "Too many attempts" in res.json()["detail"]
    print("✓ 5+ failed attempts triggers 429 Too Many Attempts")

    # Simulate expired OTP
    alice_user.otp_attempts = 0
    alice_user.otp_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.commit()
    res = client.post("/api/v1/auth/verify-otp", json={"email": "alice@gmail.com", "otp": known_otp})
    assert res.status_code == 400
    assert "Code expired" in res.json()["detail"]
    print("✓ Expired code rejected with 400 Code expired")

    print("--- 6. Testing Successful OTP Verification & Immediate Session Login ---")
    alice_user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    alice_user.otp_attempts = 0
    db.commit()

    client.cookies.clear()
    res = client.post("/api/v1/auth/verify-otp", json={"email": "alice@gmail.com", "otp": known_otp})
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "access_token" in res.cookies, "Correct OTP verification must set the session cookie"
    session_cookie = res.cookies["access_token"]

    db.refresh(alice_user)
    assert alice_user.is_verified is True
    assert alice_user.otp_hash is None
    assert alice_user.otp_expires_at is None
    assert alice_user.otp_attempts == 0
    print("✓ Correct OTP verifies user, sets session cookie, and clears OTP fields")

    print("--- 7. Testing /auth/me with Verified Session ---")
    res = client.get("/api/v1/auth/me", cookies={"access_token": session_cookie})
    assert res.status_code == 200
    assert res.json()["name"] == "Alice Wonderland"
    print("✓ /auth/me returns authenticated user profile via session cookie")

    print("--- 8. Testing Normal Password Login for Verified User ---")
    client.cookies.clear()
    res = client.post("/api/v1/auth/login", json={"email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.cookies
    print("✓ Verified user logs in with password normally without needing another OTP")

    print("--- 9. Testing Resend OTP ---")
    # Unverified user resend
    bob = models.User(name="Bob", email="bob@gmail.com", password_hash="hash", is_verified=False)
    db.add(bob)
    db.commit()

    res = client.post("/api/v1/auth/resend-otp", json={"email": "bob@gmail.com"})
    assert res.status_code == 200
    assert "If that account exists" in res.json()["message"]
    db.refresh(bob)
    assert bob.otp_hash is not None
    assert bob.otp_attempts == 0

    # Second immediate call from same client should trigger rate limiter (1/minute)
    res = client.post("/api/v1/auth/resend-otp", json={"email": "nonexistent@gmail.com"})
    assert res.status_code == 429
    print("✓ Resend OTP endpoint is strictly rate-limited (1 request per minute per IP triggers 429)")

    print("--- 10. Testing Submissions with Verified Account ---")
    res = client.post(
        "/api/v1/contact/",
        json={
            "name": "Alice Wonderland",
            "email": "alice@gmail.com",
            "subject": "Structural Engineering",
            "project_type": "Structural Engineering",
            "message": "Consultation request for residential project."
        },
        cookies={"access_token": session_cookie}
    )
    assert res.status_code == 200
    sub_id = res.json()["id"]

    res = client.get("/api/v1/me/submissions", cookies={"access_token": session_cookie})
    assert res.status_code == 200
    subs = res.json()
    assert len(subs) == 1
    assert subs[0]["id"] == sub_id
    print("✓ Verified user submissions correctly linked and retrieved")

    print("\nALL 5-MINUTE OTP VERIFICATION TESTS PASSED SUCCESSFULLY!")
    db.close()

if __name__ == "__main__":
    run_tests()
