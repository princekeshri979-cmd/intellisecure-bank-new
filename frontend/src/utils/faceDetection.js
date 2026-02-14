import * as faceapi from 'face-api.js';

let modelsLoaded = false;

const FACE_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
});

// Load face-api.js models
export const loadFaceModels = async () => {
    if (modelsLoaded) {
        console.log('[FaceAPI] Models already loaded');
        return true;
    }

    try {
        const MODEL_URL = '/models';
        console.log('[FaceAPI] Starting to load models from:', MODEL_URL);

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        modelsLoaded = true;
        console.log('[FaceAPI] ✓ All face-api models loaded successfully');
        return true;
    } catch (error) {
        console.error('[FaceAPI] ✗ Error loading face-api models:', error);
        console.error('[FaceAPI] Error details:', error.message);
        return false;
    }
};

// Extract face embedding from video element
export const extractFaceEmbedding = async (videoElement) => {
    console.log('[FaceAPI] Extracting face embedding from video element:', videoElement);
    console.log('[FaceAPI] Video dimensions:', videoElement?.videoWidth, 'x', videoElement?.videoHeight);
    console.log('[FaceAPI] Video ready state:', videoElement?.readyState);
    console.log('[FaceAPI] Video paused:', videoElement?.paused);

    try {
        const detection = await faceapi
            .detectSingleFace(videoElement, FACE_DETECTOR_OPTIONS)
            .withFaceLandmarks()
            .withFaceDescriptor();

        console.log('[FaceAPI] Detection result:', detection);

        if (!detection) {
            console.warn('[FaceAPI] No face detected in frame');
            return { success: false, error: 'No face detected' };
        }

        // Convert Float32Array to regular array
        const embedding = Array.from(detection.descriptor);
        console.log('[FaceAPI] ✓ Face detected! Embedding length:', embedding.length);

        return {
            success: true,
            embedding,
            detection,
        };
    } catch (error) {
        console.error('[FaceAPI] Error extracting face embedding:', error);
        return { success: false, error: error.message };
    }
};

// Detect all faces in frame
export const detectFaces = async (videoElement) => {
    try {
        const detections = await faceapi
            .detectAllFaces(videoElement, FACE_DETECTOR_OPTIONS)
            .withFaceLandmarks()
            .withFaceExpressions();

        return detections;
    } catch (error) {
        console.error('Error detecting faces:', error);
        return [];
    }
};

// Check for liveness indicators
export const checkLiveness = async (videoElement, challengeType) => {
    try {
        const detection = await faceapi
            .detectSingleFace(videoElement, FACE_DETECTOR_OPTIONS)
            .withFaceLandmarks()
            .withFaceExpressions();

        if (!detection) {
            return { verified: false, score: 0, reason: 'No face detected' };
        }

        const { expressions, landmarks } = detection;
        let score = 0.7; // Base score
        let actionDetected = false;

        switch (challengeType) {
            case 'BLINK_EYES':
                // Check for closed eyes (low eye aspect ratio) - simplified
                actionDetected = expressions.neutral < 0.8;
                break;

            case 'SMILE':
                actionDetected = expressions.happy > 0.5;
                if (actionDetected) score += expressions.happy * 0.3;
                break;

            case 'RAISE_EYEBROWS':
                actionDetected = expressions.surprised > 0.4;
                if (actionDetected) score += expressions.surprised * 0.3;
                break;

            case 'TURN_HEAD_LEFT':
            case 'TURN_HEAD_RIGHT':
                // Check nose position relative to face center
                const nose = landmarks.getNose();
                const jawLine = landmarks.getJawOutline();

                // Calculate face center (average of left and right jaw points)
                const faceLeftX = jawLine[0].x;
                const faceRightX = jawLine[16].x;
                const faceCenterX = (faceLeftX + faceRightX) / 2;

                const noseX = nose[3].x; // Tip of nose
                const faceWidth = faceRightX - faceLeftX;

                // Displacement ratio (relative to face width)
                // Negative = Left (in image), Positive = Right (in image)
                const displacement = (noseX - faceCenterX) / faceWidth;

                console.log(`[FaceAPI] Head Turn: displacement=${displacement.toFixed(2)}, type=${challengeType}`);

                // MIRRORED LOGIC:
                // If user turns LEFT (their left), their nose moves to the LEFT of the screen (negative displacement)
                // If user turns RIGHT (their right), their nose moves to the RIGHT of the screen (positive displacement)

                const TURN_THRESHOLD = 0.15; // 15% of face width

                if (challengeType === 'TURN_HEAD_LEFT') {
                    // User turns LEFT -> Nose moves RIGHT in raw camera view (Positive)
                    actionDetected = displacement > TURN_THRESHOLD;
                } else {
                    // User turns RIGHT -> Nose moves LEFT in raw camera view (Negative)
                    actionDetected = displacement < -TURN_THRESHOLD;
                }
                break;

            case 'FOLLOW_DOT':
                actionDetected = true;
                break;

            default:
                actionDetected = true;
        }

        return {
            verified: actionDetected,
            score: actionDetected ? Math.min(score, 1.0) : 0.3,
            reason: actionDetected ? 'Action detected' : 'No action detected',
        };
    } catch (error) {
        console.error('Liveness check error:', error);
        return { verified: false, score: 0, reason: error.message };
    }
};

// Draw face detection overlay
export const drawFaceDetections = (canvas, detections, videoWidth, videoHeight) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections || detections.length === 0) return;

    detections.forEach((detection) => {
        const { x, y, width, height } = detection.detection.box;

        // Draw bounding box
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw landmarks
        const landmarks = detection.landmarks.positions;
        ctx.fillStyle = '#00f3ff';
        landmarks.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    });
};

// Get device fingerprint
export const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);

    const dataURL = canvas.toDataURL();
    const fingerprint = btoa(
        navigator.userAgent +
        navigator.language +
        screen.colorDepth +
        screen.width +
        screen.height +
        dataURL.slice(-50)
    ).slice(0, 32);

    return fingerprint;
};

// Get IP address (via external service or backend)
export const getIPAddress = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        // Fallback
        return '127.0.0.1';
    }
};
