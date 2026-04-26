import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv(dotenv_path="backend/.env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def update_admin():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["nutrimetry_db"]
    
    # New Admin Profile
    new_email = "admin@nutimetryorganics.com"
    new_hashed_password = get_password_hash("admin123")
    
    result = await db["users"].update_one(
        {"role": "admin"},
        {"$set": {
            "email": new_email,
            "hashed_password": new_hashed_password,
            "name": "Super Admin"
        }}
    )
    
    if result.modified_count > 0:
        print(f"Admin updated to {new_email} with password 'admin123'")
    else:
        # If no admin exists, create one
        admin_doc = {
            "role": "admin",
            "email": new_email,
            "hashed_password": new_hashed_password,
            "name": "Super Admin"
        }
        await db["users"].insert_one(admin_doc)
        print(f"Admin created: {new_email} / admin123")

if __name__ == "__main__":
    asyncio.run(update_admin())
