import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import os

async def try_conn(pwd):
    uri = f"mongodb+srv://bhanunidumol_db_user:{pwd}@nutimtery.iw3frlm.mongodb.net/nutrimetry_db?retryWrites=true&w=majority"
    print(f"Testing password with '{pwd[:2]}...'")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    try:
        await client.admin.command('ping')
        print(f"SUCCESS: Connected with password starting with '{pwd[:2]}'")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False
    finally:
        client.close()

async def main():
    if await try_conn("JILvwLQPkb07XsW7"): # Capital I
        print("Final: JIL is correct")
    elif await try_conn("JlLvwLQPkb07XsW7"): # Lowercase l
        print("Final: JlL is correct")
    else:
        print("Final: Both failed. Still bad auth.")

if __name__ == "__main__":
    asyncio.run(main())
