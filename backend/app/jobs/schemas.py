from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    PAUSED = "paused"


class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    min_experience: int = 0
    location: str = "Remote"
    salary_range: str = ""
    job_type: JobType = JobType.FULL_TIME


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    min_experience: Optional[int] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    description: str
    required_skills: list[str]
    preferred_skills: list[str]
    min_experience: int
    location: str
    salary_range: str
    job_type: str
    status: str
    created_by: str
    application_count: int = 0
    my_application: Optional["JobMatchResult"] = None
    created_at: Optional[str] = None


class JobListItem(BaseModel):
    id: str
    title: str
    company: str
    required_skills: list[str]
    min_experience: int
    location: str
    salary_range: str
    job_type: str
    status: str
    created_by: str
    application_count: int = 0
    my_match_score: Optional[float] = None
    has_applied: bool = False
    created_at: Optional[str] = None


class JobListResponse(BaseModel):
    total: int
    jobs: list[JobListItem] = Field(default_factory=list)


class JobApplicationRequest(BaseModel):
    resume_id: Optional[str] = None


class MatchBreakdown(BaseModel):
    required_skill_score: float
    preferred_skill_score: float
    experience_score: float
    semantic_score: float


class JobMatchResult(BaseModel):
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
    breakdown: MatchBreakdown
    ai_explanation: str
    improvement_tips: list[str] = Field(default_factory=list)
    status: str = "draft"
    applied_at: Optional[str] = None


class CandidateForJob(BaseModel):
    id: str
    user_id: str
    resume_id: str
    resume_label: str
    name: str
    email: str
    skills: list[str] = Field(default_factory=list)
    experience_years: int
    education: str
    match_score: float
    skill_match_percent: float
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    matched_required_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    matched_preferred_skills: list[str] = Field(default_factory=list)
    missing_preferred_skills: list[str] = Field(default_factory=list)
    breakdown: MatchBreakdown
    ai_summary: str
    ai_explanation: str
    status: str
    applied_at: Optional[str] = None


class JobCandidatesResponse(BaseModel):
    job_id: str
    job_title: str
    total_candidates: int
    candidates: list[CandidateForJob] = Field(default_factory=list)


JobResponse.model_rebuild()
