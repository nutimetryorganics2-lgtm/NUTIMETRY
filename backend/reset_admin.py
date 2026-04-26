import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def reset_admin():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = "nutrimetry_db"
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    admin_email = "admin@nutrimetry.in"
    admin_password = "AdminPassword2024!"
    
    await db["users"].update_one(
        {"email": admin_email},
        {"$set": {
            "hashed_password": get_password_hash(admin_password),
            "role": "admin",
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    print("--------------------------------------------------")
    print("[SUCCESS] ADMIN CREDENTIALS FINALIZED")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(reset_admin())
