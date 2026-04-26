from app.db.session import connect_to_mongo, get_database
import asyncio
from bson import ObjectId

async def check():
    try:
        await connect_to_mongo()
        db = get_database()
        o = await db['orders'].find_one({'order_id': 'NMO-AWKJQX'})
        if o:
            print("ORDER_FOUND")
            print(f"ID: {o['order_id']}")
            print(f"Email Status: {o.get('email_status')}")
            print(f"Retry Count: {o.get('retry_count')}")
        else:
            print("ORDER_NOT_FOUND")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check())
