import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function LoansCreditPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');

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
    };

    const handleCaptchaFailure = () => {
        alert('Facial verification failed. Please try again.');
    };

    const normalizedScore = Math.min(Math.max(threatScore, 0), 100);
    const riskLevel = normalizedScore < 30 ? 'Low' : normalizedScore < 70 ? 'Medium' : 'High';
    const riskReasons = threatTriggers.length > 0 ? threatTriggers.slice(0, 2) : ['No active risk signals'];
    const riskDegrees = Math.round(normalizedScore * 3.6);

    const loanOptions = [
        { id: 'personal', name: 'Personal Loan', rate: '8.5%', icon: '👤' },
        { id: 'home', name: 'Home Loan', rate: '6.5%', icon: '🏠' },
        { id: 'auto', name: 'Auto Loan', rate: '7.0%', icon: '🚗' },
        { id: 'education', name: 'Education Loan', rate: '5.5%', icon: '🎓' }
    ];

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
                                <span className="gradient-text">Loans & Credit</span>
                            </h1>
                            <p className="hero-subtitle">
                                Explore loan options and manage your credit with secure verification
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Available Loan Options</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {loanOptions.map(loan => (
                                    <div
                                        key={loan.id}
                                        style={{
                                            padding: '1.5rem',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{loan.icon}</div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{loan.name}</h3>
                                        <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                                            {loan.rate}
                                        </div>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleCaptchaRequired('Loan application verification required')}
                                            style={{ width: '100%' }}
                                        >
                                            Apply Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card modern-card" style={{ marginTop: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Credit Score</h2>
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ fontSize: '4rem', fontWeight: '800', color: '#10b981', marginBottom: '1rem' }}>
                                    750
                                </div>
                                <div style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Excellent</div>
                                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                    <p style={{ margin: 0, color: '#cbd5e1' }}>
                                        Your credit score is in excellent standing. You qualify for premium loan rates.
                                    </p>
                                </div>
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

export default LoansCreditPage;
