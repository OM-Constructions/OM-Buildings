import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models
from app.services.token_service import create_verification_token

client = TestClient(app, base_url="http://localhost:8000")

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

    print("--- 2. Testing Successful Signup (Unverified & No Cookie) ---")
    client.cookies.clear()
    res = client.post("/api/v1/auth/signup", json={"name": "Alice Wonderland", "email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 200, f"Signup failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert "Check your email" in data["message"]
    assert "access_token" not in res.cookies, "Cookie should NOT be issued before email verification"

    alice_user = db.query(models.User).filter(models.User.email == "alice@gmail.com").first()
    assert alice_user is not None
    assert alice_user.is_verified is False
    assert alice_user.verification_sent_at is not None
    print("✓ Successful signup creates unverified user and issues NO session cookie")

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

    print("--- 5. Testing Email Verification ---")
    # Invalid token
    res = client.get("/api/v1/auth/verify-email?token=invalid.tampered.token")
    assert res.status_code == 400
    assert "Invalid or expired" in res.json()["detail"]
    print("✓ Invalid token rejected with 400")

    # Valid token
    verify_token = create_verification_token(alice_user.id)
    res = client.get(f"/api/v1/auth/verify-email?token={verify_token}")
    assert res.status_code == 200
    assert res.json()["success"] is True

    db.refresh(alice_user)
    assert alice_user.is_verified is True
    print("✓ Valid token verifies user and sets is_verified=True in database")

    print("--- 6. Testing Login After Verification ---")
    client.cookies.clear()
    res = client.post("/api/v1/auth/login", json={"email": "alice@gmail.com", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.cookies
    alice_cookie = res.cookies["access_token"]
    print("✓ Verified user can now log in successfully and receives session cookie")

    print("--- 7. Testing /auth/me with Verified Session ---")
    res = client.get("/api/v1/auth/me", cookies={"access_token": alice_cookie})
    assert res.status_code == 200
    assert res.json()["name"] == "Alice Wonderland"
    print("✓ /auth/me returns authenticated user profile")

    print("--- 8. Testing Resend Verification ---")
    # Unverified user resend
    bob = models.User(name="Bob", email="bob@gmail.com", password_hash="hash", is_verified=False)
    db.add(bob)
    db.commit()

    res = client.post("/api/v1/auth/resend-verification", json={"email": "bob@gmail.com"})
    assert res.status_code == 200
    assert "If that account exists" in res.json()["message"]

    # Non-existent user resend (same generic response)
    res = client.post("/api/v1/auth/resend-verification", json={"email": "nonexistent@gmail.com"})
    assert res.status_code == 200
    assert "If that account exists" in res.json()["message"]
    print("✓ Resend verification endpoint returns generic 200 for existing and non-existing accounts")

    print("--- 9. Testing Submissions with Verified Account ---")
    res = client.post(
        "/api/v1/contact/",
        json={
            "name": "Alice Wonderland",
            "email": "alice@gmail.com",
            "subject": "Structural Engineering",
            "project_type": "Structural Engineering",
            "message": "Consultation request for residential project."
        },
        cookies={"access_token": alice_cookie}
    )
    assert res.status_code == 200
    sub_id = res.json()["id"]

    res = client.get("/api/v1/me/submissions", cookies={"access_token": alice_cookie})
    assert res.status_code == 200
    subs = res.json()
    assert len(subs) == 1
    assert subs[0]["id"] == sub_id
    print("✓ Verified user submissions correctly linked and retrieved")

    print("\nALL EMAIL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    db.close()

if __name__ == "__main__":
    run_tests()
