import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './SecurityBlog.css';

function FaceVerificationBlog() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="security-blog">
                {/* Hero Section */}
                <div className="blog-hero">
                    <div className="blog-icon">🔒</div>
                    <h1>Biometric Face Verification</h1>
                    <p>
                        Advanced facial recognition technology that replaces traditional passwords with secure,
                        convenient biometric authentication for seamless and protected access to your account.
                    </p>
                </div>

                {/* Main Content */}
                <div className="blog-content">
                    {/* Overview Section */}
                    <div className="blog-section">
                        <h2>What is Face Verification?</h2>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e1' }}>
                            Face Verification is our cutting-edge biometric authentication system that uses advanced
                            facial recognition technology to verify your identity. Instead of remembering complex
                            passwords, simply look at your device camera to gain instant access. The system compares
                            your live face against stored facial embeddings to ensure secure, password-free authentication
                            that's both convenient and highly secure.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="blog-section">
                        <h2>Key Features</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="feature-card-icon">🎯</span>
                                <h3>Auto-Login</h3>
                                <p>
                                    Automatically log in to your account just by looking at the camera. No need to
                                    type usernames or passwords - your face is your credential.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🔐</span>
                                <h3>Facial CAPTCHA</h3>
                                <p>
                                    When high-risk activities are detected, the system triggers a facial CAPTCHA
                                    that requires live face verification to proceed.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🧬</span>
                                <h3>Face Embeddings</h3>
                                <p>
                                    Your facial features are converted into secure mathematical embeddings that
                                    are stored encrypted and never as actual images.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">⚡</span>
                                <h3>Instant Verification</h3>
                                <p>
                                    Face matching happens in milliseconds, providing seamless authentication
                                    without any noticeable delay in your banking experience.
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
                                    <strong>Password-Free Access:</strong> Eliminate the need to remember complex
                                    passwords or worry about password theft and phishing attacks.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Enhanced Security:</strong> Biometric data is unique to you and cannot
                                    be easily stolen, shared, or replicated like traditional passwords.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Convenience:</strong> Access your account instantly with just a glance,
                                    making banking faster and more user-friendly.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Privacy Protected:</strong> Facial data is encrypted and stored securely,
                                    with strict privacy controls and no sharing with third parties.
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
                                    <h3>Face Enrollment</h3>
                                    <p>
                                        During registration, your face is captured and converted into a unique mathematical
                                        embedding that represents your facial features.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>Secure Storage</h3>
                                    <p>
                                        The facial embedding is encrypted and stored securely in our database. The actual
                                        image is never stored, only the mathematical representation.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Live Capture</h3>
                                    <p>
                                        When you attempt to log in or verify your identity, your live face is captured
                                        and converted into a temporary embedding for comparison.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">4</div>
                                <div className="step-content">
                                    <h3>Matching & Access</h3>
                                    <p>
                                        The system compares the live embedding with your stored embedding. If they match
                                        within the threshold, access is granted instantly.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-section">
                        <h2>Try Face Verification</h2>
                        <p>Experience password-free banking with biometric authentication</p>
                        <button className="cta-button" onClick={() => navigate('/register')}>
                            Register Now
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default FaceVerificationBlog;
