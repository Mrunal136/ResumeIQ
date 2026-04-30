from fastapi import APIRouter, HTTPException, Depends
from app.auth.dependencies import require_candidate
from app.candidates.schemas import CandidateProfile, CandidateMatchesResponse, CandidateInsights
from app.candidates.service import get_candidate_profile, get_candidate_matches, get_candidate_insights

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("/profile", response_model=CandidateProfile)
async def my_profile(user: dict = Depends(require_candidate)):
    """Get the current user's candidate profile with AI summary."""
    profile = await get_candidate_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return CandidateProfile(**profile)


@router.get("/matches", response_model=CandidateMatchesResponse)
async def my_matches(user: dict = Depends(require_candidate)):
    """Get all jobs the candidate has matched against."""
    result = await get_candidate_matches(user["id"])
    return CandidateMatchesResponse(**result)


@router.get("/insights", response_model=CandidateInsights)
async def my_insights(user: dict = Depends(require_candidate)):
    """Get AI-powered career insights based on resume vs market demand."""
    result = await get_candidate_insights(user["id"])
    return CandidateInsights(**result)
