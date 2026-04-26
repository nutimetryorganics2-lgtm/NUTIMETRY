import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def purge_production_data():
    """
    Purges all non-admin test data from MongoDB.
    Removes: all orders, all enquiries, and all non-admin users.
    """
    print("--- Initializing Production-Ready MongoDB Purge ---")
    
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = "nutrimetry_db"
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    try:
        # 1. Purge Orders
        print("Purging 'orders' collection...")
        order_result = await db["orders"].delete_many({})
        print(f"SUCCESS: Removed {order_result.deleted_count} test orders.")
        
        # 2. Purge Enquiries
        print("Purging 'enquiries' collection...")
        enquiry_result = await db["enquiries"].delete_many({})
        print(f"SUCCESS: Removed {enquiry_result.deleted_count} test enquiries.")
        
        # 3. Purge Non-Admin Users
        print("Purging all non-admin farmer accounts...")
        # Note: In our MongoDB schema, admin has role 'admin'
        user_result = await db["users"].delete_many({"role": {"$ne": "admin"}})
        print(f"SUCCESS: Removed {user_result.deleted_count} test user accounts.")
        
        # 4. Verify Admin
        admin = await db["users"].find_one({"role": "admin"})
        if admin:
            print(f"Admin account preserved: {admin.get('email')}")
        else:
            print("WARNING: No admin account found! Please run 'python backend/reset_admin.py' to create one.")
            
        print("\nDATABASE CLEANED SUCCESSFULLY. The system is now in a pristine state for real users.")
        
    except Exception as e:
        print(f"ERROR during purge: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(purge_production_data())
