import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';
import './Navbar.css';

function Navbar() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Hide navbar on login/register pages
    if (['/login', '/register'].includes(location.pathname)) return null;

    const isAdmin = user?.username === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDropdown = (dropdown) => {
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    };

    const closeDropdowns = () => {
        setActiveDropdown(null);
    };

    return (
        <nav className="dashboard-navbar">
            <div
                className="logo"
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            >
                <img
                    src={logoImg}
                    alt="IntelliSecure Bank Logo"
                    className="logo-img"
                />
                IntelliSecure Bank
            </div>

            <div className="nav-links-container">
                {!isAdmin && (
                    <>
                        <a
                            onClick={() => { navigate('/dashboard'); closeDropdowns(); }}
                            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                        >
                            Dashboard
                        </a>

                        {/* Services Dropdown */}
                        <div
                            className={`nav-dropdown ${activeDropdown === 'services' ? 'active' : ''}`}
                            onMouseEnter={() => toggleDropdown('services')}
                            onMouseLeave={closeDropdowns}
                        >
                            <a className="nav-link dropdown-toggle">
                                Services <span className="arrow">▾</span>
                            </a>
                            <ul className="dropdown-menu">
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/services/quick-transfer')}>
                                        <span className="dropdown-icon">💸</span>
                                        Quick Transfer
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/services/bill-payments')}>
                                        <span className="dropdown-icon">📄</span>
                                        Bill Payments
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/services/transactions')}>
                                        <span className="dropdown-icon">📊</span>
                                        Transaction History
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/services/loans-credit')}>
                                        <span className="dropdown-icon">💰</span>
                                        Loans & Credit
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Account Dropdown */}
                        <div
                            className={`nav-dropdown ${activeDropdown === 'account' ? 'active' : ''}`}
                            onMouseEnter={() => toggleDropdown('account')}
                            onMouseLeave={closeDropdowns}
                        >
                            <a className="nav-link dropdown-toggle">
                                Account <span className="arrow">▾</span>
                            </a>
                            <ul className="dropdown-menu">
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/account/profile')}>
                                        <span className="dropdown-icon">👤</span>
                                        Profile Settings
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/account/security')}>
                                        <span className="dropdown-icon">🔐</span>
                                        Security Settings
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/account/devices')}>
                                        <span className="dropdown-icon">📱</span>
                                        Linked Devices
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/account/notifications')}>
                                        <span className="dropdown-icon">🔔</span>
                                        Notifications
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Security Dropdown */}
                        <div
                            className={`nav-dropdown ${activeDropdown === 'security' ? 'active' : ''}`}
                            onMouseEnter={() => toggleDropdown('security')}
                            onMouseLeave={closeDropdowns}
                        >
                            <a className="nav-link dropdown-toggle">
                                Security <span className="arrow">▾</span>
                            </a>
                            <ul className="dropdown-menu">
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/security/threat-monitor')}>
                                        <span className="dropdown-icon">🛡️</span>
                                        Threat Monitor
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/security/live-camera')}>
                                        <span className="dropdown-icon">📹</span>
                                        Live Camera Feed
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/security/face-verification')}>
                                        <span className="dropdown-icon">🔒</span>
                                        Face Verification
                                    </a>
                                </li>
                                <li onClick={closeDropdowns}>
                                    <a onClick={() => navigate('/security/activity-log')}>
                                        <span className="dropdown-icon">📝</span>
                                        Activity Log
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {isAdmin && (
                    <a
                        onClick={() => navigate('/admin')}
                        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    >
                        Admin Panel
                    </a>
                )}

                <span className="user-badge">
                    <span className="user-icon">👤</span>
                    {user?.username || 'User'}
                </span>

                <button className="btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
