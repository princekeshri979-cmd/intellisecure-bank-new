import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './SecurityBlog.css';

function LiveCameraFeedBlog() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="security-blog">
                {/* Hero Section */}
                <div className="blog-hero">
                    <div className="blog-icon">📹</div>
                    <h1>Live Camera Feed Monitoring</h1>
                    <p>
                        Continuous visual surveillance using your device camera to ensure you're the only one
                        accessing your account through advanced face detection and liveness verification.
                    </p>
                </div>

                {/* Main Content */}
                <div className="blog-content">
                    {/* Overview Section */}
                    <div className="blog-section">
                        <h2>What is Live Camera Feed?</h2>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e1' }}>
                            The Live Camera Feed is a revolutionary security feature that uses your device's camera
                            to continuously monitor who is accessing your account. Using advanced face detection
                            technology, it ensures that only you can perform sensitive banking operations. The system
                            runs discreetly in the background, providing an additional layer of biometric security
                            without interrupting your banking experience.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="blog-section">
                        <h2>Key Features</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="feature-card-icon">👤</span>
                                <h3>Face Detection</h3>
                                <p>
                                    Real-time face detection using face-api.js to identify and track faces in
                                    the camera feed, ensuring continuous user presence verification.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🎭</span>
                                <h3>Liveness Detection</h3>
                                <p>
                                    Advanced algorithms detect spoofing attempts using photos, videos, or masks,
                                    ensuring only live, genuine users can access the account.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">👥</span>
                                <h3>Multiple Face Alert</h3>
                                <p>
                                    Automatically detects when multiple people are present and increases threat
                                    score to prevent unauthorized shoulder surfing or coercion.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">📡</span>
                                <h3>Heartbeat Monitoring</h3>
                                <p>
                                    Regular heartbeat signals sent to the server ensure continuous connection
                                    and immediate detection of any monitoring interruptions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="blog-section">
                        <h2>Benefits</h2>
                        <ul className="benefits-list">
                            <li>
                                <div>
                                    <strong>Continuous Verification:</strong> Unlike one-time authentication, the camera
                                    continuously verifies your presence throughout your banking session.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Anti-Spoofing Protection:</strong> Sophisticated liveness detection prevents
                                    attackers from using photos, videos, or 3D masks to bypass security.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Coercion Detection:</strong> Detects when multiple people are present,
                                    potentially indicating forced access or unauthorized viewing.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Privacy Focused:</strong> Video feed is processed locally on your device
                                    and never stored or transmitted to servers.
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* How It Works */}
                    <div className="how-it-works">
                        <h2 style={{ marginBottom: '2rem' }}>How It Works</h2>
                        <div className="steps-container">
                            <div className="step-item">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h3>Camera Activation</h3>
                                    <p>
                                        When you log in to your dashboard, the system requests camera access. Once granted,
                                        the live feed begins monitoring in the background.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>Face Detection</h3>
                                    <p>
                                        Advanced AI models detect faces in real-time, analyzing facial landmarks and
                                        features to verify user presence and detect potential spoofing.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Continuous Analysis</h3>
                                    <p>
                                        The system continuously monitors for suspicious patterns like camera blocking,
                                        multiple faces, or absence of face detection.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">4</div>
                                <div className="step-content">
                                    <h3>Threat Response</h3>
                                    <p>
                                        If anomalies are detected, the threat score increases and additional verification
                                        may be required to continue banking operations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-section">
                        <h2>See It In Action</h2>
                        <p>Experience continuous camera monitoring on your dashboard</p>
                        <button className="cta-button" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LiveCameraFeedBlog;
