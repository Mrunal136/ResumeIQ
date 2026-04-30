from pydantic import BaseModel
from typing import Optional


class JobDescriptionInput(BaseModel):
    title: str
    description: str
    required_skills: list[str] = []
    min_experience: int = 0
    top_n: int = 10


class RankedCandidate(BaseModel):
    id: str
    candidate_id: str
    name: str
    email: str
    skills: list[str]
    experience_years: int
    education: str
    match_score: float
    skill_match_percent: float
    matched_skills: list[str]
    missing_skills: list[str]


class RankingResponse(BaseModel):
    job_title: str
    total_candidates: int
    candidates: list[RankedCandidate]


class ResumeScore(BaseModel):
    resume_id: str
    name: str
    resume_score: float
    skill_match: float
    experience_relevance: float
    resume_quality: float
    improvement_suggestions: list[str]
