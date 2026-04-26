import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv(dotenv_path="backend/.env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def reset_admin_password():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["nutrimetry_db"]
    hashed_password = get_password_hash("admin123")
    result = await db["users"].update_one(
        {"role": "admin"},
        {"$set": {"hashed_password": hashed_password}}
    )
    if result.modified_count > 0:
        print("Admin password reset to 'admin123' successfully!")
    else:
        print("Failed to reset admin password or admin not found.")

if __name__ == "__main__":
    asyncio.run(reset_admin_password())
