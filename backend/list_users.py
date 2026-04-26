import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.get_database()
    users = await db["users"].find({}).to_list(length=100)
    print(f"Found {len(users)} users:")
    for u in users:
        print(f"- {u.get('phone') or u.get('email')} ({u.get('role')}) - Name: {u.get('name')}")

if __name__ == "__main__":
    asyncio.run(main())
