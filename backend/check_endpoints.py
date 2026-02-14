import requests
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(method, path, data=None):
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json=data)
        
        print(f"{method} {path} -> {response.status_code}")
        # print(response.text[:100])
        return response.status_code
    except Exception as e:
        print(f"Failed to connect to {url}: {e}")
        return None

print("Checking API endpoints...")

# 1. Check if server is up
test_endpoint("GET", "/")

# 2. Check Admin routes (known to work)
test_endpoint("GET", "/api/admin/notification")

# 3. Check Monitoring Ping (new)
test_endpoint("GET", "/api/monitoring/ping")

# 4. Check Monitoring Heartbeat (problematic)
test_endpoint("POST", "/api/monitoring/heartbeat", {
    "signals": {
        "device_fingerprint": "test",
        "ip_address": "127.0.0.1",
        "keystroke_deviation": 0,
        "mouse_deviation": 0,
        "face_present": True,
        "multiple_faces": False,
        "camera_blocked": False,
        "facial_captcha_failed": False,
        "mouse_entropy": 0,
        "mouse_velocity_variance": 0
    }
})

# 5. Check Face Verification (Auth required, expect 401)
test_endpoint("POST", "/api/face-verification/check", {"live_embedding": []})
