"""Train the local resume-job fit model from the Hugging Face dataset."""

from app.nlp.fit_model import train_resume_fit_model


if __name__ == "__main__":
    payload = train_resume_fit_model()
    print(
        {
            "accuracy": round(payload["accuracy"], 4),
            "macro_f1": round(payload["macro_f1"], 4),
            "train_rows": payload["train_rows"],
            "test_rows": payload["test_rows"],
        }
    )
