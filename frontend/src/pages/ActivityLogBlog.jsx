import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './SecurityBlog.css';

function ActivityLogBlog() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="security-blog">
                {/* Hero Section */}
                <div className="blog-hero">
                    <div className="blog-icon">📝</div>
                    <h1>Comprehensive Activity Log</h1>
                    <p>
                        Complete audit trail of all account activities, security events, and transactions
                        to help you monitor your account and detect any unauthorized access or suspicious behavior.
                    </p>
                </div>

                {/* Main Content */}
                <div className="blog-content">
                    {/* Overview Section */}
                    <div className="blog-section">
                        <h2>What is Activity Log?</h2>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#cbd5e1' }}>
                            The Activity Log is your comprehensive security dashboard that records every action taken
                            on your account. From login attempts and transactions to security alerts and verification
                            events, everything is logged with timestamps, IP addresses, and device information. This
                            transparency allows you to review your account history and quickly identify any unauthorized
                            activities or security concerns.
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="blog-section">
                        <h2>Key Features</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="feature-card-icon">📋</span>
                                <h3>Complete History</h3>
                                <p>
                                    Every login, transaction, security event, and account change is recorded
                                    with detailed information for complete transparency.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🕐</span>
                                <h3>Timestamp Tracking</h3>
                                <p>
                                    Precise timestamps for every event help you track when activities occurred
                                    and identify patterns or anomalies in your account usage.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🌐</span>
                                <h3>Location & Device Info</h3>
                                <p>
                                    See the IP address, location, and device fingerprint for each login and
                                    transaction to verify legitimate access.
                                </p>
                            </div>
                            <div className="feature-card">
                                <span className="feature-card-icon">🔍</span>
                                <h3>Search & Filter</h3>
                                <p>
                                    Easily search and filter logs by date, event type, or activity to quickly
                                    find specific information you're looking for.
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
                                    <strong>Full Transparency:</strong> Complete visibility into all account activities
                                    gives you control and awareness of your banking security.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Early Detection:</strong> Quickly spot unauthorized access attempts or
                                    suspicious transactions before they cause significant damage.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Audit Trail:</strong> Maintain a permanent record of all activities for
                                    compliance, dispute resolution, or personal record-keeping.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>Security Insights:</strong> Analyze patterns in your activity log to
                                    understand your security posture and identify areas for improvement.
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* What Gets Logged */}
                    <div className="how-it-works">
                        <h2 style={{ marginBottom: '2rem' }}>What Gets Logged</h2>
                        <div className="steps-container">
                            <div className="step-item">
                                <div className="step-number">🔐</div>
                                <div className="step-content">
                                    <h3>Authentication Events</h3>
                                    <p>
                                        All login attempts (successful and failed), auto-login via face recognition,
                                        logout events, and session timeouts with device and location details.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">💰</div>
                                <div className="step-content">
                                    <h3>Financial Transactions</h3>
                                    <p>
                                        Every transfer, bill payment, deposit, and withdrawal with amounts, recipients,
                                        timestamps, and transaction IDs for complete financial tracking.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">⚠️</div>
                                <div className="step-content">
                                    <h3>Security Alerts</h3>
                                    <p>
                                        Threat score changes, facial CAPTCHA triggers, bot detection alerts, and any
                                        security-related events that affect your account protection.
                                    </p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-number">⚙️</div>
                                <div className="step-content">
                                    <h3>Account Changes</h3>
                                    <p>
                                        Profile updates, security settings modifications, linked device changes, and
                                        any other account configuration adjustments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-section">
                        <h2>View Your Activity Log</h2>
                        <p>Check your complete account history and security events</p>
                        <button className="cta-button" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ActivityLogBlog;
