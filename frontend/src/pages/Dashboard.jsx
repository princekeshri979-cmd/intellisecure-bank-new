import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bankingAPI, monitoringAPI } from '../utils/api';
import Navbar from '../components/Navbar';

import ContinuousMonitoring from '../components/ContinuousMonitoring';
import FacialCaptcha from '../components/FacialCaptcha';
import QuickTransfer from '../components/QuickTransfer';

import wsManager from '../utils/websocket';
import './Dashboard.css';

const HIGH_RISK_THRESHOLD = 75;

function Dashboard() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [threatScore, setThreatScore] = useState(0);
    const [threatTriggers, setThreatTriggers] = useState([]);
    const [requiresCaptcha, setRequiresCaptcha] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaReason, setCaptchaReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [animatedBalance, setAnimatedBalance] = useState(0);

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

    // Animate balance counting up
    useEffect(() => {
        if (balance !== null) {
            const duration = 1500;
            const steps = 60;
            const increment = balance / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= balance) {
                    setAnimatedBalance(balance);
                    clearInterval(timer);
                } else {
                    setAnimatedBalance(current);
                }
            }, duration / steps);
            return () => clearInterval(timer);
        }
    }, [balance]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // In a real app, we'd fetch actual data. For demo, we might need error handling if endpoints aren't ready
                try {
                    const balanceRes = await bankingAPI.getBalance();
                    setBalance(balanceRes.data.balance);
                } catch (e) { setBalance(10000); }

                try {
                    const txRes = await bankingAPI.getTransactions(5);
                    setTransactions(txRes.data);
                } catch (e) { setTransactions([]); }

                try {
                    const threatRes = await monitoringAPI.getThreatScore();
                    applyThreatUpdate(threatRes.data);
                } catch (e) {
                    setThreatScore(0);
                    setThreatTriggers([]);
                    setRequiresCaptcha(false);
                }

                setLoading(false);
            } catch (err) {
                console.error('Dashboard load error:', err);
                setLoading(false);
            }
        };

        loadData();

        // Listen for real-time threat updates
        const handleThreatUpdate = (data) => {
            applyThreatUpdate(data);
        };

        wsManager.on('threat_update', handleThreatUpdate);

        return () => {
            wsManager.off('threat_update', handleThreatUpdate);
        };
    }, []);

    const handleCaptchaRequired = (reason) => {
        setShowCaptcha(true);
        if (reason) {
            setCaptchaReason(reason);
        }
    };

    const handleCaptchaSuccess = async () => {
        setShowCaptcha(false);
        setRequiresCaptcha(false);
        setCaptchaReason('');

        try {
            const threatRes = await monitoringAPI.getThreatScore();
            applyThreatUpdate(threatRes.data);
        } catch (err) {
            console.error('Threat refresh failed after CAPTCHA:', err);
        }
    };

    const handleCaptchaFailure = () => {
        setShowCaptcha(true);
        setCaptchaReason('Facial CAPTCHA failed. Please retry.');
    };

    const normalizedScore = Math.max(0, Math.min(100, Number(threatScore) || 0));
    const riskColor = normalizedScore < 35
        ? '#10b981'
        : normalizedScore < HIGH_RISK_THRESHOLD
            ? '#f59e0b'
            : '#ef4444';
    const riskLabel = normalizedScore < 35
        ? 'Low'
        : normalizedScore < HIGH_RISK_THRESHOLD
            ? 'Medium'
            : 'High';
    const riskReasons = threatTriggers.length > 0
        ? threatTriggers.slice(0, 2)
        : ['No active risk signals'];
    const riskDegrees = Math.round(normalizedScore * 3.6);

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner"></div></div>;

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
                    {/* Hero Section with Split Layout */}
                    <div className="hero-section fade-in">
                        <div className="hero-content">
                            <div className="hero-left">
                                <h1 className="hero-title">
                                    Welcome back, <span className="gradient-text">{user?.username || 'User'}</span>
                                </h1>
                                <p className="hero-subtitle">
                                    Your financial security is our priority. Monitor your account with advanced AI-powered protection.
                                </p>

                                {/* Trust Badges */}
                                <div className="trust-badges">
                                    <div className="badge floating">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <path d="M9 12l2 2 4-4" />
                                        </svg>
                                        <span>256-bit Encryption</span>
                                    </div>
                                    <div className="badge floating" style={{ animationDelay: '0.1s' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <span>Biometric Auth</span>
                                    </div>
                                    <div className="badge floating" style={{ animationDelay: '0.2s' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                        <span>AI Monitoring</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-right">
                                {/* Balance Card with Gradient */}
                                <div className="balance-card floating" style={{ animationDelay: '0.3s' }}>
                                    <div className="balance-header">
                                        <span className="balance-label">Total Balance</span>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23" />
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                    <div className="balance-amount gradient-text">
                                        ${animatedBalance.toFixed(2)}
                                    </div>
                                    <div className="balance-footer">
                                        <span>Account: {user?.account_no || '****8899'}</span>
                                        <span className="balance-change positive">+2.5% this month</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="content-grid">
                        {/* Quick Actions Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Quick Transfer */}
                            <div className="card modern-card fade-in" style={{ animationDelay: '0.4s' }}>
                                <h3 className="card-title">Quick Transfer</h3>
                                <QuickTransfer />
                            </div>

                            {/* Bill Payments - Moved here */}
                            <div className="card modern-card fade-in" style={{ animationDelay: '0.6s' }}>
                                <h3 className="card-title">Bill Payments</h3>
                                <div className="bill-grid">
                                    {['Electricity', 'Water', 'Internet', 'Credit Card'].map((bill, idx) => (
                                        <div key={bill} className="bill-item" style={{ animationDelay: `${0.7 + idx * 0.1}s` }}>
                                            <div className="bill-icon">
                                                {bill === 'Electricity' && '⚡'}
                                                {bill === 'Water' && '💧'}
                                                {bill === 'Internet' && '🌐'}
                                                {bill === 'Credit Card' && '💳'}
                                            </div>
                                            <span>{bill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="card modern-card fade-in" style={{ animationDelay: '0.5s' }}>
                            <h3 className="card-title">Recent Activity</h3>
                            <div className="transactions-list">
                                {transactions.length > 0 ? transactions.map((tx, i) => (
                                    <div key={i} className="transaction-item" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                                        <div className="transaction-icon" style={{
                                            background: tx.type === 'CREDIT' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        }}>
                                            {tx.type === 'CREDIT' ? '↓' : '↑'}
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-name">{tx.description}</div>
                                            <div className="transaction-date">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                        </div>
                                        <div className="transaction-amount" style={{
                                            color: tx.type === 'CREDIT' ? '#10b981' : '#ef4444'
                                        }}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="empty-state">No recent transactions</p>
                                )}
                            </div>
                        </div>

                        {/* Empty Space - Placeholder for future content */}
                        <div className="card modern-card fade-in" style={{ animationDelay: '0.7s' }}>
                            <h3 className="card-title">Quick Actions</h3>
                            <div style={{
                                padding: '3rem 2rem',
                                textAlign: 'center',
                                color: '#94a3b8',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>Space reserved for additional features</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Floating Security Meter Widget - Bottom Left Corner */}
                <div className="floating-security-widget">
                    <div className="security-widget-header">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Security Monitor</span>
                    </div>

                    <div className="security-meter-container">
                        <svg className="security-meter-svg" viewBox="0 0 120 120">
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
                                stroke={riskColor}
                                strokeWidth="8"
                                strokeDasharray={`${riskDegrees * 0.942} 339.292`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                className="security-meter-progress"
                            />
                        </svg>
                        <div className="security-meter-content">
                            <div className="security-score" style={{ color: riskColor }}>
                                {Math.round(normalizedScore)}%
                            </div>
                            <div className="security-label">{riskLabel} Risk</div>
                        </div>
                    </div>

                    <div className="security-reasons">
                        {riskReasons.map((reason, index) => (
                            <div key={index} className="security-reason-item">
                                <div className="reason-dot" style={{ background: riskColor }}></div>
                                <span>{reason}</span>
                            </div>
                        ))}
                    </div>

                    {requiresCaptcha && (
                        <div className="security-alert">
                            ⚠️ Reverification Required
                        </div>
                    )}
                </div>

                {/* Continuous Monitoring Widget - Only if User is NOT Admin */}
                {user?.username !== 'admin' && !showCaptcha && (
                    <ContinuousMonitoring
                        onThreatUpdate={applyThreatUpdate}
                        onCaptchaRequired={handleCaptchaRequired}
                    />
                )}
            </div>
        </>
    );
}

export default Dashboard;
