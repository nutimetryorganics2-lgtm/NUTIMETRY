from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_db, get_current_user
from app.schemas.schemas import Address, UserProfile
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/addresses", response_model=dict)
async def get_addresses(current_user: dict = Depends(get_current_user)):
    try:
        addresses = current_user.get("addresses", [])
        return {
            "success": True,
            "message": "Addresses fetched successfully",
            "data": addresses
        }
    except Exception as e:
        logger.error(f"FETCH_ADDRESSES_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch addresses")

@router.post("/address", response_model=dict)
async def add_address(address: Address, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # Ensure ID is unique and set if not provided (though default_factory handles it)
        address_dict = address.dict()
        
        # If this is the first address or set as default, handle default logic
        if address.is_default or not current_user.get("addresses"):
            address_dict["is_default"] = True
            # Set all other addresses to not default
            await db["users"].update_one(
                {"_id": current_user["_id"]},
                {"$set": {"addresses.$[].is_default": False}}
            )
        
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$push": {"addresses": address_dict}}
        )
        return {
            "success": True,
            "message": "Address added successfully",
            "data": address_dict
        }
    except Exception as e:
        logger.error(f"ADD_ADDRESS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add address")

@router.put("/address/{address_id}", response_model=dict)
async def update_address(address_id: str, address_update: Address, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        addresses = current_user.get("addresses", [])
        
        found = False
        for i, addr in enumerate(addresses):
            if addr["id"] == address_id:
                # Maintain original ID
                update_data = address_update.dict()
                update_data["id"] = address_id
                
                if update_data["is_default"]:
                    # Set others to False
                    await db["users"].update_one(
                        {"_id": current_user["_id"]},
                        {"$set": {"addresses.$[].is_default": False}}
                    )
                
                await db["users"].update_one(
                    {"_id": current_user["_id"], "addresses.id": address_id},
                    {"$set": {"addresses.$": update_data}}
                )
                return {
                    "success": True,
                    "message": "Address updated successfully",
                    "data": update_data
                }
                
        raise HTTPException(status_code=404, detail="Address not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE_ADDRESS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update address")

@router.delete("/address/{address_id}", response_model=dict)
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        result = await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$pull": {"addresses": {"id": address_id}}}
        )
        if result.modified_count == 0:
             raise HTTPException(status_code=404, detail="Address not found")
             
        return {
            "success": True,
            "message": "Address deleted successfully",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE_ADDRESS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete address")

@router.patch("/address/{address_id}/default", response_model=dict)
async def set_default_address(address_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        # Set all to false
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$set": {"addresses.$[].is_default": False}}
        )
        # Set specific one to true
        result = await db["users"].update_one(
            {"_id": current_user["_id"], "addresses.id": address_id},
            {"$set": {"addresses.$.is_default": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
            
        return {
            "success": True,
            "message": "Default address updated",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SET_DEFAULT_ADDRESS_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to set default address")
