from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

async def check():
    load_dotenv()
    mongodb_url = os.getenv('MONGODB_URL')
    if not mongodb_url:
        print("MONGODB_URL not found in .env")
        return
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client.nutrimetry_db 
    
    # Check for orders
    print("--- Orders ---")
    async for order in db.orders.find().limit(20):
        print(f"ID: {order.get('order_id')} | Ref: {order.get('reference_id')} | Status: {order.get('status')} | Farmer: {order.get('customer_name')}")
    
    order_count = await db.orders.count_documents({})
    print(f"Total Orders: {order_count}")
    
    # Search for specific one
    target = "NMO-Q9D6IP"
    order = await db.orders.find_one({"order_id": target})
    if not order:
         order = await db.orders.find_one({"reference_id": target})
    
    # Check for enquiries
    print("--- Enquiries ---")
    async for enq in db.enquiries.find().limit(5):
        print(f"Name: {enq.get('name')} | Email: {enq.get('email')} | Message: {enq.get('message')} | Status: {enq.get('status')}")
    
    enq_count = await db.enquiries.count_documents({})
    print(f"Total Enquiries: {enq_count}")

if __name__ == "__main__":
    asyncio.run(check())
