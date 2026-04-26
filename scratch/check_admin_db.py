import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

async def check_admin():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["nutrimetry_db"]
    user = await db["users"].find_one({"role": "admin"})
    if user:
        print(f"Found Admin: {user.get('email')} (Name: {user.get('name')})")
    else:
        print("No admin found!")

if __name__ == "__main__":
    asyncio.run(check_admin())
