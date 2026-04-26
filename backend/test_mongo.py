import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import certifi

load_dotenv()

async def test_connection():
    uri = os.getenv("MONGODB_URL")
    print(f"Testing connection to Atlas cluster...")
    # Using certifi for CA certificates
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    try:
        await client.admin.command('ping')
        print("SUCCESS: Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"FAILED: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
