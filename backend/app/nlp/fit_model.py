from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline, make_pipeline

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DATASET_DIR = ROOT_DIR / "data_to_train_model" / "resume-job-fit-merged-v1-real"
TRAIN_PATH = DEFAULT_DATASET_DIR / "data" / "train-00000-of-00002.parquet"
TRAIN_PATH_2 = DEFAULT_DATASET_DIR / "data" / "train-00001-of-00002.parquet"
TEST_PATH = DEFAULT_DATASET_DIR / "data" / "test-00000-of-00001.parquet"
ARTIFACT_PATH = Path(__file__).resolve().parent / "artifacts" / "resume_fit_model.joblib"
MAX_TRAIN_ROWS = 25000
MAX_TEST_ROWS = 5000


@dataclass(frozen=True)
class FitExample:
    resume: str
    jd: str
    label: str


def _load_parquet_rows(path: Path) -> list[FitExample]:
    import pyarrow.parquet as pq

    table = pq.read_table(path, columns=["resume", "jd", "label"])
    rows = table.to_pylist()
    examples: list[FitExample] = []
    for row in rows:
        resume = (row.get("resume") or "").strip()
        jd = (row.get("jd") or "").strip()
        label = (row.get("label") or "").strip()
        if resume and jd and label:
            examples.append(FitExample(resume=resume, jd=jd, label=label))
    return examples


def _load_dataset() -> tuple[list[FitExample], list[FitExample]]:
    if not TRAIN_PATH.exists() or not TRAIN_PATH_2.exists() or not TEST_PATH.exists():
        raise RuntimeError("Resume-job fit dataset files are missing")

    train_examples = _load_parquet_rows(TRAIN_PATH) + _load_parquet_rows(TRAIN_PATH_2)
    test_examples = _load_parquet_rows(TEST_PATH)
    return train_examples, test_examples


def _join_text(resume: str, jd: str) -> str:
    return f"RESUME:\n{resume}\n\nJOB DESCRIPTION:\n{jd}"


def _build_model() -> Pipeline:
    return make_pipeline(
        HashingVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            n_features=2**18,
            alternate_sign=False,
        ),
        SGDClassifier(
            loss="log_loss",
            max_iter=25,
            tol=1e-3,
            class_weight="balanced",
        ),
    )


def train_resume_fit_model() -> dict:
    train_examples, test_examples = _load_dataset()
    if len(train_examples) < 1000 or len(test_examples) < 100:
        raise RuntimeError("Not enough data to train the resume fit model")

    if len(train_examples) > MAX_TRAIN_ROWS:
        train_examples = train_examples[:MAX_TRAIN_ROWS]
    if len(test_examples) > MAX_TEST_ROWS:
        test_examples = test_examples[:MAX_TEST_ROWS]

    x_train = [_join_text(example.resume, example.jd) for example in train_examples]
    y_train = [example.label for example in train_examples]
    x_test = [_join_text(example.resume, example.jd) for example in test_examples]
    y_test = [example.label for example in test_examples]

    model = _build_model()
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    macro_f1 = f1_score(y_test, predictions, average="macro")

    payload = {
        "model": model,
        "labels": list(model.named_steps["sgdclassifier"].classes_),
        "accuracy": float(accuracy),
        "macro_f1": float(macro_f1),
        "train_rows": len(train_examples),
        "test_rows": len(test_examples),
    }
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, ARTIFACT_PATH)
    logger.info(
        "Trained resume fit model: accuracy=%.3f macro_f1=%.3f rows=%s/%s",
        accuracy,
        macro_f1,
        len(train_examples),
        len(test_examples),
    )
    return payload


@lru_cache(maxsize=1)
def get_resume_fit_model() -> dict:
    if ARTIFACT_PATH.exists():
        try:
            payload = joblib.load(ARTIFACT_PATH)
            if isinstance(payload, dict) and "model" in payload:
                return payload
        except Exception as exc:
            logger.warning("Failed to load resume fit artifact, retraining: %s", exc)
    return train_resume_fit_model()


def _fit_probabilities(resume_text: str, job_text: str) -> dict[str, float]:
    payload = get_resume_fit_model()
    model: Pipeline = payload["model"]
    text = _join_text(resume_text, job_text)
    proba = model.predict_proba([text])[0]
    labels = list(model.named_steps["sgdclassifier"].classes_)
    return {label: float(score) for label, score in zip(labels, proba)}


def score_fit(resume_text: str, job_text: str) -> dict[str, float | str]:
    """Return a trained-model fit score in a simple, app-friendly format."""
    probs = _fit_probabilities(resume_text, job_text)
    good = probs.get("Good Fit", 0.0)
    potential = probs.get("Potential Fit", 0.0)
    no_fit = probs.get("No Fit", 0.0)
    score = round((good * 100) + (potential * 55) - (no_fit * 20), 1)
    score = max(0.0, min(score, 100.0))
    label = str(max(probs, key=probs.get))
    return {
        "fit_score": score,
        "predicted_label": label,
        "good_fit_probability": round(good, 4),
        "potential_fit_probability": round(potential, 4),
        "no_fit_probability": round(no_fit, 4),
    }
