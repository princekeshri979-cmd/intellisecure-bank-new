import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function SecuritySettingsPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [settings, setSettings] = useState({
        twoFactorAuth: true,
        emailNotifications: true,
        smsAlerts: false,
        biometricLogin: true
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
        alert('Security settings updated successfully!');
    };

    const handleCaptchaFailure = () => {
        alert('Facial verification failed. Please try again.');
    };

    const handleToggle = (setting) => {
        setSettings({ ...settings, [setting]: !settings[setting] });
        handleCaptchaRequired('Security settings change verification required');
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
                                <span className="gradient-text">Security Settings</span>
                            </h1>
                            <p className="hero-subtitle">
                                Configure your security preferences with biometric verification
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Security Preferences</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {Object.entries({
                                    twoFactorAuth: { label: 'Two-Factor Authentication', icon: '🔐' },
                                    emailNotifications: { label: 'Email Notifications', icon: '📧' },
                                    smsAlerts: { label: 'SMS Security Alerts', icon: '📱' },
                                    biometricLogin: { label: 'Biometric Login', icon: '👤' }
                                }).map(([key, { label, icon }]) => (
                                    <div
                                        key={key}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                                            <span>{label}</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(key)}
                                            style={{
                                                padding: '0.5rem 1.5rem',
                                                borderRadius: '20px',
                                                border: 'none',
                                                background: settings[key] ? '#10b981' : '#6b7280',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {settings[key] ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                ))}
                            </div>
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

export default SecuritySettingsPage;
