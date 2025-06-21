import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/../'))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Dummy JWT for testing (should match your backend's secret for real tests)
DUMMY_JWT = "Bearer test.jwt.token"

def auth_headers():
    return {"Authorization": DUMMY_JWT}

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

# Example test for /api/v1/chat/message (unauthenticated, should fail)
def test_chat_message_unauthenticated():
    response = client.post("/api/v1/chat/message", json={"message": "Hello!"})
    assert response.status_code == 403  # Should require authentication
    assert "detail" in response.json()

def test_files_upload_unauthenticated():
    with open(__file__, "rb") as f:
        response = client.post("/api/v1/files/upload", files={"file": ("test.txt", f, "text/plain")})
    assert response.status_code == 403

def test_files_upload_wrong_type():
    with open(__file__, "rb") as f:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("test.txt", f, "text/plain")},
            headers=auth_headers()
        )
    assert response.status_code == 400
    assert "Invalid file type" in response.text

def test_files_upload_too_large(tmp_path):
    # Create a dummy large file (>5MB)
    big_file = tmp_path / "big.jpg"
    big_file.write_bytes(b"0" * (5 * 1024 * 1024 + 1))
    with open(big_file, "rb") as f:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("big.jpg", f, "image/jpeg")},
            headers=auth_headers()
        )
    assert response.status_code == 400
    assert "File too large" in response.text

def test_files_upload_valid(tmp_path):
    # Create a small valid JPEG file
    valid_file = tmp_path / "small.jpg"
    valid_file.write_bytes(b"\xff\xd8\xff\xe0" + b"0" * 100)  # JPEG header + dummy data
    with open(valid_file, "rb") as f:
        response = client.post(
            "/api/v1/files/upload",
            files={"file": ("small.jpg", f, "image/jpeg")},
            headers=auth_headers()
        )
    # Will fail unless DUMMY_JWT is valid and Supabase is configured, but should not be 400/403
    assert response.status_code in (200, 500)

def test_chat_image_unauthenticated(tmp_path):
    valid_file = tmp_path / "small.jpg"
    valid_file.write_bytes(b"\xff\xd8\xff\xe0" + b"0" * 100)
    with open(valid_file, "rb") as f:
        response = client.post(
            "/api/v1/chat/image",
            files={"image": ("small.jpg", f, "image/jpeg")},
            data={"message": "test"}
        )
    assert response.status_code == 403

def test_chat_image_wrong_type(tmp_path):
    invalid_file = tmp_path / "bad.txt"
    invalid_file.write_text("not an image")
    with open(invalid_file, "rb") as f:
        response = client.post(
            "/api/v1/chat/image",
            files={"image": ("bad.txt", f, "text/plain")},
            data={"message": "test"},
            headers=auth_headers()
        )
    assert response.status_code == 400
    assert "Invalid file type" in response.text

def test_chat_image_too_large(tmp_path):
    big_file = tmp_path / "big.jpg"
    big_file.write_bytes(b"0" * (5 * 1024 * 1024 + 1))
    with open(big_file, "rb") as f:
        response = client.post(
            "/api/v1/chat/image",
            files={"image": ("big.jpg", f, "image/jpeg")},
            data={"message": "test"},
            headers=auth_headers()
        )
    assert response.status_code == 400
    assert "File too large" in response.text

def test_chat_history_unauthenticated():
    response = client.get("/api/v1/chat/history")
    assert response.status_code == 403 