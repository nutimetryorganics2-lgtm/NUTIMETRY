
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def cleanup_products():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.get_database()
    result = await db.products.delete_many({"name": "fish"})
    print(f"Deleted {result.deleted_count} 'fish' products.")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_products())
