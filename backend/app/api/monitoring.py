"""
Continuous Monitoring API

Handles behavioral heartbeat signals and threat score calculation.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from ..core.database import get_database
from ..core.security import decode_token, decrypt_embedding
from ..core.threat_engine import ThreatEngine
from ..core.config import settings
from ..api.models import HeartbeatRequest, ThreatScoreResponse

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])

@router.get("/ping")
async def ping():
    return {"status": "ok", "message": "Monitoring router is active"}


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current authenticated user"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    
    # Convert string IDs to ObjectId for MongoDB query
    from bson import ObjectId
    try:
        user_object_id = ObjectId(user_id)
        session_object_id = ObjectId(session_id) if session_id else None
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID"
        )
    
    user = await db.users.find_one({"_id": user_object_id})
    session = await db.sessions.find_one({"_id": session_object_id}) if session_object_id else None
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"user": user, "session": session}


@router.post("/heartbeat", response_model=ThreatScoreResponse)
async def process_heartbeat(
    heartbeat: HeartbeatRequest,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Process behavioral heartbeat signals and calculate threat score
    Triggers actions based on threat level
    """
    user = current["user"]
    session = current["session"]
    
    if not session:
        print(f"DEBUG: Session failed for user {user.get('_id')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active session found"
        )
    
    # Check if session is locked
    if session.get("is_locked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session is locked. Please complete facial CAPTCHA."
        )
    
    # Prepare session data
    stored_face_embedding = None
    if user.get("face_embedding_encrypted"):
        try:
            stored_face_embedding = decrypt_embedding(user.get("face_embedding_encrypted"))
        except Exception as e:
            print(f"Failed to decrypt stored face embedding: {e}")

    session_data = {
        "device_fingerprint": session.get("device_fingerprint"),
        "ip_address": session.get("ip_address"),
        "browser_signature": session.get("browser_signature"),
        "created_at": session.get("created_at"),
        "stored_face_embedding": stored_face_embedding
    }
    
    # Current signals from heartbeat
    camera_ready = heartbeat.signals.camera_ready is True
    current_signals = {
        "device_fingerprint": heartbeat.signals.device_fingerprint,
        "ip_address": heartbeat.signals.ip_address,
        "keystroke_deviation": heartbeat.signals.keystroke_deviation,
        "mouse_deviation": heartbeat.signals.mouse_deviation,
        "face_present": heartbeat.signals.face_present if camera_ready else None,
        "multiple_faces": heartbeat.signals.multiple_faces if camera_ready else False,
        "camera_ready": camera_ready,
        "camera_blocked": heartbeat.signals.camera_blocked,
        "facial_captcha_failed": heartbeat.signals.facial_captcha_failed,
        "mouse_entropy": heartbeat.signals.mouse_entropy,
        "mouse_velocity_variance": heartbeat.signals.mouse_velocity_variance,
        "live_face_embedding": heartbeat.signals.live_face_embedding
    }
    
    # Get ML anomaly score (placeholder - would integrate actual ML model)
    ml_anomaly_score = 0.0  # TODO: Integrate ML model
    
    # Calculate threat score
    threat_result = ThreatEngine.calculate_threat_score(
        session_data=session_data,
        current_signals=current_signals,
        ml_anomaly_score=ml_anomaly_score
    )

    # Track face anomaly streaks (avoid locking on transient frames)
    no_face_streak = session.get("no_face_streak", 0)
    multi_face_streak = session.get("multi_face_streak", 0)

    if camera_ready:
        if heartbeat.signals.face_present is False:
            no_face_streak += 1
        else:
            no_face_streak = 0

        if heartbeat.signals.multiple_faces:
            multi_face_streak += 1
        else:
            multi_face_streak = 0
    else:
        no_face_streak = 0
        multi_face_streak = 0

    # Immediate lock conditions: no face or multiple faces
    force_lock_reasons = []
    NO_FACE_LOCK_STREAK = 5
    MULTI_FACE_LOCK_STREAK = 3
    if camera_ready and no_face_streak >= NO_FACE_LOCK_STREAK:
        force_lock_reasons.append("No face detected")
    if camera_ready and multi_face_streak >= MULTI_FACE_LOCK_STREAK:
        force_lock_reasons.append("Multiple faces detected")

    force_lock = False
    if force_lock_reasons:
        force_lock = True
        for reason in force_lock_reasons:
            if reason not in threat_result["triggers"]:
                threat_result["triggers"].append(reason)
        threat_result["score"] = max(threat_result["score"], settings.THREAT_LOCK_THRESHOLD)
        threat_result["recommended_action"] = "LOCK_SESSION"

    # Force CAPTCHA on live face mismatch even if score is below threshold
    face_mismatch_triggered = "Live face does not match database" in threat_result["triggers"]
    
    # Update session with new threat score
    # Update session with new threat score
    update_data = {
        "threat_score": threat_result["score"],
        "last_heartbeat": threat_result["timestamp"],
        "threat_triggers": threat_result["triggers"],
        "threat_breakdown": threat_result["breakdown"],
        "no_face_streak": no_face_streak,
        "multi_face_streak": multi_face_streak
    }

    # Broadcast threat update via WebSocket - FIXED PARAMETER ORDER
    try:
        from ..sockets.websocket_manager import websocket_manager
        user_id = str(user["_id"])
        # Correct order: send_personal_message(user_id, message)
        await websocket_manager.send_personal_message(
            user_id,
            {
                "type": "threat_update",
                "data": {
                    **threat_result,
                    "requires_facial_captcha": ThreatEngine.should_trigger_facial_captcha(
                        threat_result["score"]
                    ) or force_lock
                }
            }
        )
    except Exception as e:
        print(f"Failed to broadcast threat update: {e}")
    
    # Take action based on threat level
    if force_lock:
        update_data["is_locked"] = True
        update_data["requires_facial_captcha"] = True

    elif threat_result["recommended_action"] == "FORCE_LOGOUT":
        update_data["is_locked"] = True
        await db.sessions.delete_one({"_id": session["_id"]})
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session terminated due to high security risk"
        )
    
    elif threat_result["recommended_action"] == "LOCK_SESSION":
        update_data["is_locked"] = True
        update_data["requires_facial_captcha"] = True

    # Mark CAPTCHA requirement when threat score is high
    requires_captcha = (
        ThreatEngine.should_trigger_facial_captcha(threat_result["score"])
        or face_mismatch_triggered
        or force_lock
    )
    if requires_captcha:
        update_data["requires_facial_captcha"] = True
    
    # Save behavioral data
    await db.behavioral_data.insert_one({
        "user_id": str(user["_id"]),
        "session_id": str(session["_id"]),
        "signals": heartbeat.signals.dict(),
        "threat_score": threat_result["score"],
        "timestamp": threat_result["timestamp"]
    })
    
    # Update session
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": update_data}
    )
    
    return ThreatScoreResponse(
        **threat_result,
        requires_facial_captcha=requires_captcha
    )


@router.get("/threat-score", response_model=ThreatScoreResponse)
async def get_threat_score(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current threat score for session"""
    session = current["session"]
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session"
        )
    
    # Return current threat score from session
    return ThreatScoreResponse(
        score=session.get("threat_score", 0),
        breakdown=session.get("threat_breakdown", {}),
        triggers=session.get("threat_triggers", []),
        recommended_action="CONTINUE",
        timestamp=session.get("last_heartbeat", ""),
        requires_facial_captcha=session.get("requires_facial_captcha", False)
    )
