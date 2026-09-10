import io
import sys
from fastapi.testclient import TestClient
from app.main import app

def run_foundation_tests():
    client = TestClient(app)
    print("--- 1. Testing GET /api/health ---")
    res = client.get("/api/health")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    print("PASSED: Health endpoint OK\n")

    print("--- 2. Testing POST /api/upload with valid PDF ---")
    # Valid minimal PDF header & content
    pdf_content = b"%PDF-1.4\n% minimal test pdf content for validation\n%%EOF\n"
    pdf_file = io.BytesIO(pdf_content)
    res = client.post(
        "/api/upload",
        files={"file": ("sample_report.pdf", pdf_file, "application/pdf")}
    )
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "file_id" in data["data"]
    assert data["data"]["stored_filename"].endswith(".pdf")
    print("PASSED: Valid PDF upload and safe storage OK\n")

    print("--- 3. Testing POST /api/upload with non-PDF extension ---")
    txt_file = io.BytesIO(b"Hello world test")
    res = client.post(
        "/api/upload",
        files={"file": ("malicious.txt", txt_file, "text/plain")}
    )
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 400
    assert res.json()["success"] is False
    print("PASSED: Rejected non-PDF extension\n")

    print("--- 4. Testing POST /api/upload with fake PDF (invalid magic header) ---")
    fake_pdf = io.BytesIO(b"Not a real PDF structure")
    res = client.post(
        "/api/upload",
        files={"file": ("fake.pdf", fake_pdf, "application/pdf")}
    )
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 400
    assert res.json()["success"] is False
    print("PASSED: Rejected invalid PDF signature\n")

    print("--- 5. Testing POST /api/extract placeholder ---")
    res = client.post("/api/extract")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert "not implemented" in res.json()["message"].lower()
    print("PASSED: Extraction placeholder verified\n")

    print("--- 6. Testing POST /api/validate placeholder ---")
    res = client.post("/api/validate")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert "not implemented" in res.json()["message"].lower()
    print("PASSED: Validate placeholder verified\n")

    print("--- 7. Testing POST /api/generate-excel placeholder ---")
    res = client.post("/api/generate-excel")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert "not implemented" in res.json()["message"].lower()
    print("PASSED: Generate-excel placeholder verified\n")

    print("--- 8. Testing GET /api/download/{file_id} placeholder ---")
    res = client.get("/api/download/test-id-123")
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert "not implemented" in res.json()["message"].lower()
    print("PASSED: Download placeholder verified\n")

    print("========================================")
    print("ALL BACKEND FOUNDATION TESTS PASSED 100%")
    print("========================================")

if __name__ == "__main__":
    run_foundation_tests()
