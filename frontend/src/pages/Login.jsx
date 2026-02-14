import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { loadFaceModels, extractFaceEmbedding, getDeviceFingerprint, getIPAddress, checkLiveness } from '../utils/faceDetection';
import { useAuth } from '../context/AuthContext';
import FacialCaptcha from '../components/FacialCaptcha';
import loginBg from '../assets/login.png';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const videoRef = useRef(null);

    const [loginMethod, setLoginMethod] = useState('manual'); // 'manual' or 'face'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [tokens, setTokens] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const [modelsReady, setModelsReady] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        loadFaceModels().then(setModelsReady);

        // Restore pending facial CAPTCHA after refresh
        const pendingCaptcha = localStorage.getItem('captcha_pending') === 'true';
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        const pendingUsername = localStorage.getItem('pending_username');

        if (pendingCaptcha && storedAccessToken && storedRefreshToken) {
            setTokens({ access_token: storedAccessToken, refresh_token: storedRefreshToken });
            setShowCaptcha(true);
            if (pendingUsername) {
                setUsername(pendingUsername);
            }
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleManualLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const deviceFingerprint = getDeviceFingerprint();
            const ipAddress = await getIPAddress();

            const credentials = {
                username,
                password,
                device_fingerprint: deviceFingerprint,
                ip_address: ipAddress,
                user_agent: navigator.userAgent,
            };

            const response = await authAPI.login(credentials);
            const { access_token, refresh_token, requires_facial_captcha } = response.data;
            console.log('[Login] Response:', { requires_facial_captcha, access_token: !!access_token });

            if (requires_facial_captcha) {
                console.log('[Login] Triggering Facial CAPTCHA');
                // Store tokens in localStorage for API access, but DO NOT update AuthContext yet
                // preventing immediate redirect to dashboard
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);
                localStorage.setItem('captcha_pending', 'true');
                localStorage.setItem('pending_username', username);

                setTokens({ access_token, refresh_token });
                setShowCaptcha(true);
            } else {
                // Login directly
                login(access_token, refresh_token, { username });
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceLogin = async () => {
        if (!modelsReady) {
            setError('Face detection models not ready');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // STEP 1: Select Random Challenge
            const CHALLENGES = ['BLINK_EYES', 'SMILE', 'TURN_HEAD_LEFT', 'TURN_HEAD_RIGHT'];
            const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

            const INSTRUCTIONS = {
                'BLINK_EYES': 'Please BLINK your eyes to verify liveness',
                'SMILE': 'Please SMILE to verify liveness',
                'TURN_HEAD_LEFT': 'Please Turn Head LEFT to verify liveness',
                'TURN_HEAD_RIGHT': 'Please Turn Head RIGHT to verify liveness'
            };

            // Display Challenge
            setError(INSTRUCTIONS[randomChallenge]);

            // STEP 2: Verify Liveness with Timeout
            let verified = false;
            const startTime = Date.now();
            const TIMEOUT_MS = 8000; // 8 seconds to complete action

            while (Date.now() - startTime < TIMEOUT_MS) {
                const livenessResult = await checkLiveness(videoRef.current, randomChallenge);

                if (livenessResult.verified) {
                    verified = true;
                    break;
                }

                // Wait small delay before next check
                await new Promise(r => setTimeout(r, 200));
            }

            if (!verified) {
                throw new Error(`Liveness check failed. Did not detect ${randomChallenge}.`);
            }

            setError('Liveness Verified! Logging in...');

            // STEP 3: Extract Embedding & Login
            const result = await extractFaceEmbedding(videoRef.current);

            if (!result.success) {
                setError(result.error || 'Failed to detect face');
                setLoading(false);
                return;
            }

            const deviceFingerprint = getDeviceFingerprint();
            const ipAddress = await getIPAddress();

            const faceData = {
                face_embedding: result.embedding,
                device_fingerprint: deviceFingerprint,
                ip_address: ipAddress,
                user_agent: navigator.userAgent,
            };

            const response = await authAPI.autoLogin(faceData);

            // Auto-fill username
            setUsername(response.data.username);
            setLoginMethod('manual');

            // Stop camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setShowCamera(false);

            alert(`Welcome ${response.data.name}! Please enter your password.`);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Face recognition failed');
        } finally {
            setLoading(false);
        }
    };


    const startFaceLogin = async () => {
        console.log('[Login] Starting face login camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            console.log('[Login] Camera stream obtained');

            setStream(mediaStream);
            setShowCamera(true);
            setLoginMethod('face');

            // Wait a bit for React to render the video element
            await new Promise(resolve => setTimeout(resolve, 100));

            if (videoRef.current) {
                console.log('[Login] Video element found, assigning stream');
                videoRef.current.srcObject = mediaStream;

                // Wait for video to be ready with timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.error('[Login] Video metadata timeout');
                        reject(new Error('Video metadata loading timeout'));
                    }, 5000);

                    videoRef.current.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        console.log('[Login] Video metadata loaded');
                        videoRef.current.play()
                            .then(() => {
                                console.log('[Login] Video is playing');
                                resolve();
                            })
                            .catch(err => {
                                console.error('[Login] Video play error:', err);
                                resolve(); // Resolve anyway
                            });
                    };
                });
                console.log('[Login] Video is ready');
            } else {
                console.error('[Login] Video element not found!');
            }

            console.log('[Login] Camera setup complete');
        } catch (err) {
            console.error('[Login] Camera error:', err);
            setError('Camera access denied');
        }
    };

    const handleCaptchaSuccess = () => {
        // CAPTCHA passed, complete login
        if (tokens) {
            localStorage.removeItem('captcha_pending');
            localStorage.removeItem('pending_username');
            login(tokens.access_token, tokens.refresh_token, { username });
            navigate('/dashboard');
        }
    };

    const handleCaptchaFailure = () => {
        setError('Facial CAPTCHA failed. Please try logging in again.');
        localStorage.removeItem('captcha_pending');
        localStorage.removeItem('pending_username');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setShowCaptcha(false);
        setTokens(null);
    };

    if (showCaptcha && tokens) {
        return (
            <FacialCaptcha
                onSuccess={handleCaptchaSuccess}
                onFailure={handleCaptchaFailure}
            />
        );
    }

    return (
        <div
            className="container"
            style={{
                minHeight: '100vh',
                paddingTop: '4rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Image Layer */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 0,
                    backgroundImage: `url(${loginBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Overlay with mouse-tracking gradient */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `
                            radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, 
                                rgba(0, 243, 255, 0.1), 
                                transparent 40%),
                            radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
                                rgba(124, 58, 237, 0.08), 
                                transparent 50%),
                            rgba(10, 14, 39, 0.3)
                        `,
                        transition: 'background 0.3s ease-out'
                    }}
                />
            </div>

            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <h1 className="text-center" style={{ marginBottom: '2rem', color: 'var(--primary)' }}>
                    Login - IntelliSecure Bank
                </h1>

                {error && (
                    <div className="alert alert-error animate-slide-in">
                        {error}
                    </div>
                )}

                {!showCamera && (
                    <>
                        <form onSubmit={handleManualLogin}>
                            <div className="form-group">
                                <label style={{ color: '#000000' }}>Username</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ color: '#000000' }}>Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div style={{ margin: '1.5rem 0', textAlign: 'center', color: '#000000', fontWeight: '600' }}>
                            - OR -
                        </div>

                        <button
                            type="button"
                            className="btn-secondary w-full"
                            onClick={startFaceLogin}
                            disabled={!modelsReady || loading}
                        >
                            {modelsReady ? '👤 Login with Face' : 'Loading models...'}
                        </button>
                    </>
                )}

                {showCamera && (
                    <div>
                        <p className="text-center mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Position your face in the camera
                        </p>
                        <div className="webcam-container">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    transform: 'scaleX(-1)'
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn-primary w-full mt-2"
                            onClick={handleFaceLogin}
                            disabled={loading}
                        >
                            {loading ? 'Recognizing...' : 'Recognize Face'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary w-full mt-2"
                            onClick={() => {
                                if (stream) {
                                    stream.getTracks().forEach(track => track.stop());
                                }
                                setShowCamera(false);
                                setLoginMethod('manual');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <p className="text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <a href="/register" style={{ color: 'var(--primary)' }}>
                        Register
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Login;
