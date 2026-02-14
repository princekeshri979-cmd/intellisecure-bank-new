"""
Face Verification API

Separate endpoint for continuous face verification.
Compares live face embeddings against stored user embeddings.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from pydantic import BaseModel

from ..core.database import get_database
from ..core.security import decode_token
from ..core.face_verification import calculate_face_distance
from ..sockets.websocket_manager import websocket_manager

router = APIRouter(prefix="/api/face-verification", tags=["Face Verification"])


class FaceVerificationRequest(BaseModel):
    """Request model for face verification"""
    live_embedding: List[float]  # 128-dim face embedding from live camera


class FaceVerificationResponse(BaseModel):
    """Response model for face verification"""
    matched: bool
    distance: float
    threat_increase: int
    message: str


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    
    from bson import ObjectId
    try:
        user_object_id = ObjectId(user_id)
        session_object_id = ObjectId(session_id) if session_id else None
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user or session ID"
        )

    user = await db.users.find_one({"_id": user_object_id})
    session = await db.sessions.find_one({"_id": session_object_id}) if session_object_id else None
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active session found"
        )
    
    return {"user": user, "session": session}


@router.post("/check", response_model=FaceVerificationResponse)
async def verify_face(
    request: FaceVerificationRequest,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Verify live face against stored user embedding
    
    Returns:
    - matched: True if face matches (distance < 0.55)
    - distance: Euclidean distance between embeddings
    - threat_increase: Penalty points to add (50 if mismatch, 0 if match)
    - message: Human-readable result
    """
    user = current["user"]
    session = current["session"]
    
    # Get stored face embedding
    stored_embedding_encrypted = user.get("face_embedding_encrypted")
    
    if not stored_embedding_encrypted:
        return FaceVerificationResponse(
            matched=True,  # No stored embedding, can't verify
            distance=0.0,
            threat_increase=0,
            message="No stored face embedding for comparison"
        )
    
    # Decrypt stored embedding
    from ..core.security import decrypt_embedding
    try:
        stored_embedding = decrypt_embedding(stored_embedding_encrypted)
    except Exception as e:
        print(f"Failed to decrypt face embedding: {e}")
        return FaceVerificationResponse(
            matched=True,  # Decryption failed, don't penalize
            distance=0.0,
            threat_increase=0,
            message="Failed to decrypt stored embedding"
        )
    
    # Calculate distance
    distance = calculate_face_distance(request.live_embedding, stored_embedding)
    
    # Threshold for face match (same as registration/login)
    FACE_MATCH_THRESHOLD = 0.55
    matched = distance < FACE_MATCH_THRESHOLD
    
    # Determine threat increase
    threat_increase = 0 if matched else 50  # High penalty for face mismatch
    
    # Update session threat score if mismatch
    if not matched and session:
        current_threat = session.get("threat_score", 0)
        new_threat = min(100, current_threat + threat_increase)
        
        await db.sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {"threat_score": new_threat},
                "$push": {"threat_triggers": "face_mismatch"}
            }
        )
        
        # Broadcast threat update via WebSocket
        user_id = str(user["_id"])
        await websocket_manager.send_personal_message(
            user_id,
            {
                "type": "threat_update",
                "data": {
                    "score": new_threat,
                    "triggers": ["face_mismatch"],
                    "message": "⚠️ Face mismatch detected!"
                }
            }
        )
    
    return FaceVerificationResponse(
        matched=matched,
        distance=round(distance, 4),
        threat_increase=threat_increase,
        message="Face matched" if matched else "Face mismatch detected"
    )
