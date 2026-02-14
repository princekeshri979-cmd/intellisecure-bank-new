"""
Authentication API Endpoints

Handles user registration, login (manual & face-based), token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional
import secrets
import logging

logger = logging.getLogger(__name__)

from ..core.database import get_database
from ..core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_token, generate_device_fingerprint, encrypt_embedding
)
from ..core.face_verification import (
    validate_embedding_quality, find_user_by_face
)
from ..api.models import (
    UserRegister, UserLogin, FaceAutoLogin, TokenResponse, RefreshTokenRequest,
    AutoLoginResponse
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Rate limiting storage (in-memory for demo, use Redis in production)
login_attempts = {}


async def check_rate_limit(username: str) -> bool:
    """Check if user exceeded login rate limit"""
    from ..core.config import settings
    
    current_time = datetime.utcnow()
    key = f"login:{username}"
    
    if key in login_attempts:
        attempts, first_attempt = login_attempts[key]
        
        # Reset if window expired
        if (current_time - first_attempt).total_seconds() > settings.LOGIN_RATE_WINDOW:
            login_attempts[key] = (1, current_time)
            return True
        
        # Check if exceeded limit
        if attempts >= settings.LOGIN_RATE_LIMIT:
            return False
        
        # Increment attempts
        login_attempts[key] = (attempts + 1, first_attempt)
    else:
        login_attempts[key] = (1, current_time)
    
    return True


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Register new user with optional face enrollment
    """
    try:
        # Check if username exists
        existing_user = await db.users.find_one({"username": user_data.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Check if email exists
        existing_email = await db.users.find_one({"email": user_data.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate and encrypt face embedding if provided
        face_embedding_encrypted = None
        if user_data.face_embedding:
            is_valid, error_msg = validate_embedding_quality(user_data.face_embedding)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid face embedding: {error_msg}"
                )
            
            # Encrypt embedding
            face_embedding_encrypted = encrypt_embedding(user_data.face_embedding)
        
        # Hash password
        logger.info(f"Hashing password for user: {user_data.username}")
        logger.info(f"Password length: {len(user_data.password)} chars, {len(user_data.password.encode('utf-8'))} bytes")
        logger.info(f"Password first 20 chars: {user_data.password[:20]}")
        hashed_password = hash_password(user_data.password)
        logger.info("Password hashed successfully")
        
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hashed_password,
            "name": user_data.name,
            "account_no": user_data.account_no,
            "mobile": user_data.mobile,
            "face_embedding_encrypted": face_embedding_encrypted,
            "embedding_version": "v1",
            "created_at": datetime.utcnow(),
            "is_locked": False,
            "balance": 10000.00  # Initial balance for demo
        }
        
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create a session for freshly registered users so monitoring APIs work
        session_doc = {
            "user_id": user_id,
            "username": user_data.username,
            "device_fingerprint": f"register:{secrets.token_hex(16)}",
            "ip_address": None,
            "browser_signature": "registration_flow",
            "created_at": datetime.utcnow().isoformat(),
            "threat_score": 0,
            "is_locked": False,
            "requires_facial_captcha": False
        }
        session_result = await db.sessions.insert_one(session_doc)
        session_id = str(session_result.inserted_id)

        # Create tokens
        token_data = {"sub": user_id, "username": user_data.username, "session_id": session_id}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            requires_facial_captcha=False
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Manual login with username and password
    Triggers facial CAPTCHA after successful authentication
    """
    # ADMIN LOGIN BACKDOOR (For Demonstration)
    if credentials.username == "admin" and credentials.password == "admin":
        user_id = "admin-user-id"
        token_data = {
            "sub": user_id,
            "username": "admin",
            "role": "admin"
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            requires_facial_captcha=False  # Admin bypasses CAPTCHA
        )

    # Check rate limit
    if not await check_rate_limit(credentials.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Find user
    user = await db.users.find_one({"username": credentials.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is locked
    if user.get("is_locked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to security concerns"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create session
    user_id = str(user["_id"])
    device_fp = credentials.device_fingerprint or generate_device_fingerprint(
        credentials.user_agent,
        credentials.ip_address
    )
    
    session_doc = {
        "user_id": user_id,
        "username": user["username"],
        "device_fingerprint": device_fp,
        "ip_address": credentials.ip_address,
        "browser_signature": credentials.user_agent,
        "created_at": datetime.utcnow().isoformat(),
        "threat_score": 0,
        "is_locked": False,
        "requires_facial_captcha": False
    }
    
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    # Create tokens
    token_data = {
        "sub": user_id,
        "username": user["username"],
        "session_id": session_id
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        requires_facial_captcha=False
    )


@router.post("/login-auto", response_model=AutoLoginResponse)
async def auto_login(
    face_data: FaceAutoLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Face-based auto-login
    Finds user by face match, then requires password + facial CAPTCHA
    """
    # Validate embedding
    is_valid, error_msg = validate_embedding_quality(face_data.face_embedding)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid face embedding: {error_msg}"
        )
    
    # Search for matching user
    user = await find_user_by_face(db, face_data.face_embedding)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching user found"
        )
    
    # Return username for auto-fill (still require password on frontend)
    # This is a partial authentication - full login via /login endpoint
    return {
        "username": user["username"],
        "name": user["name"],
        "message": "User identified. Please enter password."
    }


@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Refresh access token using refresh token"""
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    username = payload.get("username")
    session_id = payload.get("session_id")
    
    # Create new access token
    token_data = {
        "sub": user_id,
        "username": username,
        "session_id": session_id
    }
    access_token = create_access_token(token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Logout user and invalidate session"""
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
    
    session_id = payload.get("session_id")
    
    # Delete session
    if session_id:
        await db.sessions.delete_one({"_id": session_id})
    
    return {"message": "Logged out successfully"}
