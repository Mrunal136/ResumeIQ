from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.auth.dependencies import get_current_user, require_recruiter, require_candidate
from app.jobs.schemas import (
    JobCreate, JobUpdate, JobResponse, JobListResponse, JobListItem,
    JobMatchResult, JobCandidatesResponse, JobApplicationRequest,
)
from app.jobs.service import (
    create_job, get_all_jobs, get_job_by_id, update_job, delete_job,
    preview_resume_match, apply_to_job, get_candidate_application, get_candidates_for_job,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job_listing(job_data: JobCreate, user: dict = Depends(require_recruiter)):
    result = await create_job(job_data.model_dump(), user["id"])
    return JobResponse(**result)


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    user: dict = Depends(get_current_user),
):
    result = await get_all_jobs(skip, limit, status_filter, skills, user)
    return JobListResponse(**result)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    job = await get_job_by_id(job_id, current_user=user)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**job)


@router.put("/{job_id}", response_model=JobResponse)
async def edit_job(job_id: str, updates: JobUpdate, user: dict = Depends(require_recruiter)):
    try:
        result = await update_job(job_id, updates.model_dump(), user["id"])
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**result)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_job(job_id: str, user: dict = Depends(require_recruiter)):
    deleted = await delete_job(job_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")


@router.post("/{job_id}/match", response_model=JobMatchResult)
async def match_my_resume(
    job_id: str,
    payload: JobApplicationRequest,
    user: dict = Depends(require_candidate),
):
    """Preview how the selected resume matches a job."""
    result = await preview_resume_match(job_id, user["id"], payload.resume_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return JobMatchResult(**result)


@router.get("/{job_id}/application", response_model=JobMatchResult)
async def get_my_application(job_id: str, user: dict = Depends(require_candidate)):
    application = await get_candidate_application(job_id, user["id"])
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return JobMatchResult(**application)


@router.post("/{job_id}/apply", response_model=JobMatchResult)
async def apply_for_job(
    job_id: str,
    payload: JobApplicationRequest,
    user: dict = Depends(require_candidate),
):
    result = await apply_to_job(job_id, user["id"], payload.resume_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return JobMatchResult(**result)


@router.get("/{job_id}/candidates", response_model=JobCandidatesResponse)
async def get_job_candidates(job_id: str, user: dict = Depends(require_recruiter)):
    """Get ranked candidates for a job (recruiter only)."""
    try:
        result = await get_candidates_for_job(job_id, user["id"])
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobCandidatesResponse(**result)
