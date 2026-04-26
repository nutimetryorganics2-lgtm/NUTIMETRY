import cloudinary
import cloudinary.uploader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Parse CLOUDINARY_URL or manual config
# CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# Configure Cloudinary
if settings.CLOUDINARY_URL:
    try:
        # Standard way: cloudinary_url=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
        import re
        pattern = r"cloudinary://(?P<api_key>.*?):(?P<api_secret>.*?)@(?P<cloud_name>.*)"
        match = re.match(pattern, settings.CLOUDINARY_URL)
        
        if match:
            config = match.groupdict()
            cloudinary.config(
                cloud_name=config['cloud_name'],
                api_key=config['api_key'],
                api_secret=config['api_secret'],
                secure=True
            )
        else:
            # Fallback to direct URL config if pattern doesn't match exactly
            cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
            
        logger.info(f"Cloudinary configured for cloud: {cloudinary.config().cloud_name}")
    except Exception as e:
        logger.error(f"Failed to configure Cloudinary: {e}")
else:
    logger.warning("CLOUDINARY_URL not set in environment.")

async def upload_image(file_content, folder="products"):
    """
    Uploads a file to Cloudinary and returns the secure URL.
    """
    try:
        if not settings.CLOUDINARY_URL:
            logger.error("Attempted upload without CLOUDINARY_URL")
            return None
            
        import asyncio
        result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            file_content,
            folder=folder,
            resource_type="auto",
            fetch_format="auto",
            quality="auto"
        )
        # We can also generate a specific transformation URL if needed
        # but Cloudinary's 'f_auto,q_auto' in the result is usually enough.
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None

def validate_cloudinary_config():
    return bool(settings.CLOUDINARY_URL)
