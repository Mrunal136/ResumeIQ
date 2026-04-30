# ResumeIQ — Smart Resume Ranker

AI-powered resume screening and candidate ranking system.

## Architecture

```
Next.js (Frontend) → FastAPI (Backend) → MongoDB Atlas (Storage + Vector Search)
                                       → Gemini API / sentence-transformers (Embeddings)
```

## Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env  # Edit with your MongoDB URI and Gemini API key
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, TailwindCSS v4, Zustand, Recharts
- **Backend**: FastAPI, Motor (async MongoDB), PyMuPDF, SpaCy
- **AI/ML**: Gemini Embedding API (primary), sentence-transformers (fallback)
- **Auth**: JWT (HTTP-only cookies), passlib bcrypt
- **Database**: MongoDB Atlas with Vector Search
