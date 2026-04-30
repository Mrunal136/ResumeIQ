import json
import logging
import re
from typing import Optional

from app.config import settings
from app.nlp.role_knowledge import suggest_training_paths

logger = logging.getLogger(__name__)

try:
    from google import genai
except Exception:
    genai = None

_client = None


def _get_client():
    global _client
    if not settings.GEMINI_API_KEY or genai is None:
        return None
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def generate_resume_summary(resume_text: str) -> str:
    """Generate a 3-line professional summary of a candidate's resume."""
    try:
        client = _get_client()
        if client is None:
            raise RuntimeError("AI client unavailable")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"""You are an expert recruiter. Write a concise 3-sentence professional summary 
of this candidate based on their resume. Focus on: their strongest skills, 
years/type of experience, and what makes them stand out.

RESUME:
{resume_text[:3000]}

Return ONLY the 3-sentence summary, no headers or extra formatting."""
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"AI summary failed: {e}")
        return _fallback_resume_summary(resume_text)


def generate_match_explanation(resume_text: str, job_title: str, job_desc: str,
                                matched_skills: list[str], missing_skills: list[str],
                                match_score: float) -> str:
    """Generate an explanation of why a resume matches (or doesn't match) a job."""
    try:
        client = _get_client()
        if client is None:
            raise RuntimeError("AI client unavailable")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"""You are a career advisor. Explain in 2-3 sentences WHY this candidate 
is a {match_score:.0f}% match for the job.

JOB: {job_title}
JOB DESCRIPTION: {job_desc[:1000]}
MATCHED SKILLS: {', '.join(matched_skills) or 'None'}
MISSING SKILLS: {', '.join(missing_skills) or 'None'}
RESUME SNIPPET: {resume_text[:1500]}

Be specific about strengths and gaps. Return ONLY the explanation, no headers."""
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"AI match explanation failed: {e}")
        return _fallback_match_explanation(job_title, matched_skills, missing_skills, match_score)


def generate_improvement_tips(resume_text: str, job_title: str, job_desc: str,
                                required_skills: list[str], missing_skills: list[str]) -> list[str]:
    """Generate actionable improvement tips for a candidate targeting a specific job."""
    role_tips = suggest_training_paths(
        job_title=job_title,
        job_description=job_desc,
        required_skills=required_skills,
        missing_skills=missing_skills,
        resume_skills=[],
        top_n=5,
    )
    try:
        client = _get_client()
        if client is None:
            raise RuntimeError("AI client unavailable")
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"""You are a career coach. Give exactly 5 specific, actionable tips 
to improve this resume for the given job. Focus on missing skills, 
experience gaps, and resume formatting.

JOB: {job_title}
REQUIRED SKILLS: {', '.join(required_skills)}
MISSING SKILLS: {', '.join(missing_skills) or 'None'}
RESUME: {resume_text[:2000]}

Return as a JSON array of 5 strings. Example: ["Tip 1", "Tip 2", ...]
Return ONLY the JSON array, nothing else."""
        )
        text = response.text.strip()
        # Clean potential markdown code fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        tips = json.loads(text)
        if not isinstance(tips, list):
            raise ValueError("AI tips response must be a list")
        merged: list[str] = []
        seen: set[str] = set()
        for tip in list(tips) + role_tips:
            cleaned = str(tip).strip()
            normalized = cleaned.lower()
            if cleaned and normalized not in seen:
                merged.append(cleaned)
                seen.add(normalized)
        return merged[:5]
    except Exception as e:
        logger.warning(f"AI improvement tips failed: {e}")
        tips = _fallback_improvement_tips(
            resume_text=resume_text,
            job_title=job_title,
            required_skills=required_skills,
            missing_skills=missing_skills,
        )
        merged: list[str] = []
        seen: set[str] = set()
        for tip in tips + role_tips:
            cleaned = str(tip).strip()
            normalized = cleaned.lower()
            if cleaned and normalized not in seen:
                merged.append(cleaned)
                seen.add(normalized)
        return merged[:5]


def generate_skill_gap_analysis(candidate_skills: list[str], required_skills: list[str],
                                 preferred_skills: list[str]) -> dict:
    """Generate a detailed skill gap analysis."""
    c_lower = {s.lower() for s in candidate_skills}
    r_lower = {s.lower() for s in required_skills}
    p_lower = {s.lower() for s in preferred_skills}

    matched_required = [s for s in required_skills if s.lower() in c_lower]
    missing_required = [s for s in required_skills if s.lower() not in c_lower]
    matched_preferred = [s for s in preferred_skills if s.lower() in c_lower]
    missing_preferred = [s for s in preferred_skills if s.lower() not in c_lower]
    extra_skills = [s for s in candidate_skills if s.lower() not in r_lower and s.lower() not in p_lower]

    total = len(required_skills) + len(preferred_skills)
    matched = len(matched_required) + len(matched_preferred)
    coverage = round(matched / total * 100, 1) if total > 0 else 0

    return {
        "overall_coverage": coverage,
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "extra_skills": extra_skills[:10],
    }


def _fallback_resume_summary(resume_text: str) -> str:
    words = resume_text.split()
    if not words:
        return "Upload a resume to generate a profile summary."

    sentences = re.split(r"(?<=[.!?])\s+", resume_text.strip())
    snippets = [sentence.strip() for sentence in sentences if sentence.strip()]
    if not snippets:
        return "Candidate profile summary is not available yet."

    summary = " ".join(snippets[:2])
    return summary[:280] + ("..." if len(summary) > 280 else "")


def _fallback_match_explanation(
    job_title: str,
    matched_skills: list[str],
    missing_skills: list[str],
    match_score: float,
) -> str:
    strengths = ", ".join(matched_skills[:4]) if matched_skills else "a few overlapping strengths"
    gaps = ", ".join(missing_skills[:3]) if missing_skills else "no major skill gaps"
    return (
        f"This profile is a {match_score:.0f}% fit for {job_title}. "
        f"The strongest alignment comes from {strengths}, while the main gap is {gaps}."
    )


def _fallback_improvement_tips(
    resume_text: str,
    job_title: str,
    required_skills: list[str],
    missing_skills: list[str],
) -> list[str]:
    tips: list[str] = []
    if missing_skills:
        tips.append(f"Add evidence for these missing skills: {', '.join(missing_skills[:4])}.")
    elif required_skills:
        tips.append(f"Tailor your summary so it mirrors the {job_title} role requirements.")
    if len(resume_text.split()) < 180:
        tips.append("Add more project detail so recruiters can see outcomes, ownership, and tools used.")
    tips.append("Turn experience bullets into measurable achievements with numbers or business impact.")
    tips.append("Move the most relevant projects and stack to the first half of the resume.")
    tips.append("Include links to portfolio, GitHub, or shipped work if they support this role.")
    tips.append("Keep section headings clean and consistent so ATS parsers can read the document easily.")
    return tips[:5]
