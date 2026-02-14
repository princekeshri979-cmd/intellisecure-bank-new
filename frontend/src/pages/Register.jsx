import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { loadFaceModels, extractFaceEmbedding, getDeviceFingerprint, getIPAddress } from '../utils/faceDetection';
import { useAuth } from '../context/AuthContext';
import loginBg from '../assets/login.png';

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        account_no: '',
        mobile: '',
    });

    const [faceEmbedding, setFaceEmbedding] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelsReady, setModelsReady] = useState(false);

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

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const startCamera = async () => {
        console.log('[Register] Starting camera...');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            console.log('[Register] Camera stream obtained', mediaStream);

            setStream(mediaStream);
            setShowCamera(true);

            // Wait a bit for React to render the video element
            await new Promise(resolve => setTimeout(resolve, 100));

            if (videoRef.current) {
                console.log('[Register] Video element found, assigning stream');
                videoRef.current.srcObject = mediaStream;

                // Wait for video to be ready with timeout
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.error('[Register] Video metadata timeout');
                        reject(new Error('Video metadata loading timeout'));
                    }, 5000);

                    videoRef.current.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        console.log('[Register] Video metadata loaded');
                        videoRef.current.play()
                            .then(() => {
                                console.log('[Register] Video is playing');
                                resolve();
                            })
                            .catch(err => {
                                console.error('[Register] Video play error:', err);
                                resolve(); // Resolve anyway
                            });
                    };
                });
                console.log('[Register] Video is ready');
            } else {
                console.error('[Register] Video element not found!');
            }

            console.log('[Register] Camera setup complete');
        } catch (err) {
            console.error('[Register] Camera error:', err);
            setError('Camera access denied. Face enrollment is optional.');
        }
    };

    const captureFace = async () => {
        console.log('[Register] Capture face button clicked');
        console.log('[Register] Models ready:', modelsReady);
        console.log('[Register] Video element:', videoRef.current);
        console.log('[Register] Video ready state:', videoRef.current?.readyState);
        console.log('[Register] Video paused:', videoRef.current?.paused);

        if (!modelsReady) {
            console.error('[Register] Models not ready');
            setError('Face detection models not loaded yet');
            return;
        }

        setCapturing(true);
        setError('');

        console.log('[Register] Attempting to extract face embedding...');
        const result = await extractFaceEmbedding(videoRef.current);
        console.log('[Register] Face extraction result:', result);

        if (result.success) {
            console.log('[Register] Face captured successfully!');
            setFaceEmbedding(result.embedding);
            setError('');
            alert('Face captured successfully! ✓');

            // Stop camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setShowCamera(false);
        } else {
            console.error('[Register] Face capture failed:', result.error);
            setError(result.error || 'Failed to detect face. Please try again.');
        }

        setCapturing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const deviceFingerprint = getDeviceFingerprint();
            const ipAddress = await getIPAddress();

            const userData = {
                ...formData,
                face_embedding: faceEmbedding,
            };

            const response = await authAPI.register(userData);

            const { access_token, refresh_token } = response.data;

            // Login user
            login(access_token, refresh_token, {
                username: formData.username,
                name: formData.name,
            });

            navigate('/dashboard');
        } catch (err) {
            console.error('[Register] Registration error:', err.response?.data);

            // Handle FastAPI validation errors (422)
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    // Format validation errors
                    const errors = err.response.data.detail.map(e =>
                        `${e.loc.join('.')}: ${e.msg}`
                    ).join(', ');
                    setError(errors);
                } else if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else {
                    setError(JSON.stringify(err.response.data.detail));
                }
            } else {
                setError('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

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

            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <h1 className="text-center" style={{ marginBottom: '2rem', color: 'var(--primary)' }}>
                    Register - IntelliSecure Bank
                </h1>

                {error && (
                    <div className="alert alert-error animate-slide-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            minLength={3}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Account Number</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.account_no}
                            onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                            required
                            minLength={10}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Mobile Number</label>
                        <input
                            type="tel"
                            className="input-field"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            required
                            placeholder="+1234567890"
                            pattern="^\\+?\\d{10,15}$"
                            title="Enter 10-15 digits. Optional + at start (e.g., +1234567890 or 9876543210)"
                        />
                        <small style={{ color: '#000000', fontSize: '0.875rem' }}>
                            Format: +1234567890 or 9876543210 (10-15 digits)
                        </small>
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#000000' }}>Face Enrollment (Optional)</label>
                        <p style={{ color: '#000000', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Enroll your face for enhanced security and auto-login
                        </p>

                        {!showCamera && !faceEmbedding && (
                            <button
                                type="button"
                                className="btn-secondary w-full"
                                onClick={startCamera}
                                disabled={!modelsReady}
                            >
                                {modelsReady ? '📸 Start Face Enrollment' : 'Loading models...'}
                            </button>
                        )}

                        {faceEmbedding && (
                            <div className="alert alert-success">
                                ✓ Face enrolled successfully
                            </div>
                        )}

                        {showCamera && (
                            <div className="webcam-container mt-2">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    style={{ width: '100%', borderRadius: '8px' }}
                                />
                                <button
                                    type="button"
                                    className="btn-primary w-full mt-2"
                                    onClick={captureFace}
                                    disabled={capturing}
                                >
                                    {capturing ? 'Capturing...' : 'Capture Face'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="text-center mt-4" style={{ color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <a href="/login" style={{ color: 'var(--primary)' }}>
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Register;
