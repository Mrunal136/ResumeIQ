import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None
        self._connected = False

    async def connect(self):
        max_retries = 5
        retry_delay = 2

        for attempt in range(1, max_retries + 1):
            try:
                # Debug logging
                masked_uri = settings.MONGODB_URI.replace(
                    settings.MONGODB_URI.split("@")[0].split("://")[1].split(":")[1], "****"
                ) if ":" in settings.MONGODB_URI.split("@")[0] else settings.MONGODB_URI
                print(f"DEBUG: Connecting to MongoDB (Attempt {attempt}): {masked_uri}")

                self.client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=5000,
                )
                self.db = self.client[settings.DATABASE_NAME]
                
                # Ping to verify connectivity
                await self.client.admin.command("ping")
                
                # Create indexes
                await self.db.users.create_index("email", unique=True)
                await self.db.resumes.create_index("user_id")
                await self.db.resumes.create_index("skills")
                await self.db.resumes.create_index([("user_id", 1), ("created_at", -1)])
                await self.db.jobs.create_index("created_by")
                await self.db.jobs.create_index("status")
                await self.db.jobs.create_index([("created_by", 1), ("created_at", -1)])
                await self.db.applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
                await self.db.applications.create_index([("job_id", 1), ("match_score", -1)])
                await self.db.applications.create_index([("recruiter_id", 1), ("applied_at", -1)])
                
                self._connected = True
                print(f"DEBUG: ✅ Connected to MongoDB: {settings.DATABASE_NAME}")
                return
            except Exception as e:
                self._connected = False
                if attempt < max_retries:
                    print(f"DEBUG: ⚠️ MongoDB connection attempt {attempt} failed: {e}. Retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                else:
                    print(f"DEBUG: ❌ MongoDB connection failed after {max_retries} attempts: {e}")
                    logger.error(f"❌ MongoDB connection failed: {e}")

    async def close(self):
        if self.client:
            self.client.close()
            self._connected = False
            print("DEBUG: 🔌 MongoDB connection closed")

    def get_db(self):
        if not self._connected or self.db is None:
            return None
        return self.db

    def is_connected(self) -> bool:
        return self._connected

# Singleton instance
manager = DatabaseManager()

# Compatibility wrappers
async def connect_db():
    await manager.connect()

async def close_db():
    await manager.close()

def get_db():
    return manager.get_db()

def is_db_connected() -> bool:
    return manager.is_connected()
