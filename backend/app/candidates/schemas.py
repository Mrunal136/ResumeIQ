from typing import Optional

from pydantic import BaseModel, Field


class CandidateProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    default_resume_id: Optional[str] = None
    default_resume_label: Optional[str] = None
    resume_count: int = 0
    skills: list[str] = Field(default_factory=list)
    experience_years: int = 0
    education: str = ""
    ai_summary: str = ""
    total_applications: int = 0


class JobMatchItem(BaseModel):
    job_id: str
    job_title: str
    company: str
    resume_id: str
    resume_label: str
    match_score: float
    skill_match_percent: float
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    matched_required_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    matched_preferred_skills: list[str] = Field(default_factory=list)
    missing_preferred_skills: list[str] = Field(default_factory=list)
    breakdown: dict = Field(default_factory=dict)
    ai_explanation: str
    improvement_tips: list[str] = Field(default_factory=list)
    status: str = "submitted"
    applied_at: Optional[str] = None


class CandidateMatchesResponse(BaseModel):
    total: int
    matches: list[JobMatchItem] = Field(default_factory=list)


class CandidateInsights(BaseModel):
    top_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    avg_match_score: float
    best_match_job: Optional[str] = None
    career_tips: list[str] = Field(default_factory=list)
    skill_gap_analysis: dict = Field(default_factory=dict)
