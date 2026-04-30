import logging
import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId

from app.database import get_db
from app.nlp.ai_service import (
    generate_improvement_tips,
    generate_match_explanation,
    generate_resume_summary,
)
from app.nlp.fit_model import score_fit
from app.nlp.embedder import get_embedding
from app.nlp.preprocessor import preprocess

logger = logging.getLogger(__name__)


def _safe_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None


def _normalize_skills(skills: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for skill in skills or []:
        clean = skill.strip().lower()
        if clean and clean not in seen:
            normalized.append(clean)
            seen.add(clean)
    return normalized


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _job_embedding_text(job_data: dict) -> str:
    return " ".join(
        [
            job_data.get("title", ""),
            job_data.get("company", ""),
            job_data.get("description", ""),
            " ".join(job_data.get("required_skills", [])),
            " ".join(job_data.get("preferred_skills", [])),
            job_data.get("location", ""),
            job_data.get("job_type", ""),
        ]
    ).strip()


def _application_projection(application: Optional[dict]) -> Optional[dict]:
    if not application:
        return None
    return {
        "job_id": application["job_id"],
        "job_title": application["job_title"],
        "company": application.get("company", ""),
        "resume_id": application["resume_id"],
        "resume_label": application.get("resume_label", "Resume"),
        "match_score": application.get("match_score", 0),
        "skill_match_percent": application.get("skill_match_percent", 0),
        "matched_skills": application.get("matched_skills", []),
        "missing_skills": application.get("missing_skills", []),
        "matched_required_skills": application.get("matched_required_skills", []),
        "missing_required_skills": application.get("missing_required_skills", []),
        "matched_preferred_skills": application.get("matched_preferred_skills", []),
        "missing_preferred_skills": application.get("missing_preferred_skills", []),
        "breakdown": application.get("breakdown", _default_breakdown()),
        "ai_explanation": application.get("ai_explanation", ""),
        "improvement_tips": application.get("improvement_tips", []),
        "status": application.get("status", "submitted"),
        "applied_at": application["applied_at"].isoformat() if application.get("applied_at") else None,
    }


def _default_breakdown() -> dict:
    return {
        "required_skill_score": 0.0,
        "preferred_skill_score": 0.0,
        "experience_score": 0.0,
        "semantic_score": 0.0,
    }


def _analyze_match(job: dict, resume: dict) -> dict:
    required_skills = _normalize_skills(job.get("required_skills", []))
    preferred_skills = _normalize_skills(job.get("preferred_skills", []))
    resume_skills = set(_normalize_skills(resume.get("skills", [])))

    matched_required = [skill for skill in required_skills if skill in resume_skills]
    missing_required = [skill for skill in required_skills if skill not in resume_skills]
    matched_preferred = [skill for skill in preferred_skills if skill in resume_skills]
    missing_preferred = [skill for skill in preferred_skills if skill not in resume_skills]

    required_score = (len(matched_required) / len(required_skills) * 100) if required_skills else 100.0
    preferred_score = (len(matched_preferred) / len(preferred_skills) * 100) if preferred_skills else 100.0

    min_experience = max(job.get("min_experience", 0), 0)
    resume_experience = max(resume.get("experience_years", 0), 0)
    experience_score = (
        min(resume_experience / min_experience * 100, 100) if min_experience > 0 else 100.0
    )

    trained_fit = score_fit(resume.get("resume_text", ""), _job_embedding_text(job))
    semantic_score = float(trained_fit["fit_score"])
    if (
        resume.get("embedding")
        and job.get("embedding")
        and resume.get("embedding_dim") == job.get("embedding_dim")
    ):
        semantic_score = max(
            semantic_score,
            round(_cosine_similarity(job["embedding"], resume["embedding"]) * 100, 1),
        )

    weights: list[tuple[float, float]] = []
    if required_skills:
        weights.append((required_score, 0.55))
    if preferred_skills:
        weights.append((preferred_score, 0.15))
    weights.append((experience_score, 0.15))
    weights.append((semantic_score, 0.15))

    total_weight = sum(weight for _, weight in weights) or 1
    heuristic_score = round(sum(score * weight for score, weight in weights) / total_weight, 1)
    match_score = round((semantic_score * 0.75) + (heuristic_score * 0.25), 1)

    return {
        "match_score": match_score,
        "skill_match_percent": round(required_score, 1),
        "matched_skills": matched_required + [skill for skill in matched_preferred if skill not in matched_required],
        "missing_skills": missing_required + [skill for skill in missing_preferred if skill not in missing_required],
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_preferred_skills": matched_preferred,
        "missing_preferred_skills": missing_preferred,
        "breakdown": {
            "required_skill_score": round(required_score, 1),
            "preferred_skill_score": round(preferred_score, 1),
            "experience_score": round(experience_score, 1),
            "semantic_score": round(semantic_score, 1),
        },
        "trained_label": trained_fit["predicted_label"],
    }


async def _get_candidate_resume(user_id: str, resume_id: Optional[str] = None) -> Optional[dict]:
    db = get_db()
    query = {"user_id": user_id}
    if resume_id:
        oid = _safe_object_id(resume_id)
        if oid is None:
            return None
        query["_id"] = oid
        return await db.resumes.find_one(query)

    resume = await db.resumes.find_one(
        {"user_id": user_id, "is_default": True},
        sort=[("created_at", -1)],
    )
    if resume:
        return resume
    return await db.resumes.find_one({"user_id": user_id}, sort=[("created_at", -1)])


async def _build_match_result(job: dict, resume: dict, *, status: str, applied_at: Optional[datetime]) -> dict:
    analysis = _analyze_match(job, resume)
    ai_explanation = generate_match_explanation(
        resume.get("resume_text", ""),
        job["title"],
        job["description"],
        analysis["matched_skills"],
        analysis["missing_skills"],
        analysis["match_score"],
    )
    improvement_tips = generate_improvement_tips(
        resume.get("resume_text", ""),
        job["title"],
        job["description"],
        job.get("required_skills", []),
        analysis["missing_required_skills"],
    )
    return {
        "job_id": str(job["_id"]),
        "job_title": job["title"],
        "company": job.get("company", ""),
        "resume_id": str(resume["_id"]),
        "resume_label": resume.get("label") or resume.get("filename", "Resume"),
        "match_score": analysis["match_score"],
        "skill_match_percent": analysis["skill_match_percent"],
        "matched_skills": analysis["matched_skills"],
        "missing_skills": analysis["missing_skills"],
        "matched_required_skills": analysis["matched_required_skills"],
        "missing_required_skills": analysis["missing_required_skills"],
        "matched_preferred_skills": analysis["matched_preferred_skills"],
        "missing_preferred_skills": analysis["missing_preferred_skills"],
        "breakdown": analysis["breakdown"],
        "ai_explanation": ai_explanation,
        "improvement_tips": improvement_tips,
        "status": status,
        "applied_at": applied_at.isoformat() if applied_at else None,
    }


async def _count_applications(job_id: str) -> int:
    db = get_db()
    return await db.applications.count_documents({"job_id": job_id})


async def _get_existing_application(job_id: str, user_id: str) -> Optional[dict]:
    db = get_db()
    return await db.applications.find_one({"job_id": job_id, "user_id": user_id})


async def _format_job(doc: dict, *, current_user: Optional[dict] = None) -> dict:
    job_id = str(doc["_id"])
    payload = {
        "id": job_id,
        "title": doc["title"],
        "company": doc.get("company", ""),
        "description": doc["description"],
        "required_skills": doc.get("required_skills", []),
        "preferred_skills": doc.get("preferred_skills", []),
        "min_experience": doc.get("min_experience", 0),
        "location": doc.get("location", "Remote"),
        "salary_range": doc.get("salary_range", ""),
        "job_type": doc.get("job_type", "full-time"),
        "status": doc.get("status", "open"),
        "created_by": doc.get("created_by", ""),
        "application_count": await _count_applications(job_id),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
    }
    if current_user and current_user.get("role") == "candidate":
        application = await _get_existing_application(job_id, current_user["id"])
        payload["my_application"] = _application_projection(application)
    return payload


async def _format_job_list(doc: dict, *, current_user: Optional[dict] = None) -> dict:
    payload = {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "company": doc.get("company", ""),
        "required_skills": doc.get("required_skills", []),
        "min_experience": doc.get("min_experience", 0),
        "location": doc.get("location", "Remote"),
        "salary_range": doc.get("salary_range", ""),
        "job_type": doc.get("job_type", "full-time"),
        "status": doc.get("status", "open"),
        "created_by": doc.get("created_by", ""),
        "application_count": await _count_applications(str(doc["_id"])),
        "my_match_score": None,
        "has_applied": False,
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
    }
    if current_user and current_user.get("role") == "candidate":
        application = await _get_existing_application(str(doc["_id"]), current_user["id"])
        if application:
            payload["my_match_score"] = application.get("match_score")
            payload["has_applied"] = True
    return payload

async def create_job(job_data: dict, user_id: str) -> dict:
    """Create a new job listing with embedding."""
    db = get_db()

    job_data["required_skills"] = _normalize_skills(job_data.get("required_skills", []))
    job_data["preferred_skills"] = _normalize_skills(job_data.get("preferred_skills", []))

    processed = preprocess(_job_embedding_text(job_data))
    embedding, dim = get_embedding(processed)

    doc = {
        **job_data,
        "status": "open",
        "embedding": embedding,
        "embedding_dim": dim,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.jobs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await _format_job(doc)


async def get_all_jobs(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    skills: str = None,
    current_user: Optional[dict] = None,
) -> dict:
    """Get paginated list of jobs with optional filters."""
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(",")]
        query["required_skills"] = {"$in": skill_list}

    total = await db.jobs.count_documents(query)
    cursor = db.jobs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    jobs = []
    async for doc in cursor:
        jobs.append(await _format_job_list(doc, current_user=current_user))
    return {"total": total, "jobs": jobs}


async def get_job_by_id(job_id: str, current_user: Optional[dict] = None) -> Optional[dict]:
    """Get a single job by ID."""
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return None
    doc = await db.jobs.find_one({"_id": oid})
    if not doc:
        return None
    return await _format_job(doc, current_user=current_user)


async def update_job(job_id: str, updates: dict, user_id: str) -> dict:
    """Update a job listing (only by creator)."""
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return None
    job = await db.jobs.find_one({"_id": oid})
    if not job:
        return None
    if job["created_by"] != user_id:
        raise PermissionError("Not authorized to edit this job")

    # Filter out None values
    clean_updates = {k: v for k, v in updates.items() if v is not None}
    if "required_skills" in clean_updates:
        clean_updates["required_skills"] = _normalize_skills(clean_updates["required_skills"])
    if "preferred_skills" in clean_updates:
        clean_updates["preferred_skills"] = _normalize_skills(clean_updates["preferred_skills"])

    # Re-embed if description or skills changed
    if {"title", "description", "required_skills", "preferred_skills", "location", "job_type"} & clean_updates.keys():
        merged = {**job, **clean_updates}
        embedding, dim = get_embedding(preprocess(_job_embedding_text(merged)))
        clean_updates["embedding"] = embedding
        clean_updates["embedding_dim"] = dim

    if clean_updates:
        await db.jobs.update_one({"_id": oid}, {"$set": clean_updates})
    return await get_job_by_id(job_id)


async def delete_job(job_id: str, user_id: str) -> bool:
    """Delete a job listing (only by creator)."""
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return False
    result = await db.jobs.delete_one({"_id": oid, "created_by": user_id})
    return result.deleted_count > 0


# ── Candidate Matching + Applications ────────────────────────────

async def preview_resume_match(job_id: str, user_id: str, resume_id: Optional[str] = None) -> Optional[dict]:
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return None
    job = await db.jobs.find_one({"_id": oid})
    if not job:
        return None

    resume = await _get_candidate_resume(user_id, resume_id)
    if not resume:
        return {"error": "No resume found. Please upload your resume first."}

    return await _build_match_result(job, resume, status="draft", applied_at=None)


async def apply_to_job(job_id: str, user_id: str, resume_id: Optional[str] = None) -> Optional[dict]:
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return None

    job = await db.jobs.find_one({"_id": oid})
    if not job:
        return None

    resume = await _get_candidate_resume(user_id, resume_id)
    if not resume:
        return {"error": "No resume found. Please upload your resume first."}

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found."}

    existing = await _get_existing_application(str(job["_id"]), user_id)
    applied_at = existing.get("applied_at") if existing else datetime.now(timezone.utc)
    result = await _build_match_result(job, resume, status="submitted", applied_at=applied_at)
    resume_summary = generate_resume_summary(resume.get("resume_text", ""))
    now = datetime.now(timezone.utc)

    application_doc = {
        "user_id": user_id,
        "job_id": str(job["_id"]),
        "recruiter_id": job["created_by"],
        "job_title": job["title"],
        "company": job.get("company", ""),
        "resume_id": str(resume["_id"]),
        "resume_label": resume.get("label") or resume.get("filename", "Resume"),
        "candidate_name": resume.get("name") or user.get("name", "Unknown"),
        "candidate_email": resume.get("email") or user.get("email", ""),
        "skills": resume.get("skills", []),
        "experience_years": resume.get("experience_years", 0),
        "education": resume.get("education", "Not specified"),
        "match_score": result["match_score"],
        "skill_match_percent": result["skill_match_percent"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "matched_required_skills": result["matched_required_skills"],
        "missing_required_skills": result["missing_required_skills"],
        "matched_preferred_skills": result["matched_preferred_skills"],
        "missing_preferred_skills": result["missing_preferred_skills"],
        "breakdown": result["breakdown"],
        "ai_explanation": result["ai_explanation"],
        "ai_summary": resume_summary,
        "improvement_tips": result["improvement_tips"],
        "status": "submitted",
        "updated_at": now,
    }

    await db.applications.update_one(
        {"user_id": user_id, "job_id": str(job["_id"])},
        {
            "$set": application_doc,
            "$setOnInsert": {"applied_at": applied_at},
        },
        upsert=True,
    )

    result["status"] = "submitted"
    result["applied_at"] = applied_at.isoformat()
    return result


async def get_candidate_application(job_id: str, user_id: str) -> Optional[dict]:
    application = await _get_existing_application(job_id, user_id)
    if not application:
        return None
    return _application_projection(application)


# ── Recruiter Review ──────────────────────────────────────────────

async def get_candidates_for_job(job_id: str, recruiter_id: str) -> Optional[dict]:
    """Get submitted candidates for a specific recruiter-owned job."""
    db = get_db()
    oid = _safe_object_id(job_id)
    if oid is None:
        return None
    job = await db.jobs.find_one({"_id": oid})
    if not job:
        return None
    if job["created_by"] != recruiter_id:
        raise PermissionError("Not authorized to view candidates for this job")

    candidates = []
    async for application in db.applications.find({"job_id": str(job["_id"])}).sort("match_score", -1):
        candidates.append({
            "id": str(application["_id"]),
            "user_id": application["user_id"],
            "resume_id": application["resume_id"],
            "resume_label": application.get("resume_label", "Resume"),
            "name": application.get("candidate_name", "Unknown"),
            "email": application.get("candidate_email", ""),
            "skills": application.get("skills", []),
            "experience_years": application.get("experience_years", 0),
            "education": application.get("education", "Not specified"),
            "match_score": application.get("match_score", 0),
            "skill_match_percent": application.get("skill_match_percent", 0),
            "matched_skills": application.get("matched_skills", []),
            "missing_skills": application.get("missing_skills", []),
            "matched_required_skills": application.get("matched_required_skills", []),
            "missing_required_skills": application.get("missing_required_skills", []),
            "matched_preferred_skills": application.get("matched_preferred_skills", []),
            "missing_preferred_skills": application.get("missing_preferred_skills", []),
            "breakdown": application.get("breakdown", _default_breakdown()),
            "ai_summary": application.get("ai_summary", ""),
            "ai_explanation": application.get("ai_explanation", ""),
            "status": application.get("status", "submitted"),
            "applied_at": application["applied_at"].isoformat() if application.get("applied_at") else None,
        })

    return {
        "job_id": str(job["_id"]),
        "job_title": job["title"],
        "total_candidates": len(candidates),
        "candidates": candidates,
    }
