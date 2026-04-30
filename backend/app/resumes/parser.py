import re
import io
import fitz  # PyMuPDF
from docx import Document


def extract_text_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text() + "\n"
    return text.strip()


def extract_text_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    return text.strip()


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route to the correct extractor based on file extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def extract_email(text: str) -> str:
    """Extract email address from text."""
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else ""


def extract_name(text: str) -> str:
    """Extract candidate name (heuristic: first non-empty line)."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if lines:
        first_line = lines[0]
        # If first line looks like a name (short, no special chars)
        if len(first_line) < 60 and not re.search(r'[@\d]', first_line):
            return first_line
    return "Unknown"


def extract_experience_years(text: str) -> int:
    """Extract years of experience from text."""
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
        r'experience\s*(?:of)?\s*(\d+)\+?\s*(?:years?|yrs?)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return 0


def extract_education(text: str) -> str:
    """Extract highest education level."""
    education_levels = [
        ("phd", "PhD"),
        ("ph.d", "PhD"),
        ("doctorate", "PhD"),
        ("master", "Master's"),
        ("m.tech", "M.Tech"),
        ("m.sc", "M.Sc"),
        ("mba", "MBA"),
        ("m.s.", "Master's"),
        ("bachelor", "Bachelor's"),
        ("b.tech", "B.Tech"),
        ("b.sc", "B.Sc"),
        ("bca", "BCA"),
        ("b.e.", "B.E."),
        ("b.s.", "Bachelor's"),
        ("diploma", "Diploma"),
        ("high school", "High School"),
        ("12th", "12th Grade"),
        ("10th", "10th Grade"),
    ]
    text_lower = text.lower()
    for keyword, label in education_levels:
        if keyword in text_lower:
            return label
    return "Not specified"


def parse_resume(file_bytes: bytes, filename: str) -> dict:
    """Full resume parsing pipeline."""
    text = extract_text(file_bytes, filename)
    from app.nlp.preprocessor import extract_skills_from_text

    return {
        "resume_text": text,
        "name": extract_name(text),
        "email": extract_email(text),
        "skills": extract_skills_from_text(text),
        "experience_years": extract_experience_years(text),
        "education": extract_education(text),
    }
