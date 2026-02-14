"""
Active Liveness Detection Module

Implements randomized facial challenges to prevent spoofing attacks.
Used in facial CAPTCHA system for production-grade security.
"""

import random
from enum import Enum
from typing import Dict, Optional
from datetime import datetime


class ChallengeType(str, Enum):
    """Types of liveness challenges"""
    BLINK_EYES = "BLINK_EYES"
    TURN_HEAD_LEFT = "TURN_HEAD_LEFT"
    TURN_HEAD_RIGHT = "TURN_HEAD_RIGHT"
    SMILE = "SMILE"
    RAISE_EYEBROWS = "RAISE_EYEBROWS"
    FOLLOW_DOT = "FOLLOW_DOT"


# Challenge instructions for frontend display
CHALLENGE_INSTRUCTIONS = {
    ChallengeType.BLINK_EYES: "Blink Your Eyes",
    ChallengeType.TURN_HEAD_LEFT: "Turn Your Head Left",
    ChallengeType.TURN_HEAD_RIGHT: "Turn Your Head Right",
    ChallengeType.SMILE: "Smile",
    ChallengeType.RAISE_EYEBROWS: "Raise Your Eyebrows",
    ChallengeType.FOLLOW_DOT: "Follow the Moving Dot with Your Eyes"
}


def generate_challenge() -> Dict:
    """
    Generate a random liveness challenge
    
    Returns:
        Dictionary with challenge details:
        - challenge_type: The type of challenge
        - instruction: User-facing instruction
        - time_limit: Time limit in seconds
        - challenge_id: Unique ID for this challenge
    """
    challenge_type = random.choice(list(ChallengeType))
    time_limit = random.randint(5, 8)  # 5-8 seconds per challenge
    
    challenge_id = f"{challenge_type.value}_{int(datetime.utcnow().timestamp() * 1000)}"
    
    return {
        "challenge_id": challenge_id,
        "challenge_type": challenge_type.value,
        "instruction": CHALLENGE_INSTRUCTIONS[challenge_type],
        "time_limit": time_limit,
        "generated_at": datetime.utcnow().isoformat()
    }


def verify_liveness(
    challenge_result: bool,
    timing_seconds: float,
    liveness_score: float,
    challenge_type: str
) -> Dict:
    """
    Verify liveness based on challenge response
    
    Args:
        challenge_result: Did the user complete the action?
        timing_seconds: How long it took (must be within time_limit)
        liveness_score: Confidence score from frontend (0-1)
        challenge_type: Type of challenge that was performed
    
    Returns:
        Dictionary with verification results:
        - verified: Boolean indicating if liveness passed
        - confidence: Confidence score
        - reason: Explanation
    """
    reasons = []
    
    # Check action completion
    if not challenge_result:
        return {
            "verified": False,
            "confidence": 0.0,
            "reason": "Challenge action not completed"
        }
    
    # Check timing (must complete within 8 seconds, not too fast)
    if timing_seconds > 8.0:
        reasons.append("Response too slow (timeout)")
    
    if timing_seconds < 0.5:
        reasons.append("Response too fast (suspicious)")
    
    # Check liveness score from frontend
    if liveness_score < 0.7:
        reasons.append(f"Low liveness confidence: {liveness_score:.2f}")
    
    # Overall verification
    if reasons:
        return {
            "verified": False,
            "confidence": liveness_score,
            "reason": "; ".join(reasons)
        }
    
    return {
        "verified": True,
        "confidence": liveness_score,
        "reason": "Liveness verified successfully"
    }


def calculate_liveness_score(
    action_detected: bool,
    motion_consistency: float,
    face_quality: float,
    timing_valid: bool
) -> float:
    """
    Calculate overall liveness score from multiple factors
    (This can be called from backend if processing landmarks)
    
    Args:
        action_detected: Was the required action detected?
        motion_consistency: Consistency of facial motion (0-1)
        face_quality: Quality of face detection (0-1)
        timing_valid: Was timing within acceptable range?
    
    Returns:
        Liveness score between 0 and 1
    """
    score = 0.0
    
    if action_detected:
        score += 0.4
    
    score += motion_consistency * 0.3
    score += face_quality * 0.2
    
    if timing_valid:
        score += 0.1
    
    return min(score, 1.0)


async def validate_challenge_history(
    db,
    user_id: str,
    challenge_id: str
) -> bool:
    """
    Check if challenge has already been used (prevent replay attacks)
    
    Args:
        db: Database instance
        user_id: User identifier
        challenge_id: Challenge ID to check
    
    Returns:
        True if challenge is valid (not used before), False otherwise
    """
    # Check if this challenge ID was already used
    existing = await db.facial_captcha_history.find_one({
        "user_id": user_id,
        "challenge_id": challenge_id
    })
    
    return existing is None


async def record_challenge_attempt(
    db,
    user_id: str,
    challenge_id: str,
    challenge_type: str,
    success: bool,
    liveness_verified: bool,
    face_matched: bool
):
    """
    Record facial CAPTCHA attempt in database
    
    Args:
        db: Database instance
        user_id: User identifier
        challenge_id: Challenge ID
        challenge_type: Type of challenge
        success: Overall success
        liveness_verified: Liveness check result
        face_matched: Face matching result
    """
    await db.facial_captcha_history.insert_one({
        "user_id": user_id,
        "challenge_id": challenge_id,
        "challenge_type": challenge_type,
        "success": success,
        "liveness_verified": liveness_verified,
        "face_matched": face_matched,
        "timestamp": datetime.utcnow()
    })


async def get_recent_failures(db, user_id: str, window_minutes: int = 10) -> int:
    """
    Count recent failed attempts (for rate limiting)
    
    Args:
        db: Database instance
        user_id: User identifier
        window_minutes: Time window to check
    
    Returns:
        Number of failed attempts in the time window
    """
    from datetime import timedelta
    
    cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
    
    count = await db.facial_captcha_history.count_documents({
        "user_id": user_id,
        "success": False,
        "timestamp": {"$gte": cutoff_time}
    })
    
    return count
