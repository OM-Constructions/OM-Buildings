import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models

client = TestClient(app, base_url="http://localhost:8000")

def run_tests():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clean up test users
    db.query(models.ContactMessage).delete()
    db.query(models.User).delete()
    db.commit()

    print("--- 1. Testing Signup Validation ---")
    res = client.post("/api/v1/auth/signup", json={"name": "Alice", "email": "alice@example.com", "password": "short"})
    assert res.status_code == 400, f"Expected 400 for short password, got {res.status_code}: {res.text}"
    print("✓ Short password rejected with 400")

    print("--- 2. Testing Successful Signup ---")
    client.cookies.clear()
    res = client.post("/api/v1/auth/signup", json={"name": "Alice Wonderland", "email": "alice@example.com", "password": "password123"})
    assert res.status_code == 200, f"Signup failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["name"] == "Alice Wonderland"
    assert "access_token" in res.cookies, "Session cookie access_token not found in response cookies"
    alice_cookie = res.cookies["access_token"]
    print("✓ Successful signup and cookie issued")

    print("--- 3. Testing Duplicate Signup (Account Enumeration Prevention) ---")
    res = client.post("/api/v1/auth/signup", json={"name": "Alice 2", "email": "alice@example.com", "password": "password123"})
    assert res.status_code == 400
    assert "Unable to create account" in res.json()["detail"]
    print("✓ Duplicate signup returns generic 400")

    print("--- 4. Testing /auth/me ---")
    # Unauthenticated
    client.cookies.clear()
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401, f"Expected 401 for unauthenticated, got {res.status_code}"
    print("✓ Unauthenticated /auth/me returns 401")

    # Authenticated with Alice cookie
    res = client.get("/api/v1/auth/me", cookies={"access_token": alice_cookie})
    assert res.status_code == 200
    assert res.json() == {"name": "Alice Wonderland", "email": "alice@example.com"}
    print("✓ Authenticated /auth/me returns user profile")

    print("--- 5. Testing Login ---")
    client.cookies.clear()
    # Wrong password
    res = client.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]
    print("✓ Bad password returns generic 401")

    # Wrong email
    res = client.post("/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "password123"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]
    print("✓ Bad email returns same generic 401")

    # Correct login
    res = client.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.cookies
    print("✓ Valid login succeeds and sets cookie")

    print("--- 6. Testing Contact Form Submissions (Authenticated vs Guest) ---")
    client.cookies.clear()
    # Authenticated submission (Alice)
    res = client.post(
        "/api/v1/contact/",
        json={
            "name": "Alice Wonderland",
            "email": "alice@example.com",
            "subject": "Structural Design",
            "project_type": "Structural Design",
            "message": "Need a design for a 3-storey commercial building."
        },
        cookies={"access_token": alice_cookie}
    )
    assert res.status_code == 200
    alice_sub_id = res.json()["id"]

    # Guest submission (Bob)
    client.cookies.clear()
    res = client.post(
        "/api/v1/contact/",
        json={
            "name": "Bob Guest",
            "email": "bob@example.com",
            "subject": "Interior Design",
            "message": "Looking for residential interior quote."
        }
    )
    assert res.status_code == 200
    bob_sub_id = res.json()["id"]

    # Verify user_id in DB
    alice_row = db.query(models.ContactMessage).filter(models.ContactMessage.id == alice_sub_id).first()
    bob_row = db.query(models.ContactMessage).filter(models.ContactMessage.id == bob_sub_id).first()
    assert alice_row.user_id is not None
    assert bob_row.user_id is None
    print("✓ Authenticated contact submission auto-attaches user_id; guest submission leaves user_id=None")

    print("--- 7. Testing Honeypot ---")
    client.cookies.clear()
    res = client.post(
        "/api/v1/contact/",
        json={
            "name": "Spam Bot",
            "email": "spam@example.com",
            "message": "Buy crypto now!",
            "website": "http://spamsite.com"
        }
    )
    assert res.status_code == 200
    spam_count = db.query(models.ContactMessage).filter(models.ContactMessage.name == "Spam Bot").count()
    assert spam_count == 0
    print("✓ Honeypot traps bot submission and discards it from database")

    print("--- 8. Testing Protected /me/submissions ---")
    # Unauthenticated
    client.cookies.clear()
    res = client.get("/api/v1/me/submissions")
    assert res.status_code == 401
    print("✓ Unauthenticated /me/submissions returns 401")

    # Authenticated as Alice
    res = client.get("/api/v1/me/submissions", cookies={"access_token": alice_cookie})
    assert res.status_code == 200
    submissions = res.json()
    assert len(submissions) == 1
    assert submissions[0]["id"] == alice_sub_id
    assert submissions[0]["project_type"] == "Structural Design"
    assert submissions[0]["status"] == "Received"
    print("✓ /me/submissions returns only Alice's submissions, not Bob's")

    print("--- 9. Testing Logout ---")
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    print("✓ Logout endpoint returns 200")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")
    db.close()

if __name__ == "__main__":
    run_tests()
