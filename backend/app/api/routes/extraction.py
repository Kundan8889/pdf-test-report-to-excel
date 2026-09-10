from fastapi import APIRouter, HTTPException, status
from app.models.schemas import APIResponse, ExtractRequest, ValidateRequest
from app.services.extraction_service import ExtractionService
from app.services.temperature_service import TemperatureService
from app.utils.file_utils import UPLOAD_DIR
from pathlib import Path

router = APIRouter(tags=["Extraction & Validation"])

@router.post("/extract", response_model=APIResponse)
async def extract_pdf_data(payload: ExtractRequest):
    """
    Extracts test metadata and interval matrix for a previously uploaded PDF.
    """
    target_path = UPLOAD_DIR / f"{payload.file_id}.pdf"
    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Uploaded file with ID '{payload.file_id}' not found."
        )

    try:
        data = ExtractionService.extract(target_path, payload.file_id, target_path.name)
        return APIResponse(
            success=True,
            message="Data successfully extracted from test report.",
            data=data.model_dump()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {str(e)}"
        )

@router.post("/validate", response_model=APIResponse)
async def validate_data(payload: ValidateRequest):
    """
    Recalculates ΔT (Actual - Ambient) for modified intervals on frontend.
    """
    try:
        updated_intervals, warnings = TemperatureService.calculate_and_validate(
            payload.metadata,
            payload.intervals
        )
        return APIResponse(
            success=True,
            message="Intervals recalculated successfully.",
            data={
                "metadata": payload.metadata.model_dump(),
                "intervals": [i.model_dump() for i in updated_intervals],
                "warnings": warnings
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )
