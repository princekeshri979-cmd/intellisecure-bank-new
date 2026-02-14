import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function BillPaymentsPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [selectedBiller, setSelectedBiller] = useState('');
    const [amount, setAmount] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

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

    const handlePayment = () => {
        if (!selectedBiller || !amount || !accountNumber) {
            alert('Please fill all fields');
            return;
        }
        handleCaptchaRequired('Bill payment verification required');
    };

    const normalizedScore = Math.min(Math.max(threatScore, 0), 100);
    const riskLevel = normalizedScore < 30 ? 'Low' : normalizedScore < 70 ? 'Medium' : 'High';
    const riskReasons = threatTriggers.length > 0 ? threatTriggers.slice(0, 2) : ['No active risk signals'];
    const riskDegrees = Math.round(normalizedScore * 3.6);

    const billers = [
        { id: 'electricity', name: '⚡ Electricity', icon: '⚡' },
        { id: 'water', name: '💧 Water', icon: '💧' },
        { id: 'internet', name: '🌐 Internet', icon: '🌐' },
        { id: 'phone', name: '📱 Mobile', icon: '📱' },
        { id: 'gas', name: '🔥 Gas', icon: '🔥' },
        { id: 'insurance', name: '🛡️ Insurance', icon: '🛡️' }
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
                                <span className="gradient-text">Bill Payments</span>
                            </h1>
                            <p className="hero-subtitle">
                                Pay your utility bills securely with AI-powered fraud protection
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Select Biller</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                {billers.map(biller => (
                                    <div
                                        key={biller.id}
                                        onClick={() => setSelectedBiller(biller.id)}
                                        style={{
                                            padding: '1.5rem',
                                            border: selectedBiller === biller.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: selectedBiller === biller.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{biller.icon}</div>
                                        <div style={{ fontSize: '0.9rem' }}>{biller.name.replace(/[⚡💧🌐📱🔥🛡️]/g, '').trim()}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Account Number</label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="Enter account number"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handlePayment}
                                    className="btn-primary"
                                    style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}
                                >
                                    Pay Bill
                                </button>
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

export default BillPaymentsPage;
