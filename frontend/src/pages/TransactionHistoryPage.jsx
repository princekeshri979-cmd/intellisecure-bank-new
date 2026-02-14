import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bankingAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function TransactionHistoryPage() {
    const { user } = useAuth();
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

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
        fetchTransactions();
        return () => wsManager.off('threat_update', applyThreatUpdate);
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await bankingAPI.getTransactions();
            // Ensure data is an array
            if (Array.isArray(data)) {
                setTransactions(data);
            } else if (data && Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

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
                                <span className="gradient-text">Transaction History</span>
                            </h1>
                            <p className="hero-subtitle">
                                View all your transactions with advanced security monitoring
                            </p>
                        </div>
                    </div>

                    <div className="content-grid" style={{ marginTop: '2rem' }}>
                        <div className="card modern-card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Recent Transactions</h2>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div className="spinner"></div>
                                </div>
                            ) : transactions.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No transactions found</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {transactions.map((txn, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                                    {txn.type === 'credit' ? '📥' : '📤'} {txn.description || 'Transaction'}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                    {new Date(txn.timestamp || Date.now()).toLocaleString()}
                                                </div>
                                            </div>
                                            <div style={{
                                                fontWeight: '700',
                                                fontSize: '1.1rem',
                                                color: txn.type === 'credit' ? '#10b981' : '#ef4444'
                                            }}>
                                                {txn.type === 'credit' ? '+' : '-'}${Math.abs(txn.amount || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ContinuousMonitoring onThreatUpdate={applyThreatUpdate} onCaptchaRequired={handleCaptchaRequired} />

                {/* Security Monitor Widget */}
                <div className="security-monitor-floating">
                    <div className="security-meter-visual">
                        <svg className="security-circle" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke={riskLevel === 'Low' ? '#10b981' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                strokeDasharray={`${riskDegrees} 360`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'all 0.5s ease' }}
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

export default TransactionHistoryPage;
