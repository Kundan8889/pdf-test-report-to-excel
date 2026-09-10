import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

from app.utils.file_utils import init_directories
from app.api.routes import upload, extraction, excel

# Ensure storage directories exist
init_directories()

app = FastAPI(
    title="PDF Test Report to Excel API",
    description="Development foundation for PDF test report processing and Excel generation",
    version="1.0.0"
)

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Exception Handlers for consistent API responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}"
        }
    )

# Health endpoint (as requested: GET /api/health -> {"status": "ok"})
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Register route modules under /api prefix
app.include_router(upload.router, prefix="/api")
app.include_router(extraction.router, prefix="/api")
app.include_router(excel.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
