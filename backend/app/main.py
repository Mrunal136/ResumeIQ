from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_db, close_db, is_db_connected
from app.auth.router import router as auth_router
from app.resumes.router import router as resumes_router
from app.ranking.router import router as ranking_router
from app.jobs.router import router as jobs_router
from app.candidates.router import router as candidates_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="ResumeIQ — Smart Resume Ranker",
    description="AI-powered resume screening, job matching, and candidate ranking platform",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(resumes_router)
app.include_router(ranking_router)
app.include_router(jobs_router)
app.include_router(candidates_router)


@app.get("/")
async def root():
    return {
        "name": "ResumeIQ API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "database": "connected" if is_db_connected() else "disconnected",
    }
