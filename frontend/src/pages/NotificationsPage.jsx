import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function NotificationsPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [notifications, setNotifications] = useState({
        transactionAlerts: true,
        securityAlerts: true,
        loginNotifications: true,
        marketingEmails: false
    });

    const applyThreatUpdate = (data) => {
        if (!data) return;
        if (typeof data.score === 'number') setThreatScore(data.score);
        const reasons = Array.isArray(data.triggers) ? data.triggers : [];
        setThreatTriggers(reasons);
        if (typeof data.requires_facial_captcha === 'boolean' && data.requires_facial_captcha) {
            setShowCaptcha(true);
            setCaptchaReason(reasons[0] || 'Reverification required');
        }
        if (typeof data.score === 'number' && data.score >= HIGH_RISK_THRESHOLD) {
            setShowCaptcha(true);
            setCaptchaReason(reasons[0] || 'High risk detected');
        }
    };

    useEffect(() => {
        wsManager.on('threat_update', applyThreatUpdate);
        return () => wsManager.off('threat_update', applyThreatUpdate);
    }, []);

    const handleCaptchaRequired = (reason) => {
        setShowCaptcha(true);
        setCaptchaReason(reason || 'Verification required');
    };

    const handleCaptchaSuccess = () => {
        setShowCaptcha(false);
        setCaptchaReason('');
        alert('Notification preferences updated!');
    };

    const handleCaptchaFailure = () => {
        alert('Facial verification failed. Please try again.');
    };

    const handleToggle = (setting) => {
        setNotifications({ ...notifications, [setting]: !notifications[setting] });
    };

    const normalizedScore = Math.min(Math.max(threatScore, 0), 100);
    const riskLevel = normalizedScore < 30 ? 'Low' : normalizedScore < 70 ? 'Medium' : 'High';
    const riskReasons = threatTriggers.length > 0 ? threatTriggers.slice(0, 2) : ['No active risk signals'];
    const riskDegrees = Math.round(normalizedScore * 3.6);

    return (
        <>
            <div className="dashboard-modern">
                <Navbar />

                {showCaptcha && (
                    <div className="captcha-overlay">
                        {captchaReason && <div className="captcha-banner">{captchaReason}</div>}
                        <FacialCaptcha onSuccess={handleCaptchaSuccess} onFailure={handleCaptchaFailure} />
                    </div>
                )}

                <div className="dashboard-container">
                    <div className="hero-section fade-in">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                <span className="gradient-text">Notifications</span>
                            </h1>
                            <p className="hero-subtitle">
                                Configure your notification preferences
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Notification Preferences</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {Object.entries({
                                    transactionAlerts: { label: 'Transaction Alerts', desc: 'Get notified for all transactions', icon: '💰' },
                                    securityAlerts: { label: 'Security Alerts', desc: 'Receive security threat notifications', icon: '🛡️' },
                                    loginNotifications: { label: 'Login Notifications', desc: 'Alert on new device logins', icon: '🔐' },
                                    marketingEmails: { label: 'Marketing Emails', desc: 'Promotional offers and updates', icon: '📧' }
                                }).map(([key, { label, desc, icon }]) => (
                                    <div
                                        key={key}
                                        style={{
                                            padding: '1.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <span style={{ fontSize: '2rem' }}>{icon}</span>
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{label}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{desc}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(key)}
                                            style={{
                                                padding: '0.5rem 1.5rem',
                                                borderRadius: '20px',
                                                border: 'none',
                                                background: notifications[key] ? '#10b981' : '#6b7280',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {notifications[key] ? 'On' : 'Off'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleCaptchaRequired('Notification settings verification required')}
                                className="btn-primary"
                                style={{ marginTop: '2rem', padding: '1rem', fontSize: '1rem', width: '100%' }}
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>

                <ContinuousMonitoring onThreatUpdate={applyThreatUpdate} onCaptchaRequired={handleCaptchaRequired} />

                <div className="security-monitor-floating">
                    <div className="security-meter-visual">
                        <svg className="security-circle" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle cx="60" cy="60" r="54" fill="none" stroke={riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeDasharray={`${riskDegrees} 360`} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'all 0.5s ease' }} />
                        </svg>
                        <div className="security-meter-content">
                            <div className="security-score" style={{ color: riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444' }}>{Math.round(normalizedScore)}%</div>
                            <div className="security-label">{riskLevel} Risk</div>
                        </div>
                    </div>
                    <div className="security-reasons">
                        {riskReasons.map((reason, index) => (
                            <div key={index} className="security-reason-item">
                                <div className="reason-dot" style={{ background: riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444' }}></div>
                                <span>{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default NotificationsPage;
