"""
Rule-Based Threat Scoring Engine

Deterministic, explainable threat scoring for continuous authentication.
Production-grade implementation with transparent logic.
"""

from typing import Dict, List, Optional
from datetime import datetime
from .config import settings
import ipaddress


class ThreatEngine:
    """Rule-based threat scoring with explainable logic"""
    
    @staticmethod
    def calculate_threat_score(
        session_data: Dict,
        current_signals: Dict,
        ml_anomaly_score: float = 0.0
    ) -> Dict:
        """
        Calculate threat score based on multiple factors
        
        Args:
            session_data: Session binding data (device, IP, browser)
            current_signals: Current behavioral and environmental signals
            ml_anomaly_score: Anomaly score from ML model (0-1)
        
        Returns:
            Dictionary with:
            - score: Overall threat score (0-100)
            - breakdown: Individual component scores
            - triggers: List of triggered rules
            - recommended_action: Suggested action
        """
        score = 0
        breakdown = {}
        triggers = []
        
        # 1. Device Mismatch Detection (High Weight: +40)
        device_score = ThreatEngine._check_device_mismatch(
            session_data.get("device_fingerprint"),
            current_signals.get("device_fingerprint")
        )
        if device_score > 0:
            triggers.append("Device mismatch detected")
        breakdown["device_mismatch"] = device_score
        score += device_score
        
        # 2. IP Drift Detection (Medium Weight: +25)
        ip_score = ThreatEngine._check_ip_drift(
            session_data.get("ip_address"),
            current_signals.get("ip_address")
        )
        if ip_score > 0:
            triggers.append("IP address change detected")
        breakdown["ip_drift"] =ip_score
        score += ip_score
        
        # 3. Camera Anomaly Detection (High Weight: +35)
        camera_score = ThreatEngine._check_camera_anomalies(current_signals)
        if camera_score > 0:
            if current_signals.get("multiple_faces"):
                triggers.append("Multiple faces detected")
            if current_signals.get("face_present") == False:
                triggers.append("No face detected")
            if current_signals.get("camera_blocked"):
                triggers.append("Camera blocked or covered")
        breakdown["camera_anomalies"] = camera_score
        score += camera_score
        
        # 4. Behavioral Anomaly (Medium Weight: +20)
        behavior_score = ThreatEngine._check_behavioral_anomalies(current_signals)
        if behavior_score > 0:
            triggers.append("Unusual behavioral patterns")
        breakdown["behavioral_anomalies"] = behavior_score
        score += behavior_score
        
        # 5. Facial CAPTCHA Failure (High Weight: +45)
        captcha_fail_score = current_signals.get("facial_captcha_failed", 0) * 45
        if captcha_fail_score > 0:
            triggers.append("Facial CAPTCHA verification failed")
        breakdown["facial_captcha_failure"] = captcha_fail_score
        score += captcha_fail_score
        
        # 6. ML Anomaly Score (Medium Weight: +20)
        ml_score = ml_anomaly_score * 20
        if ml_score > 5:
            triggers.append("ML model detected anomaly")
        breakdown["ml_anomaly"] = ml_score
        score += ml_score
        
        # 7. Face Mismatch Detection (Critical Weight: +50)
        face_mismatch_score = ThreatEngine._check_face_mismatch(
            current_signals.get("live_face_embedding"),
            session_data.get("stored_face_embedding")
        )
        if face_mismatch_score > 0:
            triggers.append("Live face does not match database")
        breakdown["face_mismatch"] = face_mismatch_score
        score += face_mismatch_score
        
        # 8. Mouse Behavior Analysis (Medium Weight: +25)
        mouse_behavior_score = ThreatEngine._check_mouse_behavior(current_signals)
        if mouse_behavior_score > 0:
            triggers.append("Bot-like mouse behavior detected")
        breakdown["mouse_behavior"] = mouse_behavior_score
        score += mouse_behavior_score
        
        # 9. Session Age Factor (minor adjustment)
        age_score = ThreatEngine._check_session_age(session_data.get("created_at"))
        breakdown["session_age"] = age_score
        score += age_score
        
        # Cap score at 100
        score = min(score, 100)
        
        # Determine recommended action
        recommended_action = ThreatEngine._get_recommended_action(score)
        
        return {
            "score": round(score, 2),
            "breakdown": breakdown,
            "triggers": triggers,
            "recommended_action": recommended_action,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _check_device_mismatch(session_fingerprint: str, current_fingerprint: str) -> float:
        """Check if device fingerprint changed (High threat)"""
        if not session_fingerprint or not current_fingerprint:
            return 0
        
        if session_fingerprint != current_fingerprint:
            return 40  # High weight
        return 0
    
    @staticmethod
    def _check_ip_drift(session_ip: str, current_ip: str) -> float:
        """
        Check for IP address changes with subnet tolerance
        (Medium threat - normal for mobile users)
        """
        if not session_ip or not current_ip:
            return 0
        
        if session_ip == current_ip:
            return 0
        
        try:
            # Parse IPs
            session_ip_obj = ipaddress.ip_address(session_ip)
            current_ip_obj = ipaddress.ip_address(current_ip)
            
            # Check if in same /24 subnet (more tolerant)
            session_network = ipaddress.ip_network(f"{session_ip}/24", strict=False)
            
            if current_ip_obj in session_network:
                return 10  # Same subnet, minor concern
            else:
                return 25  # Different subnet, medium concern
        except:
            return 25  # Invalid IP, treat as different
    
    @staticmethod
    def _check_camera_anomalies(signals: Dict) -> float:
        """Check for camera-related anomalies"""
        score = 0
        
        # Multiple faces detected
        if signals.get("multiple_faces"):
            score += 20
        
        # Camera blocked/covered
        if signals.get("camera_blocked"):
            score += 15
        
        # No face present when expected
        if signals.get("face_present") == False:
            score += 15
        
        return min(score, 35)  # Cap at 35
    
    @staticmethod
    def _check_behavioral_anomalies(signals: Dict) -> float:
        """Check for unusual behavioral patterns"""
        score = 0
        
        # Keystroke timing anomalies
        keystroke_deviation = signals.get("keystroke_deviation", 0)
        if keystroke_deviation > 2.0:  # 2 standard deviations
            score += 10
        
        # Mouse movement anomalies
        mouse_deviation = signals.get("mouse_deviation", 0)
        if mouse_deviation > 2.0:
            score += 10
        
        return min(score, 20)  # Cap at 20
    
    @staticmethod
    def _check_session_age(created_at: Optional[str]) -> float:
        """Check session age (minor factor)"""
        if not created_at:
            return 0
        
        try:
            created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            age_hours = (datetime.utcnow() - created_time).total_seconds() / 3600
            
            # Very old sessions get minor penalty
            if age_hours > 24:
                return 5
            elif age_hours > 12:
                return 2
        except:
            pass
        
        return 0
    
    @staticmethod
    def _get_recommended_action(score: float) -> str:
        """Determine action based on threat score"""
        if score >= settings.THREAT_LOGOUT_THRESHOLD:  # >= 80
            return "FORCE_LOGOUT"
        elif score >= settings.THREAT_LOCK_THRESHOLD:
            return "LOCK_SESSION"
        elif score >= 20:
            return "INCREASE_MONITORING"
        else:
            return "CONTINUE"
    
    @staticmethod
    def _check_face_mismatch(live_embedding: Optional[List[float]], stored_embedding: Optional[List[float]]) -> float:
        """
        Check if live face matches stored database face
        Uses same strict Euclidean distance as login (< 0.55)
        """
        if not live_embedding or not stored_embedding:
            return 0  # Can't verify without embeddings
        
        if len(live_embedding) != 128 or len(stored_embedding) != 128:
            return 0  # Invalid embeddings
        
        try:
            import numpy as np
            vec1 = np.array(live_embedding)
            vec2 = np.array(stored_embedding)
            distance = np.linalg.norm(vec1 - vec2)
            
            # Same threshold as login verification (0.55)
            if distance >= 0.55:
                # Face doesn't match - CRITICAL THREAT
                return 50
            return 0
        except Exception as e:
            print(f"Face mismatch check error: {e}")
            return 0
    
    @staticmethod
    def _check_mouse_behavior(signals: Dict) -> float:
        """
        Detect bot-like mouse behavior
        Low entropy = repetitive/scripted movements
        Low variance = constant speed (not human)
        """
        score = 0
        
        # Check mouse entropy (Shannon entropy of movement vectors)
        mouse_entropy = signals.get("mouse_entropy", 1.0)
        if mouse_entropy < 0.3:  # Very low entropy = bot
            score += 15
        elif mouse_entropy < 0.5:  # Moderately low = suspicious
            score += 8
        
        # Check velocity variance
        velocity_variance = signals.get("mouse_velocity_variance", 1.0)
        if velocity_variance < 0.2:  # Too consistent = bot
            score += 10
        
        return min(score, 25)  # Cap at 25
    
    @staticmethod
    def should_trigger_facial_captcha(score: float) -> bool:
        """Check if facial CAPTCHA should be triggered"""
        return score >= settings.THREAT_LOCK_THRESHOLD  # >= 60
