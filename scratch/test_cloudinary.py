import os
import asyncio
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

cloudinary_url = os.getenv("CLOUDINARY_URL")
if not cloudinary_url:
    print("CLOUDINARY_URL not found in .env")
    exit(1)

cloudinary.config(cloudinary_url=cloudinary_url)

async def test_upload():
    print(f"Cloudinary Cloud Name: {cloudinary.config().cloud_name}")
    # Create a dummy image file
    with open("test_image.txt", "w") as f:
        f.write("test content")
    
    try:
        result = cloudinary.uploader.upload("test_image.txt", folder="test")
        print(f"Upload successful: {result.get('secure_url')}")
    except Exception as e:
        print(f"Upload failed: {e}")
    finally:
        if os.path.exists("test_image.txt"):
            os.remove("test_image.txt")

if __name__ == "__main__":
    asyncio.run(test_upload())
