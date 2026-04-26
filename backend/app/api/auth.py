from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from app.schemas.schemas import UnifiedLogin, FarmerRegister, UserProfile
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_db, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
auth_router = APIRouter()

@auth_router.post("/register")
@limiter.limit("5/minute")
async def register_farmer(request: Request, user_in: FarmerRegister = Body(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    logger.info(f"Farmer registration attempt: {user_in.phone}")
    
    # Check if phone already exists
    existing_user = await db["users"].find_one({"phone": user_in.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    try:
        now = datetime.utcnow()
        user_doc = {
            "role": "farmer",
            "name": user_in.name,
            "phone": user_in.phone,
            "hashed_password": get_password_hash(user_in.password),
            "village": user_in.village,
            "district": user_in.district,
            "state": user_in.state,
            "address": user_in.address,
            "pincode": user_in.pincode,
            "addresses": [], # Initialize empty address list
            "created_at": now,
            "updated_at": now
        }
        
        result = await db["users"].insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        access_token = create_access_token(data={"sub": user_id, "role": "farmer"})
        
        return {
            "success": True,
            "message": "Registration successful",
            "data": {
                "token": access_token,
                "role": "farmer",
                "user_id": user_id,
                "user": {
                    "id": user_id,
                    "role": "farmer",
                    "name": user_in.name,
                    "phone": user_in.phone,
                    "village": user_in.village,
                    "district": user_in.district,
                    "state": user_in.state,
                    "address": user_in.address,
                    "pincode": user_in.pincode,
                    "addresses": []
                }
            }
        }
    except Exception as e:
        logger.error(f"REGISTER_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed due to server error")

@auth_router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, login_data: UnifiedLogin = Body(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    logger.info("Login attempt")
    
    user = None
    if login_data.phone:
        user = await db["users"].find_one({"phone": login_data.phone, "role": "farmer"})
    elif login_data.email:
        user = await db["users"].find_one({"email": login_data.email, "role": "admin"})
        
    if not user or not verify_password(login_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        user_id = str(user["_id"])
        role = user.get("role", "farmer")
        access_token = create_access_token(data={"sub": user_id, "role": role})
        
        user_profile = {
            "id": user_id,
            "role": role,
            "name": user.get("name") or user.get("full_name") or "User",
            "phone": user.get("phone"),
            "email": user.get("email"),
            "village": user.get("village"),
            "district": user.get("district"),
            "state": user.get("state"),
            "address": user.get("address"),
            "pincode": user.get("pincode"),
            "addresses": user.get("addresses", [])
        }

        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "token": access_token,
                "role": role,
                "user_id": user_id,
                "user": user_profile
            }
        }
    except Exception as e:
        logger.error(f"LOGIN_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed due to server error")

@auth_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    try:
        user_profile = {
            "id": str(current_user["_id"]),
            "role": current_user.get("role"),
            "name": current_user.get("name") or current_user.get("full_name") or "User",
            "phone": current_user.get("phone"),
            "email": current_user.get("email"),
            "village": current_user.get("village"),
            "district": current_user.get("district"),
            "state": current_user.get("state"),
            "address": current_user.get("address"),
            "pincode": current_user.get("pincode"),
            "addresses": current_user.get("addresses", [])
        }
            
        return {
            "success": True,
            "message": "User profile fetched",
            "data": {
                "user": user_profile
            }
        }
    except Exception as e:
        logger.error(f"GET_ME_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")

@auth_router.put("/change-password")
async def change_password(
    password_data: dict, # {old_password, new_password}
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    old_pw = password_data.get("old_password")
    new_pw = password_data.get("new_password")
    
    if not old_pw or not new_pw:
        raise HTTPException(status_code=400, detail="Both old and new passwords are required")
        
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    # Verify old password
    if not verify_password(old_pw, current_user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
        
    try:
        new_hashed = get_password_hash(new_pw)
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$set": {"hashed_password": new_hashed, "updated_at": datetime.utcnow()}}
        )
        return {
            "success": True,
            "message": "Password updated successfully",
            "data": None
        }
    except Exception as e:
        logger.error(f"CHANGE_PASSWORD_ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password")
