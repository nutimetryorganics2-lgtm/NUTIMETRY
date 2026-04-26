import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
from passlib.context import CryptContext

if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("backend/.env"):
    load_dotenv("backend/.env")
else:
    load_dotenv() # Try system env or default

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def seed_admin():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    print(f"Connecting to MongoDB: {mongodb_url.split('@')[-1]}") # Log without credentials
    db_name = "nutrimetry_db"
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    print("Fetching admin...")
    
    admin_email = "nutimetryorganics@gmail.com"
    admin_password = "Nutimetry"
    
    admin_doc = {
        "role": "admin",
        "name": "Super Admin",
        "email": admin_email,
        "hashed_password": get_password_hash(admin_password),
        "address": "Nutrimerty Organics HQ",
        "village": "Guntur City",
        "district": "Guntur",
        "state": "Andhra Pradesh",
        "pincode": "522001",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db["users"].update_one(
        {"email": admin_email},
        {"$set": admin_doc},
        upsert=True
    )
    print("--------------------------------------------------")
    print("DONE: ADMIN USER SEEDED/UPDATED SUCCESSFULLY")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(seed_admin())
