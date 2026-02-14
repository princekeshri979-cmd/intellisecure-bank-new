import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function LinkedDevicesPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [devices] = useState([
        { id: 1, name: 'Windows PC', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
        { id: 2, name: 'iPhone 13', location: 'New York, USA', lastActive: '1 hour ago', current: false },
        { id: 3, name: 'MacBook Pro', location: 'Boston, USA', lastActive: '2 days ago', current: false }
    ]);

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
        alert('Device removed successfully!');
    };

    const handleCaptchaFailure = () => {
        alert('Facial verification failed. Please try again.');
    };

    const handleRemoveDevice = (deviceId) => {
        handleCaptchaRequired('Device removal verification required');
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
                                <span className="gradient-text">Linked Devices</span>
                            </h1>
                            <p className="hero-subtitle">
                                Manage devices with access to your account
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Your Devices</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {devices.map(device => (
                                    <div
                                        key={device.id}
                                        style={{
                                            padding: '1.5rem',
                                            background: device.current ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                            border: device.current ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem' }}>
                                                    {device.name.includes('iPhone') ? '📱' : device.name.includes('Mac') ? '💻' : '🖥️'}
                                                </span>
                                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{device.name}</span>
                                                {device.current && (
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        background: '#10b981',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                                📍 {device.location} • Last active: {device.lastActive}
                                            </div>
                                        </div>
                                        {!device.current && (
                                            <button
                                                onClick={() => handleRemoveDevice(device.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
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

export default LinkedDevicesPage;
