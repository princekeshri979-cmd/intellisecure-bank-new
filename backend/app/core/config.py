from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables"""
    
    # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "intellisecure_bank"
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Security
    AES_ENCRYPTION_KEY: str
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Threat Detection Thresholds
    THREAT_LOCK_THRESHOLD: int = 75
    THREAT_LOGOUT_THRESHOLD: int = 80
    
    # Facial Verification
    FACE_MATCH_THRESHOLD: float = 0.80  # Lowered from 0.85 for better webcam matching
    FACE_SUSPICIOUS_THRESHOLD: float = 0.70
    LIVENESS_SCORE_THRESHOLD: float = 0.7
    MAX_CAPTCHA_ATTEMPTS: int = 3
    
    # Rate Limiting
    LOGIN_RATE_LIMIT: int = 5
    LOGIN_RATE_WINDOW: int = 300  # seconds
    
    # ML Configuration
    ML_MODEL_PATH: str = "app/ml/models/isolation_forest.pkl"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
