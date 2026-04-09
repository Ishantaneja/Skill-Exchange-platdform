from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
client: Optional[AsyncIOMotorClient] = None
db = None


# async def connect_to_mongo():
#     global client, db
#     try:
#         MONGO_URI = os.getenv("MONGO_URI")  # get from .env
#         db_name = "SkillExchangePlatform"
#         client = AsyncIOMotorClient(MONGO_URI)
#         # force a connection attempt to fail fast if MongoDB is down
#         await client.admin.command("ping")
#         db = client[db_name]
#         print(f"[DB] Connected to MongoDB at {url}, database: {db_name}")
#     except Exception as e:
#         print(f"[DB] FAILED to connect to MongoDB at {url}: {e}")
#         raise


# async def close_mongo_connection():
#     global client
#     if client:
#         client.close()
#         print("[DB] MongoDB connection closed")


async def connect_to_mongo():
    global client, db
    try:
        MONGO_URI = os.getenv("MONGO_URI")  # get from .env
        DB_NAME = "SkillExchangePlatform"

        client = AsyncIOMotorClient(MONGO_URI)
        
        # Check connection
        await client.admin.command("ping")

        db = client[DB_NAME]

        print(f"[DB] Connected to MongoDB Atlas 🚀")

    except Exception as e:
        print(f"[DB] FAILED to connect: {e}")
        raise


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")

        