from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging
import sys
import certifi

logger = logging.getLogger("db")

class Database:
    client: AsyncIOMotorClient = None
    db_name: str = "nutrimetry_db"

db = Database()

async def connect_to_mongo():
    """Establish connection to MongoDB Atlas."""
    try:
        logger.info("Connecting to MongoDB Atlas...")
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where()
        )
        # Verify connection
        await db.client.admin.command("ping")
        logger.info("Successfully connected to MongoDB Atlas!")
        
        # Initialize indexes or other setup here if needed
        database = db.client[db.db_name]
        await database["orders"].create_index([("created_at", -1)], background=True)
        await database["orders"].create_index(
            [("idempotency_key", 1)], 
            unique=True, 
            sparse=True, 
            background=True
        )
        
    except Exception as e:
        logger.critical(f"Database connection error: {e}")
        sys.exit(1)

async def close_mongo_connection():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    """Return database instance."""
    if db.client is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo first.")
    return db.client[db.db_name]

def get_collection(collection_name: str):
    """Return specific collection."""
    return get_database()[collection_name]
