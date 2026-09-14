from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.models.schemas import APIResponse
from app.utils.file_utils import generate_file_id, validate_pdf_file, save_uploaded_pdf
from app.services.extraction_service import ExtractionService

from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("", response_model=APIResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Receives PDF, validates format/signature, saves file,
    and runs intelligent extraction pipeline.
    """
    filename = file.filename or "unknown.pdf"
    content_type = file.content_type or ""

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}"
        )

    is_valid, err_msg = validate_pdf_file(filename, content_type, file_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    file_id = generate_file_id()
    saved_path, stored_filename = save_uploaded_pdf(file_id, file_bytes)

    try:
        extracted = await run_in_threadpool(ExtractionService.extract, saved_path, file_id, filename)
        return APIResponse(
            success=True,
            message="PDF report uploaded and processed successfully.",
            data=extracted.model_dump()
        )
    except Exception as e:
        return APIResponse(
            success=True,
            message=f"PDF uploaded, but extraction had notice: {str(e)}",
            data={
                "file_id": file_id,
                "original_filename": filename,
                "stored_filename": stored_filename,
                "file_size_bytes": len(file_bytes)
            }
        )
