from typing import Optional

from pydantic import BaseModel, Field


class ResumeUploadResponse(BaseModel):
    id: str
    label: str
    filename: str
    name: str
    email: str
    skills: list[str] = Field(default_factory=list)
    experience_years: int
    education: str
    is_default: bool = False
    created_at: Optional[str] = None
    message: str = "Resume uploaded and processed successfully"


class ResumeDetail(BaseModel):
    id: str
    label: str
    filename: str
    name: str
    email: str
    skills: list[str] = Field(default_factory=list)
    experience_years: int
    education: str
    resume_text: str
    is_default: bool = False
    embedding_dim: Optional[int] = None
    created_at: Optional[str] = None


class ResumeListItem(BaseModel):
    id: str
    label: str
    filename: str
    name: str
    email: str
    skills: list[str] = Field(default_factory=list)
    experience_years: int
    education: str
    is_default: bool = False
    created_at: Optional[str] = None


class ResumeListResponse(BaseModel):
    total: int
    resumes: list[ResumeListItem] = Field(default_factory=list)
