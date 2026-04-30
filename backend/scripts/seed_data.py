"""
Seed script for ResumeIQ — resets the database and creates demo accounts + job postings.

Creates:
  - 1 Recruiter account (recruiter@resumeiq.com / Password123!)
  - 1 Candidate account (candidate@resumeiq.com / Password123!)
  - 8 realistic job postings created by the recruiter

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_data.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ── Account Data ──────────────────────────────────────────────────
RECRUITER = {
    "name": "Sarah Chen",
    "email": "recruiter@resumeiq.com",
    "password": hash_password("Password123!"),
    "role": "recruiter",
    "created_at": datetime.now(timezone.utc),
}

CANDIDATE = {
    "name": "Test Candidate",
    "email": "candidate@resumeiq.com",
    "password": hash_password("Password123!"),
    "role": "candidate",
    "created_at": datetime.now(timezone.utc),
}


# ── Job Postings ──────────────────────────────────────────────────
# Realistic job data sourced from current 2025-2026 industry descriptions.

JOBS = [
    {
        "title": "Senior Full-Stack Developer",
        "company": "TechNova Solutions",
        "description": (
            "We're looking for a Senior Full-Stack Developer to lead the design and implementation of our "
            "next-generation SaaS platform. You'll work across the entire stack — from crafting responsive, "
            "interactive frontends to building high-performance backend APIs and microservices. This role "
            "requires strong ownership, a passion for clean architecture, and experience shipping production "
            "software at scale.\n\n"
            "Responsibilities:\n"
            "• Architect and build scalable front-end and back-end features using React/Next.js and Node.js/Python\n"
            "• Design and optimize RESTful and GraphQL APIs for internal and external consumers\n"
            "• Lead code reviews, mentor junior developers, and drive engineering best practices\n"
            "• Integrate third-party services (payment gateways, analytics, auth providers)\n"
            "• Implement CI/CD pipelines and automated testing to maintain code quality\n"
            "• Collaborate closely with product, design, and data teams in an agile environment"
        ),
        "required_skills": [
            "react", "next.js", "node.js", "typescript", "python",
            "postgresql", "mongodb", "rest api", "git", "docker"
        ],
        "preferred_skills": [
            "graphql", "redis", "kubernetes", "aws", "terraform",
            "ci/cd", "microservices", "system design"
        ],
        "min_experience": 5,
        "location": "San Francisco, CA (Hybrid)",
        "salary_range": "$160,000 – $210,000",
        "job_type": "full-time",
    },
    {
        "title": "Machine Learning Engineer",
        "company": "DeepMind Labs",
        "description": (
            "Join our ML Engineering team to develop, deploy, and optimize production machine learning systems "
            "that power intelligent features across our product suite. You'll bridge the gap between research "
            "and production, turning state-of-the-art models into reliable, scalable services.\n\n"
            "Responsibilities:\n"
            "• Design end-to-end ML pipelines from data ingestion to model serving\n"
            "• Train, fine-tune, and deploy deep learning models (NLP, computer vision, recommendation systems)\n"
            "• Build and maintain MLOps infrastructure — experiment tracking, model registry, automated retraining\n"
            "• Optimize model inference for latency and cost using techniques like quantization and distillation\n"
            "• Implement RAG systems and LLM-based features with prompt engineering best practices\n"
            "• Collaborate with data engineers and product teams to define success metrics"
        ),
        "required_skills": [
            "python", "pytorch", "tensorflow", "scikit-learn",
            "deep learning", "nlp", "machine learning", "sql",
            "docker", "linux"
        ],
        "preferred_skills": [
            "mlflow", "kubeflow", "aws sagemaker", "vertex ai",
            "hugging face", "langchain", "rag", "prompt engineering",
            "spark", "statistics"
        ],
        "min_experience": 3,
        "location": "New York, NY (Remote-Friendly)",
        "salary_range": "$170,000 – $230,000",
        "job_type": "full-time",
    },
    {
        "title": "Data Engineer",
        "company": "DataStream Analytics",
        "description": (
            "We need a Data Engineer to build and maintain the robust data infrastructure that powers our "
            "analytics platform serving 50M+ events daily. You'll design scalable ETL/ELT pipelines, manage "
            "our data warehouse, and ensure data quality and reliability for downstream ML and BI consumers.\n\n"
            "Responsibilities:\n"
            "• Design, build, and optimize data pipelines for ingestion, transformation, and storage\n"
            "• Manage and evolve our cloud data warehouse (Snowflake/BigQuery) architecture\n"
            "• Implement data quality checks, monitoring, and alerting across pipelines\n"
            "• Build real-time streaming pipelines using Kafka and Apache Flink\n"
            "• Collaborate with data scientists to structure data for model training and feature stores\n"
            "• Define and enforce data governance policies and documentation standards"
        ),
        "required_skills": [
            "python", "sql", "apache spark", "kafka", "airflow",
            "snowflake", "aws", "etl", "data modeling", "git"
        ],
        "preferred_skills": [
            "dbt", "terraform", "kubernetes", "bigquery", "flink",
            "databricks", "data governance", "ci/cd"
        ],
        "min_experience": 3,
        "location": "Austin, TX (Hybrid)",
        "salary_range": "$140,000 – $190,000",
        "job_type": "full-time",
    },
    {
        "title": "DevOps / Site Reliability Engineer",
        "company": "CloudScale Inc.",
        "description": (
            "We're seeking a DevOps/SRE to design, automate, and maintain the infrastructure that keeps our "
            "platform running at 99.99% uptime. You'll own the full deployment lifecycle — from CI/CD pipelines "
            "to production observability — and drive a culture of reliability engineering.\n\n"
            "Responsibilities:\n"
            "• Design and maintain CI/CD pipelines for automated build, test, and deployment\n"
            "• Manage cloud infrastructure on AWS/GCP using Infrastructure as Code (Terraform, Pulumi)\n"
            "• Operate and scale Kubernetes clusters running 200+ microservices\n"
            "• Build comprehensive observability solutions (metrics, logging, tracing, alerting)\n"
            "• Conduct incident response, postmortems, and implement preventive measures\n"
            "• Automate operational tasks and improve developer productivity tooling"
        ),
        "required_skills": [
            "aws", "kubernetes", "docker", "terraform", "ci/cd",
            "linux", "python", "bash", "monitoring", "git"
        ],
        "preferred_skills": [
            "gcp", "prometheus", "grafana", "datadog", "helm",
            "argocd", "golang", "ansible", "istio", "security"
        ],
        "min_experience": 4,
        "location": "Seattle, WA (Remote)",
        "salary_range": "$150,000 – $200,000",
        "job_type": "full-time",
    },
    {
        "title": "Frontend Developer (React/TypeScript)",
        "company": "PixelCraft Studios",
        "description": (
            "We're hiring a Frontend Developer to build beautiful, performant, and accessible user interfaces "
            "for our design collaboration platform used by 100K+ creative professionals. You'll work with our "
            "design system team to create pixel-perfect, responsive components.\n\n"
            "Responsibilities:\n"
            "• Build and maintain reusable UI components using React 19, TypeScript, and our design system\n"
            "• Implement complex interactive features including real-time collaboration and canvas rendering\n"
            "• Optimize frontend performance — bundle size, rendering, and Core Web Vitals\n"
            "• Ensure WCAG 2.1 accessibility compliance across all components\n"
            "• Write comprehensive unit/integration tests with Jest, React Testing Library, and Playwright\n"
            "• Collaborate with UX designers to translate Figma mockups into production interfaces"
        ),
        "required_skills": [
            "react", "typescript", "javascript", "html", "css",
            "responsive design", "git", "rest api", "testing", "figma"
        ],
        "preferred_skills": [
            "next.js", "tailwindcss", "storybook", "playwright",
            "graphql", "web performance", "accessibility", "design systems"
        ],
        "min_experience": 2,
        "location": "London, UK (Hybrid)",
        "salary_range": "£65,000 – £90,000",
        "job_type": "full-time",
    },
    {
        "title": "Backend Developer (Python/FastAPI)",
        "company": "FinEdge Technologies",
        "description": (
            "Join our backend team to build high-throughput, low-latency APIs for our fintech platform "
            "processing $2B+ in annual transactions. You'll design event-driven microservices, optimize "
            "database performance, and ensure enterprise-grade security and compliance.\n\n"
            "Responsibilities:\n"
            "• Design and implement RESTful APIs using Python (FastAPI/Django) with async patterns\n"
            "• Build event-driven architectures using message queues (RabbitMQ, Kafka)\n"
            "• Optimize PostgreSQL/MongoDB query performance and schema design\n"
            "• Implement authentication, authorization, and data encryption for PCI-DSS compliance\n"
            "• Write thorough unit and integration tests achieving 90%+ code coverage\n"
            "• Participate in on-call rotation and production incident response"
        ),
        "required_skills": [
            "python", "fastapi", "postgresql", "mongodb", "rest api",
            "docker", "git", "sql", "testing", "linux"
        ],
        "preferred_skills": [
            "django", "rabbitmq", "kafka", "redis", "celery",
            "aws", "kubernetes", "microservices", "security", "grpc"
        ],
        "min_experience": 3,
        "location": "Bangalore, India (Hybrid)",
        "salary_range": "₹20,00,000 – ₹35,00,000",
        "job_type": "full-time",
    },
    {
        "title": "Cloud Solutions Architect",
        "company": "Nimbus Cloud Services",
        "description": (
            "We are looking for a Cloud Solutions Architect to lead the design and governance of our "
            "multi-cloud infrastructure strategy. You'll define architectural standards, evaluate new cloud "
            "services, and work directly with engineering teams to build secure, cost-optimized, and scalable "
            "cloud-native solutions.\n\n"
            "Responsibilities:\n"
            "• Design cloud architecture for high-availability, disaster recovery, and multi-region deployments\n"
            "• Define and enforce cloud governance policies, security baselines, and cost controls\n"
            "• Lead cloud migration initiatives from on-premises to AWS/GCP/Azure\n"
            "• Evaluate and adopt new cloud services, serverless, and managed offerings\n"
            "• Create reference architectures, technical documentation, and runbooks\n"
            "• Mentor engineering teams on cloud-native design patterns and best practices"
        ),
        "required_skills": [
            "aws", "gcp", "azure", "networking", "security",
            "terraform", "kubernetes", "microservices", "system design",
            "linux"
        ],
        "preferred_skills": [
            "serverless", "cost optimization", "compliance",
            "multi-cloud", "disaster recovery", "python", "golang",
            "architecture documentation"
        ],
        "min_experience": 7,
        "location": "Remote (US/EU Timezones)",
        "salary_range": "$180,000 – $250,000",
        "job_type": "full-time",
    },
    {
        "title": "AI/ML Intern — GenAI & NLP",
        "company": "InnovateLab AI",
        "description": (
            "Exciting internship opportunity for students or recent graduates passionate about Generative AI "
            "and Natural Language Processing! You'll work alongside senior ML engineers on real products, "
            "contributing to LLM fine-tuning, RAG pipeline development, and prompt engineering experiments.\n\n"
            "Responsibilities:\n"
            "• Assist in developing and evaluating LLM-based features (summarization, Q&A, classification)\n"
            "• Build and iterate on Retrieval-Augmented Generation (RAG) pipelines\n"
            "• Conduct prompt engineering experiments and document best practices\n"
            "• Preprocess and curate datasets for model training and evaluation\n"
            "• Write clean, well-documented Python code with proper testing\n"
            "• Present findings and demos to the team in weekly sprint reviews"
        ),
        "required_skills": [
            "python", "machine learning", "nlp", "deep learning",
            "git", "linux"
        ],
        "preferred_skills": [
            "pytorch", "hugging face", "langchain", "rag",
            "prompt engineering", "docker", "sql", "statistics"
        ],
        "min_experience": 0,
        "location": "San Francisco, CA / Remote",
        "salary_range": "$40/hr – $55/hr",
        "job_type": "internship",
    },
]


async def seed():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "resumeiq")

    print(f"Connecting to MongoDB: {db_name}")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    try:
        await client.admin.command("ping")
        print("✅ Connected to MongoDB\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # ── 1. Drop all collections ──────────────────────────────────
    print("🗑️  Dropping all collections...")
    for col in ["users", "resumes", "jobs", "applications"]:
        count = await db[col].count_documents({})
        await db[col].delete_many({})
        print(f"   {col}: deleted {count} document(s)")
    print()

    # ── 2. Recreate indexes ──────────────────────────────────────
    print("📑 Recreating indexes...")
    await db.users.create_index("email", unique=True)
    await db.resumes.create_index("user_id")
    await db.resumes.create_index("skills")
    await db.resumes.create_index([("user_id", 1), ("created_at", -1)])
    await db.jobs.create_index("created_by")
    await db.jobs.create_index("status")
    await db.jobs.create_index([("created_by", 1), ("created_at", -1)])
    await db.applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    await db.applications.create_index([("job_id", 1), ("match_score", -1)])
    await db.applications.create_index([("recruiter_id", 1), ("applied_at", -1)])
    print("   ✅ Indexes created\n")

    # ── 3. Create accounts ───────────────────────────────────────
    print("👤 Creating accounts...")
    recruiter_result = await db.users.insert_one(RECRUITER)
    recruiter_id = str(recruiter_result.inserted_id)
    print(f"   Recruiter: {RECRUITER['email']} (id: {recruiter_id})")

    candidate_result = await db.users.insert_one(CANDIDATE)
    candidate_id = str(candidate_result.inserted_id)
    print(f"   Candidate: {CANDIDATE['email']} (id: {candidate_id})")
    print()

    # ── 4. Create job postings ───────────────────────────────────
    print("💼 Creating job postings...")
    base_time = datetime.now(timezone.utc)
    for i, job in enumerate(JOBS):
        doc = {
            **job,
            "status": "open",
            "embedding": [],         # Will be computed on first match/access
            "embedding_dim": 0,
            "created_by": recruiter_id,
            "created_at": base_time - timedelta(hours=i * 6),  # Stagger creation times
        }
        result = await db.jobs.insert_one(doc)
        print(f"   ✅ {job['title']} @ {job['company']} (id: {result.inserted_id})")

    print()
    print("=" * 60)
    print("🎉 Seed complete! Here are your login credentials:")
    print("=" * 60)
    print()
    print("  RECRUITER ACCOUNT:")
    print("    Email:    recruiter@resumeiq.com")
    print("    Password: Password123!")
    print()
    print("  CANDIDATE ACCOUNT:")
    print("    Email:    candidate@resumeiq.com")
    print("    Password: Password123!")
    print()
    print(f"  Total jobs created: {len(JOBS)}")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
