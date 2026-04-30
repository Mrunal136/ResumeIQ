from __future__ import annotations

import csv
import logging
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Optional

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.svm import LinearSVC

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = ROOT_DIR / "data_to_train_model" / "archive (1)" / "job_dataset.csv"
ARTIFACT_PATH = Path(__file__).resolve().parent / "artifacts" / "role_knowledge.joblib"


@dataclass(frozen=True)
class RoleExample:
    title: str
    text: str
    skills: tuple[str, ...]


def _split_values(value: str) -> list[str]:
    parts = re.split(r"[;|,/]\s*|\n+", value or "")
    cleaned: list[str] = []
    seen: set[str] = set()
    for part in parts:
        item = part.strip()
        if not item:
            continue
        key = item.lower()
        if key not in seen:
            cleaned.append(item)
            seen.add(key)
    return cleaned


def _build_text(row: dict[str, str]) -> str:
    pieces = [
        row.get("Skills", ""),
        row.get("Responsibilities", ""),
        row.get("Keywords", ""),
    ]
    return " ".join(piece for piece in pieces if piece).strip()


def _load_examples() -> list[RoleExample]:
    if not DATA_PATH.exists():
        logger.warning("Role knowledge dataset not found at %s", DATA_PATH)
        return []

    examples: list[RoleExample] = []
    with DATA_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            title = (row.get("Title") or "").strip()
            if not title:
                continue
            skills = tuple(_split_values(row.get("Skills", "")))
            text = _build_text(row)
            examples.append(RoleExample(title=title, text=text, skills=skills))
    return examples


def _train_model() -> dict:
    examples = _load_examples()
    if not examples:
        raise RuntimeError("No training data available for role knowledge model")

    texts = [example.text for example in examples]
    labels = [example.title for example in examples]

    # The dataset is title-labeled, so a text classifier works better than a
    # nearest-neighbor retriever for role suggestions.
    model: Pipeline = make_pipeline(
        TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=25000),
        LinearSVC(),
    )
    model.fit(texts, labels)

    skill_frequency: dict[str, Counter[str]] = defaultdict(Counter)
    title_counts: Counter[str] = Counter(labels)
    for example in examples:
        for skill in example.skills:
            skill_frequency[example.title][skill] += 1

    return {
        "model": model,
        "examples": examples,
        "skill_frequency": skill_frequency,
        "title_counts": title_counts,
    }


@lru_cache(maxsize=1)
def get_role_knowledge() -> dict:
    """Load the cached role knowledge model or train it on first use."""
    if ARTIFACT_PATH.exists():
        try:
            payload = joblib.load(ARTIFACT_PATH)
            if isinstance(payload, dict) and "model" in payload and "examples" in payload:
                return payload
            logger.warning("Role knowledge artifact is stale; retraining")
        except Exception as exc:
            logger.warning("Failed to load role knowledge artifact, retraining: %s", exc)

    payload = _train_model()
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, ARTIFACT_PATH)
    logger.info("Trained role knowledge model from %s examples", len(payload["examples"]))
    return payload


def _top_role_skills(title: str, payload: dict, limit: int = 6) -> list[str]:
    frequency: Counter[str] = payload["skill_frequency"].get(title, Counter())
    return [skill for skill, _ in frequency.most_common(limit)]


def _predict_top_titles(query_text: str, payload: dict, top_n: int = 3) -> list[str]:
    model: Pipeline = payload["model"]
    classifier = model.named_steps["linearsvc"]
    vectorizer = model.named_steps["tfidfvectorizer"]
    scores = classifier.decision_function(vectorizer.transform([query_text]))

    if scores.ndim == 1:
        return [classifier.classes_[int(scores.argmax())]]

    ranked_indices = scores[0].argsort()[::-1][:top_n]
    return [classifier.classes_[index] for index in ranked_indices]


def suggest_training_paths(
    job_title: str,
    job_description: str,
    required_skills: Iterable[str],
    missing_skills: Iterable[str],
    resume_skills: Optional[Iterable[str]] = None,
    top_n: int = 5,
) -> list[str]:
    """Return short, course-like upskilling suggestions from role data."""
    payload = get_role_knowledge()
    query_text = " ".join(
        [
            job_title,
            job_description,
            " ".join(required_skills),
        ]
    ).strip()

    resume_skill_set = {skill.strip().lower() for skill in (resume_skills or []) if skill.strip()}
    missing_skill_set = {skill.strip().lower() for skill in missing_skills if skill.strip()}
    required_skill_set = {skill.strip().lower() for skill in required_skills if skill.strip()}

    suggestions: list[str] = []
    seen: set[str] = set()

    # Start with the actual missing skills, so the advice stays grounded.
    for skill in missing_skills:
        normalized = skill.strip().lower()
        if not normalized or normalized in seen:
            continue
        suggestions.append(f"Complete a focused course or project on {skill.strip()}.")
        seen.add(normalized)
        if len(suggestions) >= top_n:
            return suggestions

    # Add adjacent skills from the most likely role labels.
    for predicted_title in _predict_top_titles(query_text, payload, top_n=3):
        for skill in _top_role_skills(predicted_title, payload, limit=8):
            normalized = skill.strip().lower()
            if not normalized or normalized in seen:
                continue
            if normalized in resume_skill_set or normalized in required_skill_set or normalized in missing_skill_set:
                continue
            suggestions.append(
                f"Build hands-on experience with {skill} because it is common in {predicted_title} roles from the training data."
            )
            seen.add(normalized)
            if len(suggestions) >= top_n:
                return suggestions

    if not suggestions and job_title:
        fallback_skills = _top_role_skills(job_title, payload, limit=top_n)
        for skill in fallback_skills:
            normalized = skill.strip().lower()
            if not normalized or normalized in seen or normalized in resume_skill_set:
                continue
            suggestions.append(
                f"Strengthen your profile with {skill}, which is common in {job_title} roles from the training data."
            )
            seen.add(normalized)
            if len(suggestions) >= top_n:
                break

    return suggestions[:top_n]


def evaluate_role_model(sample_size: int = 250) -> dict[str, float]:
    """Evaluate the classifier with a simple held-out title prediction test."""
    payload = get_role_knowledge()
    examples: list[RoleExample] = payload["examples"]
    if len(examples) < 10:
        return {"top1_accuracy": 0.0, "top3_accuracy": 0.0, "samples": float(len(examples))}

    texts = [example.text for example in examples]
    labels = [example.title for example in examples]
    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)

    model: Pipeline = make_pipeline(
        TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=25000),
        LinearSVC(),
    )
    model.fit(X_train, y_train)

    classifier = model.named_steps["linearsvc"]
    vectorizer = model.named_steps["tfidfvectorizer"]
    scores = classifier.decision_function(vectorizer.transform(X_test))
    predictions = model.predict(X_test)

    top1 = accuracy_score(y_test, predictions) * 100
    top3_hits = 0
    if scores.ndim == 1:
        top3_hits = top1
    else:
        for row_idx, actual in enumerate(y_test):
            ranked_indices = scores[row_idx].argsort()[::-1][:3]
            ranked_titles = [classifier.classes_[index] for index in ranked_indices]
            if actual in ranked_titles:
                top3_hits += 1
        top3_hits = top3_hits / len(y_test) * 100 if y_test else 0.0

    return {
        "top1_accuracy": round(top1, 1),
        "top3_accuracy": round(top3_hits, 1),
        "samples": float(len(y_test)),
    }
