import os
import uuid
from pathlib import Path
from typing import Tuple

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024

def init_directories():
    """Ensures uploads and outputs directories exist."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def generate_file_id() -> str:
    """Generates a secure random file identifier."""
    return str(uuid.uuid4())

def get_upload_path(filename: str, file_id: str) -> Path:
    ext = Path(filename).suffix
    safe_name = f"{file_id}{ext}"
    return UPLOAD_DIR / safe_name

def get_output_path(filename: str) -> Path:
    return OUTPUT_DIR / filename

def validate_pdf_file(filename: str, content_type: str, file_bytes: bytes) -> Tuple[bool, str]:
    """
    Validates if the uploaded file is a valid PDF:
    - Checks file extension (.pdf)
    - Checks MIME type
    - Checks PDF magic header (%PDF-)
    - Checks file size against configured limit
    """
    if not filename or not filename.lower().endswith(".pdf"):
        return False, "Invalid file format. Only PDF files (.pdf) are permitted."

    if content_type and content_type.lower() not in ["application/pdf", "application/x-pdf", "application/octet-stream"]:
        return False, f"Invalid MIME content-type '{content_type}'. Must be application/pdf."

    if len(file_bytes) == 0:
        return False, "The uploaded PDF file is empty (0 bytes)."

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
        return False, f"File size exceeds maximum allowed limit of {max_mb:.0f} MB."

    # Validate PDF signature magic bytes (%PDF-)
    if not file_bytes.startswith(b"%PDF-"):
        return False, "Invalid PDF header signature. File is not a valid PDF document."

    return True, ""

def save_uploaded_pdf(file_id: str, file_bytes: bytes) -> Tuple[Path, str]:
    """
    Saves PDF file using safe unique filename in uploads directory.
    Returns (Path, stored_filename).
    """
    stored_filename = f"{file_id}.pdf"
    target_path = UPLOAD_DIR / stored_filename
    with open(target_path, "wb") as f:
        f.write(file_bytes)
    return target_path, stored_filename
