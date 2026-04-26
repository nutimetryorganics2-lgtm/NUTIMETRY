from fastapi import APIRouter, Depends, HTTPException
from app.schemas.schemas import ContentUpdate
from app.api.deps import get_db, get_current_active_admin
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/{section}", response_model=dict)
async def get_content(section: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        content = await db["content"].find_one({"section": section})
        if not content:
            # Return empty data instead of 404 to avoid breaking frontend on initial load
            return {
                "success": True,
                "message": "Section not found, returning default",
                "data": {"section": section, "data": {}}
            }
        content["_id"] = str(content["_id"])
        return {
            "success": True,
            "message": "Content fetched successfully",
            "data": content
        }
    except Exception as e:
        logger.error(f"GET_CONTENT_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch content")

@router.post("/", response_model=dict)
async def update_content(
    content: ContentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        await db["content"].update_one(
            {"section": content.section},
            {"$set": {"data": content.data}},
            upsert=True
        )
        return {
            "success": True,
            "message": f"Content for {content.section} updated successfully",
            "data": None
        }
    except Exception as e:
        logger.error(f"UPDATE_CONTENT_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update content")
