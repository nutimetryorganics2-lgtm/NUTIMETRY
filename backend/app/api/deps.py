from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.db.session import get_database
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_db() -> AsyncIOMotorDatabase:
    return get_database()

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncIOMotorDatabase = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_sub: str = payload.get("sub")
        if user_sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # 1. Try resolving as ObjectId (New behavior)
    if ObjectId.is_valid(user_sub):
        user = await db["users"].find_one({"_id": ObjectId(user_sub)})
        if user: return user
        
    # 2. Try resolving as email (Admin legacy)
    user = await db["users"].find_one({"email": user_sub})
    if user: return user
    
    # 3. Try resolving as phone (Farmer legacy)
    user = await db["users"].find_one({"phone": user_sub})
    if user: return user
    
    raise credentials_exception

async def get_current_active_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or not current_user.get("is_active", True):
        raise HTTPException(status_code=403, detail="The user doesn't have enough privileges")
    return current_user
