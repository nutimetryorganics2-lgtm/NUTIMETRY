from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from app.schemas.schemas import Product, ProductCreate
from app.api.deps import get_db, get_current_active_admin
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_products(db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        cursor = db["products"].find({"is_active": True})
        products = await cursor.to_list(length=100)
        
        # Manual serialization of ObjectId to string
        for product in products:
            product["_id"] = str(product["_id"])
            
        return {
            "success": True,
            "message": "Products fetched successfully",
            "data": products
        }
    except Exception as e:
        logger.error(f"GET_PRODUCTS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@router.post("/", response_model=dict)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: Optional[UploadFile] = File(None),
    manual_image_url: Optional[str] = Form(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        from datetime import datetime
        from app.services.cloudinary_service import upload_image

        # Strict Validation
        if not name or price < 0 or stock < 0:
            raise HTTPException(status_code=400, detail="Invalid product data. Name, positive price and stock are required.")

        image_url = None

        # Priority 1: Cloudinary Upload
        if image and image.filename:
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Read file content
            content = await image.read()
            uploaded_url = await upload_image(content)
            
            if uploaded_url:
                image_url = uploaded_url
            else:
                # Fallback to local storage if Cloudinary fails or is not configured
                import os
                import aiofiles
                file_ext = os.path.splitext(image.filename)[1]
                file_name = f"{datetime.now().timestamp()}{file_ext}"
                file_path = os.path.join("static", "uploads", file_name)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                async with aiofiles.open(file_path, mode="wb") as buffer:
                    await buffer.write(content)
                image_url = f"/static/uploads/{file_name}"
                logger.warning(f"Cloudinary upload failed, falling back to local storage for {name}")

        # Priority 2: Manual URL Fallback (if no image uploaded or upload failed)
        if not image_url and manual_image_url:
            # Basic validation of URL
            if not manual_image_url.startswith(("http://", "https://", "/static/")):
                raise HTTPException(status_code=400, detail="Invalid image URL format")
            image_url = manual_image_url

        # Blocker Condition check
        if not image_url:
            raise HTTPException(status_code=400, detail="Product image is required (upload or URL)")

        product_dict = {
            "name": name,
            "description": description,
            "price": price,
            "stock": stock,
            "image_url": image_url,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        result = await db["products"].insert_one(product_dict)
        product_dict["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Product created successfully",
            "data": product_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CREATE_PRODUCT_FATAL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database or Server error: {str(e)}")

@router.delete("/{product_id}")
async def delete_product(
    product_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        # Robust ID handling
        search_query = {}
        try:
            search_query["_id"] = ObjectId(product_id)
        except:
            # Fallback for non-ObjectId IDs if any
            search_query["_id"] = product_id

        logger.info(f"ADMIN_DELETE_REQUEST: Product {product_id}")
        
        # Perform HARD DELETE for production-grade cleaning
        result = await db["products"].delete_one(search_query)
        
        if result.deleted_count == 0:
            logger.warning(f"DELETE_FAILED: Product {product_id} not found")
            raise HTTPException(status_code=404, detail="Product not found in master catalog")
            
        logger.info(f"DELETE_SUCCESS: Product {product_id} removed permanently")
        return {
            "success": True,
            "message": "Product permanently removed from master catalog",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE_PRODUCT_FATAL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error during deletion: {str(e)}")
