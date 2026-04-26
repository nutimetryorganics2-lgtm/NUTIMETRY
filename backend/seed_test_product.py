from app.db.session import connect_to_mongo, get_database
import asyncio
from bson import ObjectId

async def seed():
    try:
        await connect_to_mongo()
        db = get_database()
        p = await db['products'].find_one()
        if not p:
            await db['products'].insert_one({
                'name': 'Spirulina Gold',
                'price': 1200,
                'stock': 100,
                'image_url': 'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
                'description': 'Premium Spirulina for Poultry',
                'is_active': True
            })
            print('SUCCESS: Seeded test product')
        else:
            print(f'EXISTS: Found product {p["name"]}')
    except Exception as e:
        print(f'ERROR: {e}')
    finally:
        # Note: session might be closed by close_mongo_connection in connect_to_mongo if called explicitly
        pass

if __name__ == "__main__":
    asyncio.run(seed())
