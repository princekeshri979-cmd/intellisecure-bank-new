import React, { useState, useRef, useEffect } from 'react';
import { facialCaptchaAPI } from '../utils/api';
import { loadFaceModels, extractFaceEmbedding, checkLiveness, detectFaces } from '../utils/faceDetection';

function FacialCaptcha({ onSuccess, onFailure }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const lastVerificationAttemptRef = useRef(0);
    const [stream, setStream] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [status, setStatus] = useState('loading'); // loading, ready, verifying, success, failure
    const [error, setError] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [modelsReady, setModelsReady] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        let isMounted = true;

        loadFaceModels().then((ready) => {
            if (isMounted) {
                setModelsReady(!!ready);
                if (!ready) {
                    setError('Face models failed to load');
                    setStatus('failure');
                }
            }
        });

        startCamera();
        fetchChallenge();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (!videoRef.current) {
                setError('Camera not available');
                setStatus('failure');
                return;
            }

            videoRef.current.srcObject = mediaStream;

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Video metadata loading timeout'));
                }, 5000);

                videoRef.current.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    videoRef.current
                        .play()
                        .then(() => {
                            setVideoReady(true);
                            resolve();
                        })
                        .catch(() => {
                            // Even if autoplay fails, keep going for user-initiated play
                            setVideoReady(true);
                            resolve();
                        });
                };
            });
        } catch (err) {
            const reason =
                err?.name === 'NotAllowedError'
                    ? 'Camera access denied. Please allow camera access and retry.'
                    : err?.name === 'NotFoundError'
                        ? 'No camera found. Please connect a camera and retry.'
                        : 'Camera access denied. Please check browser permissions and retry.';
            setError(reason);
            setStatus('failure');
            setVideoReady(false);
        }
    };

    const fetchChallenge = async () => {
        try {
            const response = await facialCaptchaAPI.getChallenge();
            const challengeData = response.data;

            setChallenge(challengeData);
            setTimeLeft(challengeData.time_limit);
            setStartTime(Date.now());
            setStatus('ready');
        } catch (err) {
            setError('Failed to load challenge');
            setStatus('failure');
        }
    };

    // Continuous Liveness Check Loop
    useEffect(() => {
        let isActive = true;
        const MIN_RESPONSE_MS = 600;
        const MIN_VERIFY_INTERVAL_MS = 800;

        const checkLoop = async () => {
            if (
                status !== 'ready' ||
                !challenge ||
                !videoRef.current ||
                !modelsReady ||
                !videoReady
            ) {
                return;
            }

            if (startTime && Date.now() - startTime < MIN_RESPONSE_MS) {
                return;
            }

            // Check liveness
            const livenessResult = await checkLiveness(videoRef.current, challenge.challenge_type);

            if (livenessResult.verified && isActive) {
                const now = Date.now();
                if (now - lastVerificationAttemptRef.current < MIN_VERIFY_INTERVAL_MS) {
                    return;
                }
                lastVerificationAttemptRef.current = now;
                // Success! Trigger verification immediately
                setStatus('verifying');
                completeVerification(livenessResult);
            }
        };

        const interval = setInterval(checkLoop, 200); // Check every 200ms

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [status, challenge, modelsReady, videoReady, startTime]);

    // Timer just for timeout failure
    useEffect(() => {
        if (status === 'ready' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && status === 'ready') {
            // Time out!
            setError('Time expired');
            setStatus('failure');
            setTimeout(() => onFailure(), 2000);
        }
    }, [timeLeft, status]);

    const completeVerification = async (livenessResult) => {
        try {
            // Step 0: Check for multiple faces
            const faces = await detectFaces(videoRef.current);
            if (faces.length > 1) {
                setError('Multiple faces detected! Only one person allowed.');
                setStatus('failure');
                setTimeout(() => onFailure(), 2000);
                return;
            }

            const getEmbeddingWithRetries = async (attempts = 4, delayMs = 200) => {
                for (let i = 0; i < attempts; i++) {
                    const result = await extractFaceEmbedding(videoRef.current);
                    if (result.success) {
                        return result;
                    }
                    await new Promise((r) => setTimeout(r, delayMs));
                }
                return { success: false, error: 'No face detected' };
            };

            // Extract face embedding
            if (!startTime) {
                throw new Error('Challenge timer not ready');
            }

            const faceResult = await getEmbeddingWithRetries();

            if (!faceResult.success) {
                setError('No face detected. Please center your face and try again.');
                if (timeLeft > 0) {
                    setStatus('ready');
                } else {
                    setStatus('failure');
                    setTimeout(() => onFailure(), 2000);
                }
                return;
            }

            const embedding = faceResult.embedding;
            if (!Array.isArray(embedding) || embedding.length !== 128) {
                console.warn('[FacialCaptcha] Invalid embedding length:', embedding?.length);
                setError('Face data invalid. Please try again with your face centered.');
                if (timeLeft > 0) {
                    setStatus('ready');
                } else {
                    setStatus('failure');
                    setTimeout(() => onFailure(), 2000);
                }
                return;
            }

            // Calculate timing
            const endTime = Date.now();
            const timingSeconds = (endTime - startTime) / 1000;

            // Send verification request
            const verificationData = {
                challenge_id: challenge.challenge_id,
                challenge_type: challenge.challenge_type,
                challenge_result: true, // We already verified it locally
                timing_seconds: timingSeconds,
                liveness_score: livenessResult.score,
                face_embedding: embedding,
            };

            const response = await facialCaptchaAPI.verifyChallenge(verificationData);
            const result = response.data;

            if (result.success && result.verdict === 'PASS') {
                setStatus('success');
                setTimeout(() => onSuccess(), 1500);
            } else {
                setError(result.message || 'Verification failed');
                setStatus('failure');
                setTimeout(() => onFailure(), 2000);
            }
        } catch (err) {
            console.error(err);
            setError('Verification error');
            setStatus('failure');
            setTimeout(() => onFailure(), 2000);
        }
    };

    const handleRetryCamera = async () => {
        setIsRetrying(true);
        setError('');
        setStatus('loading');
        setVideoReady(false);
        setTimeLeft(0);
        setChallenge(null);
        setStartTime(null);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        await startCamera();
        await fetchChallenge();
        setIsRetrying(false);
    };

    const getInstructionText = () => {
        if (!challenge) return 'Loading challenge...';

        const instructions = {
            BLINK_EYES: '👁️ Blink Your Eyes',
            TURN_HEAD_LEFT: '⬅️ Turn Your Head Left',
            TURN_HEAD_RIGHT: '➡️ Turn Your Head Right',
            SMILE: '😊 Smile',
            RAISE_EYEBROWS: '😮 Raise Your Eyebrows',
            FOLLOW_DOT: '👀 Follow the Dot',
        };

        return instructions[challenge.challenge_type] || challenge.instruction;
    };

    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '4rem' }}>
            <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h2 className="text-center" style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                    Facial CAPTCHA Verification
                </h2>

                <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Complete the challenge to verify your identity
                </p>

                {error && (
                    <div className="alert alert-error animate-slide-in">
                        {error}
                    </div>
                )}

                <div className="webcam-container mb-4">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: '100%',
                            borderRadius: '12px',
                            transform: 'scaleX(-1)' // Mirror the video
                        }}
                    />

                    {challenge && status === 'ready' && (
                        <div
                            className="webcam-overlay flex-center"
                            style={{
                                background: 'rgba(0, 0, 0, 0.6)',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '3rem',
                                    color: 'var(--primary)',
                                    textShadow: '0 0 20px var(--primary-glow)',
                                }}
                            >
                                {getInstructionText()}
                            </div>

                            <div
                                style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    color: timeLeft <= 3 ? 'var(--error)' : 'var(--primary)',
                                }}
                            >
                                {timeLeft}s
                            </div>
                        </div>
                    )}

                    {status === 'verifying' && (
                        <div className="webcam-overlay flex-center">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>Verifying...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="webcam-overlay flex-center" style={{ background: 'rgba(16, 185, 129, 0.8)' }}>
                            <div style={{ fontSize: '4rem' }}>✓</div>
                            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Verification Successful!</p>
                        </div>
                    )}

                    {status === 'failure' && (
                        <div className="webcam-overlay flex-center" style={{ background: 'rgba(239, 68, 68, 0.8)' }}>
                            <div style={{ fontSize: '4rem' }}>✗</div>
                            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Verification Failed</p>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    {status === 'loading' && <div className="spinner"></div>}

                    {status === 'ready' && challenge && (
                        <p style={{ color: 'var(--text-muted)' }}>
                            Complete the action before the timer ends. Verification happens automatically.
                        </p>
                    )}

                    {status === 'failure' && error && (
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleRetryCamera}
                                disabled={isRetrying}
                            >
                                {isRetrying ? 'Retrying...' : 'Retry Camera'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FacialCaptcha;
