import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_mongo():
    uri = "mongodb://som:som@127.0.0.1:27017/resumeiq?authSource=admin&directConnection=true"
    print(f"Testing connection to: {uri}")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        print("✅ Successfully connected and pinged!")
        
        db = client["resumeiq"]
        collections = await db.list_collection_names()
        print(f"Collections in 'resumeiq': {collections}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mongo())
