"""
WebSocket Manager

Manages WebSocket connections for real-time updates.
"""

from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manage WebSocket connections for real-time communication"""
    
    def __init__(self):
        # Store active connections: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection for user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user: {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Clean up if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")
    
    async def send_threat_update(self, user_id: str, threat_score: float, triggers: List[str]):
        """Send threat score update"""
        message = {
            "event": "threat:update",
            "data": {
                "threat_score": threat_score,
                "triggers": triggers
            }
        }
        await self.send_personal_message(user_id, message)
    
    async def send_session_lock(self, user_id: str, reason: str):
        """Notify user of session lock"""
        message = {
            "event": "session:lock",
            "data": {
                "reason": reason,
                "requires_facial_captcha": True
            }
        }
        await self.send_personal_message(user_id, message)
    
    async def send_security_alert(self, user_id: str, alert_type: str, message_text: str):
        """Send security alert"""
        message = {
            "event": "security:alert",
            "data": {
                "type": alert_type,
                "message": message_text
            }
        }
        await self.send_personal_message(user_id, message)
    
    async def send_face_verification_result(self, user_id: str, success: bool, verdict: str):
        """Send face verification result"""
        event = "security:face_verified" if success else "security:face_failed"
        message = {
            "event": event,
            "data": {
                "verdict": verdict
            }
        }
        await self.send_personal_message(user_id, message)
    
    async def send_camera_warning(self, user_id: str, warning: str):
        """Send camera anomaly warning"""
        message = {
            "event": "camera:warning",
            "data": {
                "warning": warning
            }
        }
        await self.send_personal_message(user_id, message)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
