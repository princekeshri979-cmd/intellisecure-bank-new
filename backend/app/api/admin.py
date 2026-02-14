from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional
from ..core.database import get_database

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class NotificationUpdate(BaseModel):
    message: str

class SliderImage(BaseModel):
    url: str
    title: str

class SliderUpdate(BaseModel):
    images: List[SliderImage]

@router.get("/notification")
async def get_notification(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get current notification banner text"""
    settings = await db.admin_settings.find_one({"type": "notification"})
    return {"message": settings["message"] if settings else "Welcome to IntelliSecure Bank!"}

@router.post("/notification")
async def update_notification(
    update: NotificationUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update notification banner"""
    await db.admin_settings.update_one(
        {"type": "notification"},
        {"$set": {"message": update.message, "type": "notification"}},
        upsert=True
    )
    return {"success": True, "message": "Notification updated"}

@router.get("/slider-images")
async def get_slider_images(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get slider images"""
    settings = await db.admin_settings.find_one({"type": "slider"})
    default_images = [
        {"url": "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1920&q=80", "title": "Secure Banking"},
        {"url": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80", "title": "Future of Finance"},
        {"url": "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=1920&q=80", "title": "Easy Payments"},
    ]
    return {"images": settings["images"] if settings else default_images}

@router.post("/slider-images")
async def update_slider_images(
    update: SliderUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update slider images"""
    await db.admin_settings.update_one(
        {"type": "slider"},
        {"$set": {"images": [img.dict() for img in update.images], "type": "slider"}},
        upsert=True
    )
    return {"success": True, "message": "Slider images updated"}
