from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.dependencies import get_current_user
from app.ranking.schemas import JobDescriptionInput, RankingResponse, ResumeScore
from app.ranking.service import rank_candidates, score_single_resume

router = APIRouter(prefix="/ranking", tags=["Ranking"])


@router.post("/rank", response_model=RankingResponse)
async def rank(job: JobDescriptionInput, user: dict = Depends(get_current_user)):
    result = await rank_candidates(
        title=job.title,
        description=job.description,
        required_skills=job.required_skills,
        min_experience=job.min_experience,
        top_n=job.top_n,
    )
    return RankingResponse(**result)


@router.post("/score/{resume_id}", response_model=ResumeScore)
async def score(
    resume_id: str,
    job: JobDescriptionInput,
    user: dict = Depends(get_current_user),
):
    result = await score_single_resume(
        resume_id=resume_id,
        description=job.description,
        required_skills=job.required_skills,
        min_experience=job.min_experience,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeScore(**result)
