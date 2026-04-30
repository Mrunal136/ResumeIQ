import numpy as np
from app.database import get_db
from app.nlp.preprocessor import preprocess, extract_skills_from_text
from app.nlp.embedder import get_embedding
from app.nlp.fit_model import score_fit


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a, b = np.array(a), np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


async def rank_candidates(
    title: str,
    description: str,
    required_skills: list[str],
    min_experience: int = 0,
    top_n: int = 10,
) -> dict:
    """Rank candidates against a job description using vector search + skill matching."""
    db = get_db()

    # Generate JD embedding
    jd_text = f"{title} {description} {' '.join(required_skills)}"
    processed_jd = preprocess(jd_text)
    jd_embedding, jd_dim = get_embedding(processed_jd)
    jd_skills = extract_skills_from_text(description) + required_skills
    jd_skills = list(set([s.lower() for s in jd_skills]))

    # Try MongoDB Atlas Vector Search first
    candidates = []
    vector_search_failed = False
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "resume_vector_index",
                    "path": "embedding",
                    "queryVector": jd_embedding,
                    "numCandidates": top_n * 5,
                    "limit": top_n * 3,
                    "filter": {"embedding_dim": jd_dim}
                }
            },
            {
                "$project": {
                    "candidate_id": 1,
                    "name": 1,
                    "email": 1,
                    "skills": 1,
                    "experience_years": 1,
                    "education": 1,
                    "embedding": 1,
                    "embedding_dim": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            }
        ]
        async for doc in db.resumes.aggregate(pipeline):
            candidates.append(doc)
    except Exception:
        vector_search_failed = True

    # Fallback: manual cosine similarity if Atlas search failed or returned 0 results
    # (Atlas may silently return 0 results if the vector index is not defined)
    if vector_search_failed or not candidates:
        candidates = []  # reset just in case
        query = {"embedding_dim": jd_dim}
        if min_experience > 0:
            query["experience_years"] = {"$gte": min_experience}
        async for doc in db.resumes.find(query):
            doc["score"] = cosine_similarity(jd_embedding, doc.get("embedding", []))
            candidates.append(doc)

    # Score each candidate
    ranked = []
    for c in candidates:
        c_skills = [s.lower() for s in c.get("skills", [])]
        matched = [s for s in jd_skills if s in c_skills]
        missing = [s for s in jd_skills if s not in c_skills]
        skill_match = (len(matched) / len(jd_skills) * 100) if jd_skills else 0

        exp_relevance = min(c.get("experience_years", 0) / max(min_experience, 1) * 100, 100) if min_experience > 0 else 50

        vector_score = c.get("score", 0) * 100
        trained_fit = score_fit(c.get("resume_text", ""), jd_text)
        fit_score = float(trained_fit["fit_score"])

        # Final score = trained fit score + smaller heuristics for tie-breaking
        final_score = round(
            0.7 * fit_score + 0.2 * skill_match + 0.1 * max(exp_relevance, vector_score),
            1
        )

        ranked.append({
            "id": str(c["_id"]),
            "candidate_id": c["candidate_id"],
            "name": c["name"],
            "email": c.get("email", ""),
            "skills": c.get("skills", []),
            "experience_years": c.get("experience_years", 0),
            "education": c.get("education", ""),
            "match_score": final_score,
            "skill_match_percent": round(skill_match, 1),
            "matched_skills": matched,
            "missing_skills": missing,
        })

    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "job_title": title,
        "total_candidates": len(ranked),
        "candidates": ranked[:top_n],
    }


async def score_single_resume(resume_id: str, description: str, required_skills: list[str], min_experience: int = 0) -> dict:
    """Generate a detailed score for a single resume against a job description."""
    from bson import ObjectId
    db = get_db()
    resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
    if not resume:
        return None

    # Skill match
    jd_skills = list(set([s.lower() for s in (extract_skills_from_text(description) + required_skills)]))
    r_skills = [s.lower() for s in resume.get("skills", [])]
    matched = [s for s in jd_skills if s in r_skills]
    skill_match = (len(matched) / len(jd_skills) * 100) if jd_skills else 0

    # Experience relevance
    exp_relevance = min(resume.get("experience_years", 0) / max(min_experience, 1) * 100, 100) if min_experience > 0 else 50

    # Resume quality (based on text length, sections, etc.)
    text = resume.get("resume_text", "")
    quality_factors = 0
    if len(text) > 200:
        quality_factors += 25
    if resume.get("email"):
        quality_factors += 25
    if resume.get("education") and resume["education"] != "Not specified":
        quality_factors += 25
    if len(resume.get("skills", [])) >= 3:
        quality_factors += 25
    quality = min(quality_factors, 100)

    final_score = round(0.5 * skill_match + 0.3 * exp_relevance + 0.2 * quality, 1)

    # Improvement suggestions
    suggestions = []
    missing = [s for s in jd_skills if s not in r_skills]
    if missing:
        suggestions.append(f"Add missing skills: {', '.join(missing[:5])}")
    if resume.get("experience_years", 0) < min_experience:
        suggestions.append(f"Highlight more experience (required: {min_experience}+ years)")
    if len(text) < 300:
        suggestions.append("Resume is too short — add more details about projects and achievements")
    if quality < 75:
        suggestions.append("Add quantified achievements and measurable results")

    return {
        "resume_id": str(resume["_id"]),
        "name": resume["name"],
        "resume_score": final_score,
        "skill_match": round(skill_match, 1),
        "experience_relevance": round(exp_relevance, 1),
        "resume_quality": round(quality, 1),
        "improvement_suggestions": suggestions,
    }
