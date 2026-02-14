"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Authentication Models
# ============================================================================

class UserRegister(BaseModel):
    """User registration request"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=100)
    account_no: str = Field(..., min_length=10, max_length=20)
    mobile: str = Field(..., pattern=r"^\+?\d{10,15}$")
    face_embedding: Optional[List[float]] = None  # 128-dim array
    
    @validator('face_embedding')
    def validate_embedding(cls, v):
        if v is not None and len(v) != 128:
            raise ValueError('Face embedding must be 128-dimensional')
        return v


class UserLogin(BaseModel):
    """Manual login request"""
    username: str
    password: str
    device_fingerprint: str
    ip_address: str
    user_agent: str


class FaceAutoLogin(BaseModel):
    """Face-based auto-login request"""
    face_embedding: List[float] = Field(..., min_length=128, max_length=128)
    device_fingerprint: str
    ip_address: str
    user_agent: str


class AutoLoginResponse(BaseModel):
    """Response for face-based auto-login identification"""
    username: str
    name: str
    message: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_facial_captcha: bool = True


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


# ============================================================================
# Facial CAPTCHA Models
# ============================================================================

class FacialCaptchaChallenge(BaseModel):
    """Facial CAPTCHA challenge response"""
    challenge_id: str
    challenge_type: str
    instruction: str
    time_limit: int
    generated_at: str


class FacialCaptchaVerifyRequest(BaseModel):
    """Facial CAPTCHA verification request"""
    challenge_id: str
    challenge_type: str
    challenge_result: bool  # Did user complete the action?
    timing_seconds: float
    liveness_score: float  # 0-1
    face_embedding: List[float] = Field(..., min_length=128, max_length=128)


class FacialCaptchaVerifyResponse(BaseModel):
    """Facial CAPTCHA verification response"""
    success: bool
    verdict: str  # PASS | HIGH_RISK | FAIL
    face_matched: bool
    liveness_verified: bool
    message: str
    new_threat_score: Optional[float] = None


# ============================================================================
# Continuous Monitoring Models
# ============================================================================

class BehavioralSignals(BaseModel):
    """Behavioral signals from frontend heartbeat"""
    keystroke_avg: Optional[float] = None
    keystroke_variance: Optional[float] = None
    keystroke_deviation: Optional[float] = 0.0
    mouse_speed_avg: Optional[float] = None
    mouse_deviation: Optional[float] = 0.0
    face_present: Optional[bool] = None
    multiple_faces: Optional[bool] = False
    camera_ready: Optional[bool] = False
    camera_blocked: Optional[bool] = False
    device_fingerprint: str
    ip_address: str
    facial_captcha_failed: Optional[int] = 0
    
    # New fields for enhanced security
    live_face_embedding: Optional[List[float]] = None  # 128-dim vector for continuous face verification
    mouse_entropy: Optional[float] = 0.0  # Shannon entropy of mouse movements (bot detection)
    mouse_velocity_variance: Optional[float] = 0.0  # Variance in mouse velocity (bot detection)


class HeartbeatRequest(BaseModel):
    """Heartbeat request with behavioral signals"""
    signals: BehavioralSignals


class ThreatScoreResponse(BaseModel):
    """Threat score response"""
    score: float
    breakdown: dict
    triggers: List[str]
    recommended_action: str
    timestamp: str
    requires_facial_captcha: bool = False


# ============================================================================
# Banking Models
# ============================================================================

class AccountBalanceResponse(BaseModel):
    """Account balance response"""
    account_no: str
    balance: float
    currency: str = "USD"


class Transaction(BaseModel):
    """Transaction model"""
    transaction_id: str
    type: str  # CREDIT | DEBIT
    amount: float
    description: str
    timestamp: datetime
    balance_after: float


class PaymentRequest(BaseModel):
    """Payment/transfer request"""
    recipient_account: str
    amount: float = Field(..., gt=0)
    description: str


class PaymentResponse(BaseModel):
    """Payment response"""
    success: bool
    transaction_id: Optional[str] = None
    message: str
    new_balance: Optional[float] = None


# ============================================================================
# Session Models
# ============================================================================

class SessionInfo(BaseModel):
    """Session information"""
    session_id: str
    user_id: str
    created_at: str
    threat_score: float
    is_locked: bool
