
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def list_products():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.get_database()
    products = await db.products.find().to_list(100)
    print("--- PRODUCTS ---")
    for p in products:
        print(f"ID: {p['_id']}, Name: {p.get('name')}, Price: {p.get('price')}, Stock: {p.get('stock_quantity')}, Image: {p.get('image_url')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(list_products())
