"""
Face Verification Module

Handles face embedding extraction, matching, and encryption.
Production-grade implementation for banking security.

IMPORTANT: Requires face_recognition library to be installed.
See FACE_RECOGNITION_INSTALL.md for installation instructions.
"""

import numpy as np
from typing import Optional, Tuple
from .security import encrypt_embedding, decrypt_embedding
from .config import settings

# Import will be conditional based on availability
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition library not installed. Facial verification disabled.")


def is_face_recognition_available() ->bool:
    """Check if face_recognition library is available"""
    return FACE_RECOGNITION_AVAILABLE


def extract_face_embedding(image_array: np.ndarray) -> Optional[list]:
    """
    Extract 128-dimensional face embedding from image
    
    Args:
        image_array: numpy array of image (RGB format)
    
    Returns:
        List of 128 floats or None if no face detected
    """
    if not FACE_RECOGNITION_AVAILABLE:
        raise ImportError("face_recognition library not installed")
    
    # Detect face locations
    face_locations = face_recognition.face_locations(image_array)
    
    if len(face_locations) == 0:
        return None  # No face detected
    
    if len(face_locations) > 1:
        return None  # Multiple faces detected
    
    # Extract embedding for the first face
    face_encodings = face_recognition.face_encodings(image_array, face_locations)
    
    if len(face_encodings) == 0:
        return None
    
    # Convert numpy array to list for storage
    embedding = face_encodings[0].tolist()
    return embedding


def cosine_similarity(embedding1: list, embedding2: list) -> float:
    """
    Calculate cosine similarity between two face embeddings
    
    Args:
        embedding1: First face embedding (128-dim list)
        embedding2: Second face embedding (128-dim list)
    
    Returns:
        Similarity score between 0 and 1
    """
    # Convert to numpy arrays
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    
    # Calculate cosine similarity
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    return float(similarity)


def verify_face_match(
    live_embedding: list,
    stored_embedding_encrypted: str,
    threshold: float = 0.55
) -> Tuple[bool, float, str]:
    """
    Verify if live face matches stored face
    
    Args:
        live_embedding: 128-dim face embedding from live camera
        stored_embedding_encrypted: Encrypted stored embedding
        threshold: Distance threshold for match (default 0.55)
    
    Returns:
        Tuple of (is_match, similarity, verdict)
    """
    # Decrypt stored embedding
    try:
        stored_embedding = decrypt_embedding(stored_embedding_encrypted)
    except Exception:
        # If decryption fails, return mismatch (fail safe)
        return False, 0.0, "DECRYPT_FAIL"

    # Calculate Euclidean distance
    vec1 = np.array(live_embedding)
    vec2 = np.array(stored_embedding)
    distance = float(np.linalg.norm(vec1 - vec2))
    
    # Check if distance is below threshold
    is_match = distance < threshold

    # Convert distance to a rough similarity score (0..1)
    similarity = max(0.0, min(1.0, 1.0 - distance))
    verdict = "MATCH" if is_match else "NO_MATCH"

    return is_match, similarity, verdict


def calculate_face_distance(embedding1: list, embedding2: list) -> float:
    """
    Calculate Euclidean distance between two face embeddings
    
    Args:
        embedding1: First 128-dim face embedding
        embedding2: Second 128-dim face embedding
    
    Returns:
        Euclidean distance (lower = more similar)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    distance = float(np.linalg.norm(vec1 - vec2))
    return distance


async def find_user_by_face(db, input_embedding: list) -> Optional[dict]:
    """
    Search database for user with matching face
    Used for face-based auto-login
    
    Args:
        db: Database instance
        input_embedding: Face embedding to search for
    
    Returns:
        User document if match found, None otherwise
    """
    # Get all users with face embeddings
    users_cursor = db.users.find({"face_embedding_encrypted": {"$exists": True}})
    users = await users_cursor.to_list(length=None) 
    
    best_match = None
    best_similarity = 0.0
    
    for user in users:
        try:
            stored_embedding_encrypted = user.get("face_embedding_encrypted")
            if not stored_embedding_encrypted:
                continue
            
            # Decrypt and compare
            stored_embedding = decrypt_embedding(stored_embedding_encrypted)
            
            # Use Euclidean Distance ONLY (Standard for dlib/face_recognition)
            # Threshold: 0.6 is typical, 0.5 is strict.
            # We use 0.55 for a balance of security and usability.
            
            vec1 = np.array(input_embedding)
            vec2 = np.array(stored_embedding)
            dist = np.linalg.norm(vec1 - vec2)
            
            # Check strict threshold
            if dist < 0.55:
                # Lower distance is better
                if best_match is None or dist < best_similarity:
                    best_similarity = dist
                    best_match = user
                    
        except Exception as e:
            continue
    
    return best_match


def validate_embedding_quality(embedding: list) -> Tuple[bool, str]:
    """
    Validate that face embedding is of sufficient quality
    
    Args:
        embedding: Face embedding to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not embedding:
        return False, "No embedding provided"
    
    if not isinstance(embedding, list):
        return False, "Embedding must be a list"
    
    if len(embedding) != 128:
        return False, f"Embedding must be 128-dimensional, got {len(embedding)}"
    
    # Check for all zeros (failed extraction)
    if all(x == 0 for x in embedding):
        return False, "Embedding is all zeros - invalid face data"
    
    # Check for reasonable value ranges
    embedding_array = np.array(embedding)
    if np.any(np.isnan(embedding_array)) or np.any(np.isinf(embedding_array)):
        return False, "Embedding contains invalid values"
    
    return True, "Valid"


# Mock function for when face_recognition is not installed
def mock_extract_embedding() -> list:
    """Generate a mock embedding for testing without face_recognition"""
    return list(np.random.randn(128))
