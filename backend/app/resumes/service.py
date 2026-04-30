import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from bson import ObjectId

from app.database import get_db
from app.resumes.parser import parse_resume
from app.nlp.preprocessor import preprocess
from app.nlp.embedder import get_embedding


def _resume_label_from_filename(filename: str) -> str:
    stem = Path(filename).stem.replace("_", " ").replace("-", " ").strip()
    return stem.title() or "Resume"


def _safe_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None


def _format_resume(doc: dict, *, include_text: bool = False) -> dict:
    payload = {
        "id": str(doc["_id"]),
        "label": doc.get("label") or _resume_label_from_filename(doc.get("filename", "Resume")),
        "filename": doc.get("filename", "resume"),
        "name": doc.get("name", "Unknown"),
        "email": doc.get("email", ""),
        "skills": doc.get("skills", []),
        "experience_years": doc.get("experience_years", 0),
        "education": doc.get("education", "Not specified"),
        "is_default": bool(doc.get("is_default")),
        "embedding_dim": doc.get("embedding_dim"),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
    }
    if include_text:
        payload["resume_text"] = doc.get("resume_text", "")
    return payload


async def process_and_store_resume(
    file_bytes: bytes,
    filename: str,
    uploader_id: str,
    *,
    make_default: Optional[bool] = None,
) -> dict:
    """Parse resume, generate embedding, and store in MongoDB."""
    parsed = parse_resume(file_bytes, filename)

    # Preprocess for embedding
    processed_text = preprocess(parsed["resume_text"])
    embedding, dim = get_embedding(processed_text)

    db = get_db()
    existing_count = await db.resumes.count_documents({"user_id": uploader_id})
    is_default = make_default if make_default is not None else existing_count == 0

    if is_default:
        await db.resumes.update_many({"user_id": uploader_id}, {"$set": {"is_default": False}})

    doc = {
        "candidate_id": str(uuid.uuid4()),
        "user_id": uploader_id,
        "label": _resume_label_from_filename(filename),
        "name": parsed["name"],
        "email": parsed["email"],
        "skills": parsed["skills"],
        "experience_years": parsed["experience_years"],
        "education": parsed["education"],
        "resume_text": parsed["resume_text"],
        "embedding": embedding,
        "embedding_dim": dim,
        "filename": filename,
        "is_default": is_default,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.resumes.insert_one(doc)
    doc["_id"] = result.inserted_id

    response = _format_resume(doc)
    response["message"] = "Resume uploaded and processed successfully"
    return response


async def get_all_resumes(
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    skill_filter: str = None,
    min_experience: int = None,
) -> dict:
    """Fetch resumes for the current candidate."""
    db = get_db()
    query = {"user_id": user_id}
    if skill_filter:
        query["skills"] = {"$in": [s.strip() for s in skill_filter.split(",")]}
    if min_experience is not None:
        query["experience_years"] = {"$gte": min_experience}

    total = await db.resumes.count_documents(query)
    cursor = (
        db.resumes
        .find(query, {"embedding": 0, "resume_text": 0})
        .sort([("is_default", -1), ("created_at", -1)])
        .skip(skip)
        .limit(limit)
    )
    resumes = []
    async for doc in cursor:
        resumes.append(_format_resume(doc))
    return {"total": total, "resumes": resumes}


async def get_resume_by_id(resume_id: str, user_id: str) -> dict:
    """Fetch a single resume owned by the current candidate."""
    db = get_db()
    oid = _safe_object_id(resume_id)
    if oid is None:
        return None
    doc = await db.resumes.find_one(
        {"_id": oid, "user_id": user_id},
        {"embedding": 0},
    )
    if not doc:
        return None
    return _format_resume(doc, include_text=True)


async def delete_resume(resume_id: str, user_id: str) -> bool:
    """Delete a resume owned by the current candidate."""
    db = get_db()
    oid = _safe_object_id(resume_id)
    if oid is None:
        return False
    resume = await db.resumes.find_one({"_id": oid, "user_id": user_id})
    if not resume:
        return False

    result = await db.resumes.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        return False

    if resume.get("is_default"):
        replacement = await db.resumes.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)],
        )
        if replacement:
            await db.resumes.update_one(
                {"_id": replacement["_id"]},
                {"$set": {"is_default": True}},
            )
    return True


async def set_default_resume(resume_id: str, user_id: str) -> Optional[dict]:
    db = get_db()
    oid = _safe_object_id(resume_id)
    if oid is None:
        return None
    resume = await db.resumes.find_one({"_id": oid, "user_id": user_id})
    if not resume:
        return None

    await db.resumes.update_many({"user_id": user_id}, {"$set": {"is_default": False}})
    await db.resumes.update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": {"is_default": True, "updated_at": datetime.now(timezone.utc)}},
    )
    updated = await db.resumes.find_one({"_id": oid, "user_id": user_id})
    return _format_resume(updated)
