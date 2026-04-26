import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "nutrimetry_db"

async def seed_products():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    products = [
        {
            "name": "Spirulina Gold (Starter)",
            "description": "Highly bioavailable spirulina optimized for young chicks. Boosts early immunity and appetite.",
            "price": 1250,
            "stock": 500,
            "image_url": "https://images.unsplash.com/photo-1612170153139-6f881ff067e0?auto=format&fit=crop&q=80&w=600",
            "is_active": True
        },
        {
            "name": "Spirulina Max (Grower)",
            "description": "Growth-accelerating formulation for optimal FCR. Ideal for 15-28 day birds.",
            "price": 2100,
            "stock": 300,
            "image_url": "https://images.unsplash.com/photo-1598331668826-20cecc596b86?auto=format&fit=crop&q=80&w=600",
            "is_active": True
        }
    ]
    
    for product in products:
        await db["products"].update_one(
            {"name": product["name"]},
            {"$set": product},
            upsert=True
        )
    
    print("Database seeded with products!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_products())
