import re
import logging

logger = logging.getLogger(__name__)

# ── Try to load SpaCy (may fail on Python 3.14) ──────────────────
_nlp = None
_spacy_available = False

try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
    _spacy_available = True
    STOP_WORDS = _nlp.Defaults.stop_words
    logger.info("✅ SpaCy loaded for text preprocessing")
except Exception as e:
    logger.warning(f"⚠️  SpaCy unavailable ({e}) — using regex fallback")
    # Minimal English stop words for fallback
    STOP_WORDS = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "shall", "can", "need", "must",
        "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
        "she", "her", "it", "its", "they", "them", "their", "this", "that",
        "these", "those", "am", "not", "no", "so", "if", "then", "than",
        "too", "very", "just", "about", "above", "after", "before", "between",
        "into", "through", "during", "out", "up", "down", "over", "under",
        "again", "further", "once", "here", "there", "when", "where", "how",
        "all", "each", "every", "both", "few", "more", "most", "other",
        "some", "such", "only", "own", "same", "also", "as",
    }


def clean_text(text: str) -> str:
    """Lowercase, remove special chars, extra whitespace."""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s\.\,\@\+\#]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tokenize_and_lemmatize(text: str) -> list[str]:
    """Tokenize and lemmatize text, removing stopwords."""
    if _spacy_available and _nlp:
        doc = _nlp(text)
        tokens = [
            token.lemma_.lower()
            for token in doc
            if token.text.lower() not in STOP_WORDS
            and not token.is_punct
            and not token.is_space
            and len(token.text) > 1
        ]
        return tokens
    else:
        # Regex fallback: simple whitespace tokenization + stopword removal
        words = re.findall(r'[a-zA-Z0-9\+\#\.]+', text.lower())
        return [w for w in words if w not in STOP_WORDS and len(w) > 1]


def preprocess(text: str) -> str:
    """Full preprocessing pipeline: clean → tokenize → lemmatize → rejoin."""
    cleaned = clean_text(text)
    tokens = tokenize_and_lemmatize(cleaned)
    return " ".join(tokens)


def extract_skills_from_text(text: str, skill_list: list[str] = None) -> list[str]:
    """Extract skills from text by matching against a known skill list."""
    DEFAULT_SKILLS = [
        "python", "javascript", "typescript", "react", "nextjs", "next.js",
        "angular", "vue", "node", "nodejs", "node.js", "express", "fastapi",
        "django", "flask", "mongodb", "postgresql", "mysql", "redis",
        "docker", "kubernetes", "aws", "azure", "gcp", "git", "github",
        "html", "css", "tailwind", "sass", "figma", "java", "c++", "c#",
        "go", "rust", "swift", "kotlin", "php", "ruby", "scala",
        "machine learning", "deep learning", "nlp", "tensorflow",
        "pytorch", "scikit-learn", "pandas", "numpy", "sql", "nosql",
        "graphql", "rest", "api", "microservices", "ci/cd", "jenkins",
        "linux", "agile", "scrum", "jira", "confluence",
        "data analysis", "data engineering", "data science",
        "devops", "cloud computing", "blockchain", "cybersecurity",
    ]

    skills = skill_list or DEFAULT_SKILLS
    text_lower = text.lower()
    found = []
    for skill in skills:
        if skill.lower() in text_lower:
            found.append(skill)
    return list(set(found))
