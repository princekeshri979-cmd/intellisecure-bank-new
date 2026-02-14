import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { monitoringAPI } from '../utils/api';
import { getDeviceFingerprint, getIPAddress, extractFaceEmbedding } from '../utils/faceDetection';
import mouseTracker from '../utils/mouseTracking';

const FACE_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
});

function ContinuousMonitoring({ onThreatUpdate, onCaptchaRequired }) {
    const videoRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const embeddingIntervalRef = useRef(null);
    const lastEmbeddingRef = useRef(null);
    const lastEmbeddingAtRef = useRef(0);
    const captchaActiveRef = useRef(false);
    const modelsReadyRef = useRef(false);
    const cameraReadyRef = useRef(false);
    const noFaceStreakRef = useRef(0);
    const multiFaceStreakRef = useRef(0);
    const [status, setStatus] = useState('active'); // active, warning, error
    const [faceStatus, setFaceStatus] = useState('match'); // match, mismatch
    const [message, setMessage] = useState('Monitoring Active');

    useEffect(() => {
        // Load models then start monitoring
        const init = async () => {
            const modelsLoaded = await loadFaceModels();
            if (modelsLoaded) {
                startMonitoring();
                // Start mouse tracking for bot detection
                mouseTracker.start();
            } else {
                setStatus('error');
                setMessage('Failed to load AI models');
            }
        };

        init();

        return () => {
            const stream = videoRef.current?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cameraReadyRef.current = false;
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (embeddingIntervalRef.current) {
                clearInterval(embeddingIntervalRef.current);
            }
            // Stop mouse tracking
            mouseTracker.stop();
        };
    }, []);

    const startMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    cameraReadyRef.current = true;
                    videoRef.current.play().catch(() => { });
                };
            }

            // Start periodic checks
            heartbeatIntervalRef.current = setInterval(performSecurityCheck, 3000);
            embeddingIntervalRef.current = setInterval(captureFaceEmbedding, 5000);
        } catch (err) {
            setStatus('error');
            setMessage('Camera access denied');
        }
    };

    // Check if models are actually loaded before inference
    const loadFaceModels = async () => {
        try {
            // Import the shared loader function
            const { loadFaceModels: loadModels } = await import('../utils/faceDetection');
            const ready = await loadModels();
            modelsReadyRef.current = !!ready;
            return ready;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    const captureFaceEmbedding = async () => {
        if (!videoRef.current || !modelsReadyRef.current || !cameraReadyRef.current) return;

        try {
            const faceResult = await extractFaceEmbedding(videoRef.current);

            if (faceResult.success && faceResult.embedding) {
                lastEmbeddingRef.current = faceResult.embedding;
                lastEmbeddingAtRef.current = Date.now();
            }
        } catch (err) {
            console.error('Face embedding capture failed:', err);
        }
    };

    const triggerCaptcha = (reason) => {
        if (onCaptchaRequired && !captchaActiveRef.current) {
            captchaActiveRef.current = true;
            onCaptchaRequired(reason);
        }
    };

    const performSecurityCheck = async () => {
        if (!videoRef.current) return;
        if (!modelsReadyRef.current || !cameraReadyRef.current || videoRef.current.readyState < 2) {
            return;
        }

        try {
            // Detect faces
            const detections = await faceapi.detectAllFaces(
                videoRef.current,
                FACE_DETECTOR_OPTIONS
            );

            const faceCount = detections.length;
            let currentStatus = status === 'error' ? 'error' : 'active';
            let currentMsg = 'Monitoring Active';

            if (faceCount === 0) {
                currentStatus = 'warning';
                currentMsg = 'No face detected';
                noFaceStreakRef.current += 1;
                multiFaceStreakRef.current = 0;
            } else if (faceCount > 1) {
                currentStatus = 'warning';
                currentMsg = 'Multiple faces detected';
                multiFaceStreakRef.current += 1;
                noFaceStreakRef.current = 0;
            } else {
                noFaceStreakRef.current = 0;
                multiFaceStreakRef.current = 0;
            }

            if (noFaceStreakRef.current >= 5) {
                triggerCaptcha('No face detected');
            } else if (multiFaceStreakRef.current >= 3) {
                triggerCaptcha('Multiple faces detected');
            }

            // Get mouse behavior metrics
            const mouseMetrics = mouseTracker.getMetrics();

            const embeddingAgeMs = Date.now() - lastEmbeddingAtRef.current;
            const liveEmbedding = embeddingAgeMs < 8000 ? lastEmbeddingRef.current : null;

            // Send Heartbeat with enhanced signals
            const signals = {
                face_present: faceCount > 0,
                multiple_faces: faceCount > 1,
                camera_ready: true,
                camera_blocked: false, // simplified
                device_fingerprint: getDeviceFingerprint(),
                ip_address: await getIPAddress(),
                mouse_entropy: mouseMetrics.entropy,
                mouse_velocity_variance: mouseMetrics.velocityVariance,
                live_face_embedding: liveEmbedding
            };

            const response = await monitoringAPI.sendHeartbeat({ signals });
            const threatData = response?.data || {};
            const triggers = Array.isArray(threatData.triggers) ? threatData.triggers : [];
            const requiresCaptcha = !!threatData.requires_facial_captcha;
            const faceMismatch = triggers.includes('Live face does not match database');

            if (faceMismatch) {
                setFaceStatus('mismatch');
                currentStatus = 'warning';
                currentMsg = 'Face mismatch detected';
                triggerCaptcha('Live face does not match database');
            } else {
                setFaceStatus('match');
            }

            if (requiresCaptcha) {
                triggerCaptcha(triggers[0] || 'High risk detected');
            } else {
                captchaActiveRef.current = false;
            }

            setStatus(currentStatus);
            if (currentMsg !== message) {
                setMessage(currentMsg);
            }

            if (onThreatUpdate) {
                onThreatUpdate(threatData);
            }

        } catch (err) {
            const statusCode = err?.response?.status;
            if (statusCode === 403) {
                triggerCaptcha('Session locked');
                setStatus('warning');
                setMessage('Session locked. Complete facial CAPTCHA.');
            } else {
                console.error('Monitoring check failed ignoring...', err);
            }
        }
    };

    return (
        <div className="security-cam-widget">
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Security Cam
                <span className={`status-dot ${status}`}></span>
            </h4>
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '135px', background: '#000' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', padding: '0.25rem', textAlign: 'center' }}>
                    {message}
                </div>
            </div>

            <style>{`
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--success);
                    box-shadow: 0 0 5px var(--success);
                    display: inline-block;
                }
                .status-dot.warning { background: var(--warning); box-shadow: 0 0 5px var(--warning); }
                .status-dot.error { background: var(--error); box-shadow: 0 0 5px var(--error); }
            `}</style>
        </div>
    );
}

export default ContinuousMonitoring;


