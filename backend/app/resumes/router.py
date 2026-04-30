from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Query
from typing import Optional
from app.auth.dependencies import require_candidate
from app.resumes.service import (
    process_and_store_resume,
    get_all_resumes,
    get_resume_by_id,
    delete_resume,
    set_default_resume,
)
from app.resumes.schemas import ResumeUploadResponse, ResumeDetail, ResumeListResponse

router = APIRouter(prefix="/resumes", tags=["Resumes"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc"}


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    user: dict = Depends(require_candidate),
):
    # Validate extension
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{ext} not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5 MB."
        )

    try:
        result = await process_and_store_resume(file_bytes, file.filename, user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )

    return ResumeUploadResponse(**result)


@router.get("/", response_model=ResumeListResponse)
async def list_resumes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    min_experience: Optional[int] = Query(None, ge=0),
    user: dict = Depends(require_candidate),
):
    result = await get_all_resumes(user["id"], skip, limit, skills, min_experience)
    return ResumeListResponse(**result)


@router.get("/{resume_id}", response_model=ResumeDetail)
async def get_resume(resume_id: str, user: dict = Depends(require_candidate)):
    resume = await get_resume_by_id(resume_id, user["id"])
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeDetail(**resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_resume(resume_id: str, user: dict = Depends(require_candidate)):
    deleted = await delete_resume(resume_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")


@router.post("/{resume_id}/default", response_model=ResumeDetail)
async def make_default_resume(resume_id: str, user: dict = Depends(require_candidate)):
    resume = await set_default_resume(resume_id, user["id"])
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    detail = await get_resume_by_id(resume_id, user["id"])
    return ResumeDetail(**detail)
