import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check():
    mongodb_url = os.getenv("MONGODB_URL")
    print(f"Connecting to {mongodb_url}")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["nutrimetry_db"]
    print("--- PRODUCTS ---")
    async for p in db["products"].find():
        print(p)

if __name__ == "__main__":
    asyncio.run(check())
