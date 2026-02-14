from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from .config import settings
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64

import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt with proper 72-byte handling"""
    # Truncate password to 72 bytes for bcrypt
    password_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    password_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_device_fingerprint(user_agent: str, ip: str) -> str:
    """Generate device fingerprint from user agent and IP"""
    fingerprint_str = f"{user_agent}:{ip}"
    return hashlib.sha256(fingerprint_str.encode()).hexdigest()


# AES-256 Encryption for face embeddings
def get_cipher():
    """Get Fernet cipher for AES encryption"""
    # Derive a proper key from the settings key
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'intellisecure_bank_salt',  # In production, use unique salt per user
        iterations=10000,  # Reduced from 100000 for better performance
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.AES_ENCRYPTION_KEY.encode()))
    return Fernet(key)


def encrypt_embedding(embedding: list) -> str:
    """Encrypt face embedding vector"""
    cipher = get_cipher()
    # Convert list to string for encryption
    embedding_str = str(embedding)
    encrypted = cipher.encrypt(embedding_str.encode())
    return base64.b64encode(encrypted).decode()


def decrypt_embedding(encrypted_embedding: str) -> list:
    """Decrypt face embedding vector"""
    cipher = get_cipher()
    encrypted_bytes = base64.b64decode(encrypted_embedding.encode())
    decrypted = cipher.decrypt(encrypted_bytes)
    # Convert string back to list
    return eval(decrypted.decode())


# Alias for backward compatibility
decrypt_face_embedding = decrypt_embedding
encrypt_face_embedding = encrypt_embedding
