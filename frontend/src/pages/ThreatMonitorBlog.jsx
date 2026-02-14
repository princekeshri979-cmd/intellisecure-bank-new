import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './SecurityBlog.css';

function ThreatMonitorBlog() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="security-blog">
                {/* Hero Section */}
                <div className="blog-hero">
                    <div className="blog-icon">🛡️</div>
                    <h1>AI-Powered Threat Monitor</h1>
                    <p>
                        Real-time threat detection and prevention system that uses advanced machine learning
                        to protect your account from unauthorized access and suspicious activities.
                    </p>
                </div>

                {/* Main Content */}
                <div className="blog-content">
                    {/* Overview Section */}
                    <div className="blog-section">
                        <h2>What is Threat Monitor?</h2>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e1' }}>
                            Our Threat Monitor is an intelligent security system that continuously analyzes your account
                            activity in real-time. Using advanced AI algorithms, it detects anomalies, identifies potential
                            threats, and takes immediate action to protect your financial assets. The system assigns a
                            dynamic threat score based on various risk factors and triggers additional verification when needed.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="blog-section">
                        <h2>Key Features</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="feature-card-icon">📊</span>
                                <h3>Real-Time Scoring</h3>
                                <p>
                                    Dynamic threat score that updates instantly based on your activity patterns,
                                    login locations, device fingerprints, and behavioral analysis.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🤖</span>
                                <h3>AI Detection</h3>
                                <p>
                                    Machine learning algorithms identify bot-like behavior, automated attacks,
                                    and suspicious mouse movements to prevent unauthorized access.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🌍</span>
                                <h3>Location Tracking</h3>
                                <p>
                                    Monitors login locations and flags unusual geographic patterns that might
                                    indicate account compromise or unauthorized access attempts.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">⚡</span>
                                <h3>Instant Alerts</h3>
                                <p>
                                    Immediate notifications when high-risk activities are detected, with automatic
                                    triggers for additional verification steps like facial CAPTCHA.
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
                                    <strong>24/7 Protection:</strong> Continuous monitoring ensures your account
                                    is protected around the clock, even when you're not actively using it.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Proactive Defense:</strong> Identifies and blocks threats before they
                                    can cause damage to your account or financial assets.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Adaptive Security:</strong> Learns from your behavior patterns to
                                    reduce false positives while maintaining high security standards.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Peace of Mind:</strong> Know that advanced AI is constantly working
                                    to keep your banking experience safe and secure.
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
                                    <h3>Continuous Monitoring</h3>
                                    <p>
                                        The system tracks every interaction with your account, including login attempts,
                                        mouse movements, device fingerprints, and transaction patterns.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h3>AI Analysis</h3>
                                    <p>
                                        Advanced algorithms analyze the collected data in real-time, comparing it against
                                        known threat patterns and your historical behavior.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h3>Threat Scoring</h3>
                                    <p>
                                        A dynamic threat score is calculated based on multiple risk factors. Higher scores
                                        indicate potential security concerns that require attention.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">4</div>
                                <div className="step-content">
                                    <h3>Automated Response</h3>
                                    <p>
                                        When threats are detected, the system automatically triggers additional verification
                                        steps like facial CAPTCHA or temporarily restricts certain actions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-section">
                        <h2>Experience Advanced Security</h2>
                        <p>See the Threat Monitor in action on your dashboard</p>
                        <button className="cta-button" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ThreatMonitorBlog;
