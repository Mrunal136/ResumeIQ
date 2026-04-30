import logging
from bson import ObjectId
from app.database import get_db
from app.nlp.ai_service import generate_resume_summary, generate_skill_gap_analysis

logger = logging.getLogger(__name__)


async def get_candidate_profile(user_id: str) -> dict:
    """Get a candidate's profile along with resume info and AI summary."""
    db = get_db()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    resume = await db.resumes.find_one(
        {"user_id": user_id, "is_default": True},
        sort=[("created_at", -1)],
    )
    if not resume:
        resume = await db.resumes.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    resume_count = await db.resumes.count_documents({"user_id": user_id})

    # Count applications
    app_count = await db.applications.count_documents({"user_id": user_id})

    profile = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "default_resume_id": str(resume["_id"]) if resume else None,
        "default_resume_label": resume.get("label", "") if resume else None,
        "resume_count": resume_count,
        "skills": resume.get("skills", []) if resume else [],
        "experience_years": resume.get("experience_years", 0) if resume else 0,
        "education": resume.get("education", "") if resume else "",
        "ai_summary": "",
        "total_applications": app_count,
    }

    # Generate AI summary if resume exists
    if resume and resume.get("resume_text"):
        profile["ai_summary"] = generate_resume_summary(resume["resume_text"])

    return profile


async def get_candidate_matches(user_id: str) -> dict:
    """Get all jobs the candidate has matched against."""
    db = get_db()

    matches = []
    async for app in db.applications.find({"user_id": user_id}).sort("applied_at", -1):
        job = await db.jobs.find_one({"_id": ObjectId(app["job_id"])})
        if not job:
            continue
        matches.append({
            "job_id": app["job_id"],
            "job_title": job["title"],
            "company": job.get("company", ""),
            "resume_id": app.get("resume_id", ""),
            "resume_label": app.get("resume_label", "Resume"),
            "match_score": app["match_score"],
            "skill_match_percent": app.get("skill_match_percent", 0),
            "matched_skills": app.get("matched_skills", []),
            "missing_skills": app.get("missing_skills", []),
            "matched_required_skills": app.get("matched_required_skills", []),
            "missing_required_skills": app.get("missing_required_skills", []),
            "matched_preferred_skills": app.get("matched_preferred_skills", []),
            "missing_preferred_skills": app.get("missing_preferred_skills", []),
            "breakdown": app.get("breakdown", {}),
            "ai_explanation": app.get("ai_explanation", ""),
            "improvement_tips": app.get("improvement_tips", []),
            "status": app.get("status", "submitted"),
            "applied_at": app["applied_at"].isoformat() if app.get("applied_at") else None,
        })

    return {"total": len(matches), "matches": matches}


async def get_candidate_insights(user_id: str) -> dict:
    """Generate AI-powered career insights for a candidate."""
    db = get_db()

    # Get resume
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    resume = await db.resumes.find_one(
        {"user_id": user_id, "is_default": True},
        sort=[("created_at", -1)],
    )
    if not resume:
        resume = await db.resumes.find_one({"user_id": user_id}, sort=[("created_at", -1)])

    if not resume:
        return {
            "top_skills": [],
            "skill_gaps": [],
            "avg_match_score": 0,
            "best_match_job": None,
            "career_tips": ["Upload your resume to get personalized career insights."],
            "skill_gap_analysis": {},
        }

    candidate_skills = resume.get("skills", [])

    # Analyze across all open jobs
    all_required = []
    all_preferred = []
    async for job in db.jobs.find({"status": "open"}):
        all_required.extend(job.get("required_skills", []))
        all_preferred.extend(job.get("preferred_skills", []))

    # Find most demanded skills the candidate is missing
    from collections import Counter
    req_counts = Counter([s.lower() for s in all_required])
    candidate_lower = {s.lower() for s in candidate_skills}
    gaps = [(skill, count) for skill, count in req_counts.most_common(20) if skill not in candidate_lower]
    gap_skills = [s for s, _ in gaps[:8]]

    # Get match scores from applications
    match_scores = []
    best_job = None
    best_score = 0
    async for app in db.applications.find({"user_id": user_id}):
        match_scores.append(app["match_score"])
        if app["match_score"] > best_score:
            best_score = app["match_score"]
            job = await db.jobs.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                best_job = job["title"]

    avg_score = round(sum(match_scores) / len(match_scores), 1) if match_scores else 0

    # Skill gap analysis against most common requirements
    skill_gap = generate_skill_gap_analysis(
        candidate_skills, list(set(all_required))[:15], list(set(all_preferred))[:10]
    )

    # Career tips based on gaps
    tips = []
    if gap_skills:
        tips.append(f"Most in-demand skills you're missing: {', '.join(gap_skills[:4])}")
    if avg_score > 0 and avg_score < 60:
        tips.append("Your average match score is below 60% — consider upskilling in the gaps above")
    elif avg_score >= 75:
        tips.append("Your profile is strong! Focus on showcasing projects to stand out")
    if resume.get("experience_years", 0) == 0:
        tips.append("Add internships or freelance work to boost your experience section")
    tips.append("Keep your resume under 2 pages and use action verbs for each bullet point")

    return {
        "top_skills": candidate_skills[:10],
        "skill_gaps": gap_skills,
        "avg_match_score": avg_score,
        "best_match_job": best_job,
        "career_tips": tips,
        "skill_gap_analysis": skill_gap,
    }
