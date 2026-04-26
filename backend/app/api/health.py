from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", summary="Basic Health Check")
async def health_check():
    """Returns 200 OK for load balancers."""
    return {"status": "ok", "service": "NutimetryOrganic Backend API"}

@router.get("/ready", summary="Readiness Check")
async def readiness_check(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Verifies connection to MongoDB Atlas."""
    try:
        # Ping the database
        await db.command("ping")
        return { "status": "ready" }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return { "status": "error" }
