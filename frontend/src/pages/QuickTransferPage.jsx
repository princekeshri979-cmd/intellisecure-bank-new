import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import QuickTransfer from '../components/QuickTransfer';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function QuickTransferPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [requiresCaptcha, setRequiresCaptcha] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');

    const applyThreatUpdate = (data) => {
        if (!data) return;

        if (typeof data.score === 'number') {
            setThreatScore(data.score);
        }

        const reasons = Array.isArray(data.triggers) ? data.triggers : [];
        setThreatTriggers(reasons);

        if (typeof data.requires_facial_captcha === 'boolean') {
            setRequiresCaptcha(data.requires_facial_captcha);
            if (data.requires_facial_captcha) {
                setShowCaptcha(true);
                setCaptchaReason(reasons[0] || 'Reverification required');
            }
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
    };

    const handleCaptchaFailure = () => {
        alert('Facial verification failed. Please try again.');
    };

    // Security meter calculations
    const normalizedScore = Math.min(Math.max(threatScore, 0), 100);
    const riskLevel = normalizedScore < 30
        ? 'Low'
        : normalizedScore < 70
            ? 'Medium'
            : 'High';
    const riskReasons = threatTriggers.length > 0
        ? threatTriggers.slice(0, 2)
        : ['No active risk signals'];
    const riskDegrees = Math.round(normalizedScore * 3.6);

    return (
        <>
            <div className="dashboard-modern">
                <Navbar />

                {showCaptcha && (
                    <div className="captcha-overlay">
                        {captchaReason && (
                            <div className="captcha-banner">
                                {captchaReason}
                            </div>
                        )}
                        <FacialCaptcha
                            onSuccess={handleCaptchaSuccess}
                            onFailure={handleCaptchaFailure}
                        />
                    </div>
                )}

                <div className="dashboard-container">
                    {/* Page Header */}
                    <div className="hero-section fade-in">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                <span className="gradient-text">Quick Transfer</span>
                            </h1>
                            <p className="hero-subtitle">
                                Send money instantly with AI-powered security monitoring
                            </p>
                        </div>
                    </div>

                    {/* Quick Transfer Component */}
                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <QuickTransfer />
                    </div>
                </div>

                {/* Security Monitoring */}
                <ContinuousMonitoring
                    onThreatUpdate={applyThreatUpdate}
                    onCaptchaRequired={handleCaptchaRequired}
                />

                {/* Security Monitor Widget */}
                <div className="security-monitor-floating">
                    <div className="security-meter-visual">
                        <svg className="security-circle" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle
                                cx="60" cy="60" r="54" fill="none"
                                stroke={riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8" strokeDasharray={`${riskDegrees} 360`} strokeLinecap="round"
                                transform="rotate(-90 60 60)" style={{ transition: 'all 0.5s ease' }}
                            />
                        </svg>
                        <div className="security-meter-content">
                            <div className="security-score" style={{ color: riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444' }}>
                                {Math.round(normalizedScore)}%
                            </div>
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

export default QuickTransferPage;
