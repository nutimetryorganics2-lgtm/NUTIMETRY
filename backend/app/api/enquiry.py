from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List
from app.schemas.schemas import EnquiryCreate, EnquiryResponse
from app.api.deps import get_db, get_current_active_admin
from app.services.notification_service import send_enquiry_notification_with_retry
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=dict)
async def create_enquiry(
    enquiry: EnquiryCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        enquiry_dict = enquiry.model_dump()
        enquiry_dict["is_resolved"] = False
        enquiry_dict["email_status"] = "pending"
        enquiry_dict["created_at"] = datetime.utcnow()
        
        result = await db["enquiries"].insert_one(enquiry_dict)
        enquiry_id = str(result.inserted_id)
        enquiry_dict["_id"] = enquiry_id
        
        # Trigger background email
        background_tasks.add_task(send_enquiry_notification_with_retry, enquiry_id)
        
        return {
            "success": True,
            "message": "Enquiry submitted successfully",
            "data": enquiry_dict
        }
    except Exception as e:
        logger.error(f"CREATE_ENQUIRY_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit enquiry")

@router.get("/", response_model=dict)
async def get_enquiries(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        cursor = db["enquiries"].find().sort("created_at", -1).skip(skip).limit(limit)
        enquiries = await cursor.to_list(length=limit)
        for e in enquiries:
            e["_id"] = str(e["_id"])
            
        return {
            "success": True,
            "message": "Enquiries fetched successfully",
            "data": enquiries
        }
    except Exception as e:
        logger.error(f"GET_ENQUIRIES_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch enquiries")

@router.patch("/{enquiry_id}/resolve", response_model=dict)
async def resolve_enquiry(
    enquiry_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_admin=Depends(get_current_active_admin)
):
    try:
        result = await db["enquiries"].update_one(
            {"_id": ObjectId(enquiry_id)},
            {"$set": {"is_resolved": True}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Enquiry not found")
        return {
            "success": True,
            "message": "Enquiry resolved successfully",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RESOLVE_ENQUIRY_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resolve enquiry")
