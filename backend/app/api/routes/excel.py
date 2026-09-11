import re
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from app.models.schemas import APIResponse, GenerateExcelRequest
from app.services.excel_service import ExcelService
from app.utils.file_utils import OUTPUT_DIR, generate_file_id
from pathlib import Path

router = APIRouter(tags=["Excel Generation & Download"])

@router.post("/generate-excel", response_model=APIResponse)
async def generate_excel(payload: GenerateExcelRequest):
    """
    Builds the structured .xlsx file from metadata and intervals.
    """
    try:
        file_id = generate_file_id()
        base_name = payload.file_name or "Temperature_Rise_Test_Report.xlsx"
        # Sanitize unsafe characters while keeping spaces, hyphens, and dots
        clean_name = re.sub(r'[\\/*?:"<>|]', '_', base_name).strip()
        if not clean_name.lower().endswith(".xlsx"):
            clean_name += ".xlsx"

        # Use triple-underscore separator to cleanly isolate UUID from dynamic filename
        output_filename = f"{file_id}___{clean_name}"
        ExcelService.generate_excel(
            metadata=payload.metadata,
            intervals=payload.intervals,
            output_filename=output_filename
        )

        return APIResponse(
            success=True,
            message="Excel report generated successfully.",
            data={
                "download_id": output_filename,
                "file_name": clean_name,
                "download_url": f"/api/download/{output_filename}"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Excel file: {str(e)}"
        )

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """
    Streams the generated .xlsx workbook directly with its clean dynamic filename.
    """
    safe_name = Path(file_id).name
    file_path = OUTPUT_DIR / safe_name

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested Excel file was not found or has expired."
        )

    if "___" in safe_name:
        display_name = safe_name.split("___", 1)[1]
    elif "_" in safe_name:
        display_name = safe_name.split("_", 1)[1]
    else:
        display_name = safe_name

    return FileResponse(
        path=file_path,
        filename=display_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
