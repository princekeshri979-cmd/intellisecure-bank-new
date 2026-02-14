"""
IntelliSecure Bank - FastAPI Main Application

Production-grade AI-powered banking platform with continuous authentication.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import Database
from app.api import auth, facial_captcha, monitoring, banking, admin, face_verification
from app.sockets.websocket_manager import websocket_manager
from app.core.security import decode_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown"""
    # Startup
    logger.info("Starting IntelliSecure Bank backend...")
    await Database.connect_db()
    logger.info("Connected to MongoDB")
    
    yield
    
    # Shutdown
    logger.info("Shutting down IntelliSecure Bank backend...")
    await Database.close_db()
    logger.info("Database connections closed")


# Create FastAPI application
app = FastAPI(
    title="IntelliSecure Bank API",
    description="Production-grade AI-powered banking platform with continuous authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Hardcoded for development
logger.info("Configuring CORS for localhost:5173 and localhost:5174")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(facial_captcha.router)
app.include_router(monitoring.router)
app.include_router(banking.router)
app.include_router(admin.router)
app.include_router(face_verification.router)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "IntelliSecure Bank API",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "JWT Authentication",
            "Face Enrollment & Verification",
            "Facial CAPTCHA with Liveness Detection",
            "Continuous Authentication",
            "ML-Driven Threat Detection",
            "Risk-Based Authorization",
            "Real-Time WebSocket Updates"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time updates
    Authenticate via token in URL
    """
    # Decode token to get user
    payload = decode_token(token)
    
    if not payload:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id = payload.get("sub")
    
    try:
        # Connect WebSocket
        await websocket_manager.connect(websocket, user_id)
        
        # Send welcome message
        await websocket.send_json({
            "event": "connected",
            "message": "WebSocket connected successfully"
        })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                # Receive messages (heartbeat, ping, etc.)
                data = await websocket.receive_json()
                
                # Echo back or process as needed
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error for user {user_id}: {e}")
                break
    
    finally:
        # Cleanup
        websocket_manager.disconnect(websocket, user_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
