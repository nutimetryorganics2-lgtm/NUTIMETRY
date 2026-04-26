import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_db():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client["nutrimetry_db"]
    
    print("--- USERS ---")
    async for user in db["users"].find():
        print(f"Name: {user.get('name')}, Email: {user.get('email')}, Phone: {user.get('phone')}, Role: {user.get('role')}")
    
    print("\n--- ORDERS ---")
    async for order in db["orders"].find().sort("created_at", -1).limit(5):
        print(f"OrderID: {order.get('order_id')}, Customer: {order.get('customer_name')}, Total: {order.get('total_amount')}, Email Status: {order.get('email_status')}")

if __name__ == "__main__":
    asyncio.run(check_db())
