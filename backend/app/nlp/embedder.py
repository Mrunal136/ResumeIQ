import hashlib
import logging
import math

from app.config import settings

logger = logging.getLogger(__name__)

# Small, local and Mac-friendly default.
LOCAL_MODEL_NAME = settings.HF_EMBEDDING_MODEL
LOCAL_MODEL_DIM = 384
HASH_DIM = 128

_genai_client = None
_gemini_available = False
_st_model = None
_st_available = True


def _init_gemini() -> None:
    """Initialize Gemini only when the user explicitly opts in."""
    global _genai_client, _gemini_available
    try:
        from google import genai

        if settings.GEMINI_API_KEY:
            _genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            _gemini_available = True
            logger.info("✅ Gemini embeddings ready")
        else:
            logger.info("Gemini is disabled because GEMINI_API_KEY is missing")
    except Exception as exc:
        logger.warning(f"Gemini init failed: {exc}")


def _get_st_model():
    global _st_model, _st_available
    if _st_model is None:
        try:
            from sentence_transformers import SentenceTransformer

            _st_model = SentenceTransformer(LOCAL_MODEL_NAME, local_files_only=True)
            logger.info(f"✅ Loaded cached HF model: {LOCAL_MODEL_NAME}")
        except Exception as exc:
            if settings.HF_ALLOW_DOWNLOADS:
                try:
                    from sentence_transformers import SentenceTransformer

                    _st_model = SentenceTransformer(LOCAL_MODEL_NAME)
                    logger.info(f"✅ Downloaded HF model: {LOCAL_MODEL_NAME}")
                    return _st_model
                except Exception as download_exc:
                    logger.warning(f"HF model download failed: {download_exc}")
            _st_available = False
            logger.warning(f"Local HF model unavailable, using fallback: {exc}")
    return _st_model


def _hash_embedding(text: str, dim: int = HASH_DIM) -> list[float]:
    """Last-resort fallback so the app always stays runnable."""
    words = text.lower().split()
    vec = [0.0] * dim
    for word in words:
        h = int(hashlib.sha256(word.encode()).hexdigest(), 16)
        for i in range(dim):
            vec[i] += 1.0 if ((h >> i) & 1) else -1.0
    magnitude = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / magnitude for x in vec]


def _embed_with_local_model(text: str) -> tuple[list[float], int]:
    model = _get_st_model()
    if model is None:
        raise RuntimeError("Local embedding model is unavailable")
    embedding = model.encode(text, normalize_embeddings=True).tolist()
    return embedding, LOCAL_MODEL_DIM


def _embed_with_gemini(text: str) -> tuple[list[float], int]:
    if _genai_client is None and not _gemini_available:
        _init_gemini()
    if not _gemini_available or _genai_client is None:
        raise RuntimeError("Gemini is unavailable")
    result = _genai_client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
    )
    embedding = result.embeddings[0].values
    return list(embedding), len(embedding)


def get_embedding(text: str) -> tuple[list[float], int]:
    """Return an embedding vector and its size.

    Provider order:
    1. Local Hugging Face model
    2. Gemini if explicitly enabled and available
    3. Hash fallback so the app never crashes
    """
    provider = (settings.EMBEDDING_PROVIDER or "local").strip().lower()

    if provider == "gemini":
        try:
            return _embed_with_gemini(text)
        except Exception as exc:
            logger.warning(f"Gemini embedding failed, falling back to local model: {exc}")

    try:
        return _embed_with_local_model(text)
    except Exception as exc:
        logger.warning(f"Local HF embedding failed: {exc}")

    if provider != "gemini":
        try:
            return _embed_with_gemini(text)
        except Exception:
            pass

    logger.info("Using hash-based embedding fallback")
    return _hash_embedding(text), HASH_DIM


def get_embedding_dimensions() -> int:
    """Return the size we expect for new embeddings."""
    provider = (settings.EMBEDDING_PROVIDER or "local").strip().lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            if _genai_client is None and not _gemini_available:
                _init_gemini()
            if _gemini_available:
                return len(_embed_with_gemini("dimension probe")[0])
        except Exception:
            pass
    model = _get_st_model()
    if model is not None:
        return LOCAL_MODEL_DIM
    return HASH_DIM
