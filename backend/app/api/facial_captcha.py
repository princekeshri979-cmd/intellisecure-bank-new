"""
Facial CAPTCHA API Endpoints

Handles challenge generation and verification for facial CAPTCHA system.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from ..core.database import get_database
from ..core.security import decode_token
from ..core.liveness_detector import (
    generate_challenge, verify_liveness, validate_challenge_history,
    record_challenge_attempt, get_recent_failures
)
from ..core.face_verification import (
    is_face_recognition_available, verify_face_match, validate_embedding_quality
)
from ..core.config import settings
from ..api.models import (
    FacialCaptchaChallenge, FacialCaptchaVerifyRequest, FacialCaptchaVerifyResponse
)

router = APIRouter(prefix="/api/facial-captcha", tags=["Facial CAPTCHA"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current authenticated user and session from token"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"[Auth] Authorization header: {authorization[:50] if authorization else 'None'}")
    
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("[Auth] Missing or invalid authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication"
        )
    
    token = authorization.split(" ")[1]
    logger.info(f"[Auth] Token extracted, length: {len(token)}")
    
    payload = decode_token(token)
    
    if not payload:
        logger.warning("[Auth] Token decode failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    logger.info(f"[Auth] User ID from token: {user_id}")
    
    # Convert string ID to ObjectId for MongoDB query
    from bson import ObjectId
    try:
        object_id = ObjectId(user_id)
        session_object_id = ObjectId(session_id) if session_id else None
        logger.info(f"[Auth] Converted to ObjectId: {object_id}")
    except Exception as e:
        logger.error(f"[Auth] ObjectId conversion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID"
        )
    
    user = await db.users.find_one({"_id": object_id})
    session = await db.sessions.find_one({"_id": session_object_id}) if session_object_id else None
    
    if not user:
        logger.warning(f"[Auth] User not found for ID: {object_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not session:
        logger.warning(f"[Auth] Session not found for ID: {session_object_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active session found"
        )
    
    logger.info(f"[Auth] User authenticated: {user.get('username')}")
    return {"user": user, "session": session}


@router.get("/challenge", response_model=FacialCaptchaChallenge)
async def get_challenge(
    current: dict = Depends(get_current_user)
):
    """
    Generate a random facial CAPTCHA challenge
    """
    challenge = generate_challenge()
    return FacialCaptchaChallenge(**challenge)


@router.post("/verify", response_model=FacialCaptchaVerifyResponse)
async def verify_challenge(
    verification: FacialCaptchaVerifyRequest,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Verify facial CAPTCHA challenge response
    
    Decision logic:
    - PASS: face_match AND liveness_verified
    - HIGH_RISK: face_match AND NOT liveness_verified
    - FAIL: NOT face_match
    """
    user = current["user"]
    session = current["session"]
    user_id = str(user["_id"])
    
    # Check if already used (prevent replay)
    is_valid_challenge = await validate_challenge_history(
        db, user_id, verification.challenge_id
    )
    
    if not is_valid_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge already used or invalid"
        )
    
    # Check recent failures (rate limiting)
    recent_failures = await get_recent_failures(db, user_id, window_minutes=10)
    if recent_failures >= settings.MAX_CAPTCHA_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Account temporarily locked."
        )
    
    # Validate embedding
    is_valid_embedding, error_msg = validate_embedding_quality(verification.face_embedding)
    if not is_valid_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid face embedding: {error_msg}"
        )
    
    # Step 1: Verify liveness
    liveness_result = verify_liveness(
        challenge_result=verification.challenge_result,
        timing_seconds=verification.timing_seconds,
        liveness_score=verification.liveness_score,
        challenge_type=verification.challenge_type
    )
    
    liveness_verified = liveness_result["verified"]
    
    # Step 2: Verify face match
    face_matched = False
    verdict = "FAIL"
    
    if not user.get("face_embedding_encrypted"):
        # No face enrolled, skip face matching
        face_matched = True  # Allow if no face enrolled yet
    else:
        if is_face_recognition_available():
            match_result, similarity, match_verdict = verify_face_match(
                verification.face_embedding,
                user["face_embedding_encrypted"]
            )
            face_matched = match_result
        else:
            # Face recognition not available, use liveness only
            face_matched = True
    
    # Step 3: Determine final verdict
    if face_matched and liveness_verified:
        verdict = "PASS"
        success = True
        message = "Facial CAPTCHA verified successfully"
        
        # Update session
        await db.sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {
                    "requires_facial_captcha": False,
                    "is_locked": False
                }
            }
        )
    
    elif face_matched and not liveness_verified:
        verdict = "HIGH_RISK"
        success = False
        message = f"Liveness verification failed: {liveness_result['reason']}"
        
        # Apply penalty to threat score
        current_threat = session.get("threat_score", 0)
        new_threat = min(current_threat + 45, 100)
        
        await db.sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {"threat_score": new_threat}}
        )
    
    else:
        verdict = "FAIL"
        success = False
        message = "Face verification failed"
        
        # Apply penalty and potentially lock session
        current_threat = session.get("threat_score", 0)
        new_threat = min(current_threat + 45, 100)
        
        should_lock = new_threat >= settings.THREAT_LOCK_THRESHOLD
        
        await db.sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {
                    "threat_score": new_threat,
                    "is_locked": should_lock
                }
            }
        )
    
    # Record attempt
    await record_challenge_attempt(
        db=db,
        user_id=user_id,
        challenge_id=verification.challenge_id,
        challenge_type=verification.challenge_type,
        success=success,
        liveness_verified=liveness_verified,
        face_matched=face_matched
    )
    
    # Get updated threat score
    refreshed_session = await db.sessions.find_one({"_id": session["_id"]})
    new_threat_score = refreshed_session.get("threat_score", 0) if refreshed_session else 0
    
    return FacialCaptchaVerifyResponse(
        success=success,
        verdict=verdict,
        face_matched=face_matched,
        liveness_verified=liveness_verified,
        message=message,
        new_threat_score=new_threat_score
    )
