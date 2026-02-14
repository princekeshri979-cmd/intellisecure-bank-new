import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logoImg from '../assets/logo.jpg';

const LandingPage = () => {
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const [mobileMenuActive, setMobileMenuActive] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles = [];
        const particleCount = 100;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function connectParticles() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.strokeStyle = `rgba(102, 126, 234, ${0.2 * (1 - distance / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            connectParticles();
            requestAnimationFrame(animate);
        }

        init();
        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuActive(!mobileMenuActive);
        document.body.style.overflow = !mobileMenuActive ? 'hidden' : 'auto';
    };

    const toggleDropdown = (dropdown) => {
        if (window.innerWidth <= 768) {
            setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
        }
    };

    const handleNavClick = (e, href) => {
        e.preventDefault();

        // If it's the login link, navigate to login page
        if (href === '/login') {
            navigate('/login');
            return;
        }

        // Otherwise scroll to section
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setMobileMenuActive(false);
            document.body.style.overflow = 'auto';
        }
    };

    return (
        <div className="landing-page">
            <canvas ref={canvasRef} id="particleCanvas"></canvas>

            {/* Navigation */}
            <nav>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                        src={logoImg}
                        alt="IntelliSecure Bank Logo"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #667eea',
                            boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
                        }}
                    />
                    IntelliSecure Bank
                </div>
                <ul className={`nav-links ${mobileMenuActive ? 'active' : ''}`}>
                    <li><a href="#home" onClick={(e) => handleNavClick(e, '#home')}>Home</a></li>
                    <li className={`dropdown ${activeDropdown === 'cards' ? 'active' : ''}`}>
                        <a href="#cards" className="dropdown-toggle" onClick={() => toggleDropdown('cards')}>
                            Cards <span className="arrow">▾</span>
                        </a>
                        <ul className="dropdown-menu">
                            <li><a href="#credit-cards">Credit Cards</a></li>
                            <li><a href="#debit-cards">Debit Cards</a></li>
                            <li><a href="#prepaid-cards">Prepaid Cards</a></li>
                            <li><a href="#business-cards">Business Cards</a></li>
                        </ul>
                    </li>
                    <li className={`dropdown ${activeDropdown === 'insurance' ? 'active' : ''}`}>
                        <a href="#insurance" className="dropdown-toggle" onClick={() => toggleDropdown('insurance')}>
                            Insurance <span className="arrow">▾</span>
                        </a>
                        <ul className="dropdown-menu">
                            <li><a href="#life-insurance">Life Insurance</a></li>
                            <li><a href="#health-insurance">Health Insurance</a></li>
                            <li><a href="#auto-insurance">Auto Insurance</a></li>
                            <li><a href="#home-insurance">Home Insurance</a></li>
                            <li><a href="#travel-insurance">Travel Insurance</a></li>
                        </ul>
                    </li>
                    <li><a href="#features" onClick={(e) => handleNavClick(e, '#features')}>Features</a></li>
                    <li className={`dropdown ${activeDropdown === 'security' ? 'active' : ''}`}>
                        <a href="#security" className="dropdown-toggle" onClick={() => toggleDropdown('security')}>
                            Security <span className="arrow">▾</span>
                        </a>
                        <ul className="dropdown-menu">
                            <li><a href="#auto-login">Auto Login with Face</a></li>
                            <li><a href="#facial-captcha">Facial Captcha Verification</a></li>
                            <li><a href="#live-monitoring">Live Monitoring</a></li>
                            <li><a href="#bot-detection">Bot Detection</a></li>
                        </ul>
                    </li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <div className={`mobile-menu-toggle ${mobileMenuActive ? 'active' : ''}`} onClick={toggleMobileMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero" id="home">
                <div className="hero-content">
                    <h1 className="floating">Banking Reimagined for the Digital Age</h1>
                    <p>Experience next-generation financial security with intelligent protection, seamless transactions, and
                        cutting-edge technology that puts you in complete control.</p>
                    <Link to="/login" className="cta-button">Discover More</Link>
                </div>
            </section>

            {/* Features Section */}
            <FeaturesSection />

            {/* Security Section */}
            <SecuritySection />

            {/* Stats Section */}
            <StatsSection />

            {/* Advanced Security Section */}
            <AdvancedSecuritySection />

            {/* Footer */}
            <footer>
                <p>&copy; 2024 IntelliSecure Bank. All rights reserved. Your security is our priority.</p>
            </footer>
        </div>
    );
};

// Features Section Component
const FeaturesSection = () => {
    const features = [
        { icon: '🔒', title: 'Advanced Encryption', desc: 'Military-grade encryption protects your data with multiple layers of security, ensuring your information remains confidential and secure at all times.' },
        { icon: '🛡️', title: 'Real-Time Monitoring', desc: 'AI-powered fraud detection monitors every transaction instantly, identifying suspicious activity and protecting your accounts 24/7 with machine learning algorithms.' },
        { icon: '⚡', title: 'Instant Transfers', desc: 'Send and receive money in seconds with our high-speed payment infrastructure, enabling seamless transactions across all platforms and devices.' },
        { icon: '📱', title: 'Mobile First', desc: 'Manage your finances anywhere with our intuitive mobile app, featuring biometric authentication and a sleek interface designed for modern banking.' },
        { icon: '🌐', title: 'Global Access', desc: 'Access your accounts from anywhere in the world with secure cloud infrastructure, multi-currency support, and international payment capabilities.' },
        { icon: '💎', title: 'Premium Support', desc: 'Dedicated customer service team available around the clock, providing personalized assistance and expert financial guidance whenever you need it.' }
    ];

    return (
        <section className="features" id="features">
            <h2 className="section-title">Intelligent Security Features</h2>
            <Carousel items={features} type="features" />
        </section>
    );
};

// Security Section Component
const SecuritySection = () => {
    const securityFeatures = [
        { icon: '👤', title: 'Auto Login with Face', desc: 'Experience seamless access with our advanced facial recognition technology. Simply look at your device and gain instant, secure access to your account without typing passwords.', badge: 'Biometric Auth' },
        { icon: '🔐', title: 'Facial Captcha Verification', desc: 'Enhanced verification using AI-powered facial recognition captcha. Our intelligent system ensures only you can access your account, preventing unauthorized access attempts.', badge: 'AI Verification' },
        { icon: '📊', title: 'Live Monitoring', desc: 'Real-time surveillance of all account activities with instant alerts. Our 24/7 monitoring system tracks transactions, login attempts, and unusual patterns to keep you protected.', badge: '24/7 Active' },
        { icon: '🤖', title: 'Bot Detection', desc: 'Advanced machine learning algorithms identify and block automated bot attacks. Our intelligent system analyzes behavior patterns to distinguish genuine users from malicious bots.', badge: 'ML Powered' }
    ];

    return (
        <section className="features security-section" id="security">
            <h2 className="section-title">Advanced Security Protection</h2>
            <Carousel items={securityFeatures} type="security" isSecurity={true} />
        </section>
    );
};

// Stats Section Component
const StatsSection = () => (
    <section className="stats">
        <div className="stats-grid">
            <div className="stat-item">
                <div className="stat-number">2M+</div>
                <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
                <div className="stat-number">$50B+</div>
                <div className="stat-label">Secured Assets</div>
            </div>
            <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-item">
                <div className="stat-number">150+</div>
                <div className="stat-label">Countries</div>
            </div>
        </div>
    </section>
);

// Advanced Security Section Component
const AdvancedSecuritySection = () => {
    const advancedFeatures = [
        {
            icon: '👤',
            title: 'Auto Login with Face',
            desc: 'Seamlessly access your account with advanced facial recognition technology. Our AI-powered system instantly identifies and authenticates you in milliseconds, providing secure and password-free access.',
            features: ['✓ 3D Face Mapping', '✓ Liveness Detection', '✓ Anti-Spoofing'],
            animation: 'face-scan'
        },
        {
            icon: '🔐',
            title: 'Facial CAPTCHA Verification',
            desc: 'Revolutionary facial CAPTCHA system replaces traditional text puzzles with secure biometric verification. Quick, user-friendly, and virtually impossible to bypass by automated systems.',
            features: ['✓ Real-Time Verification', '✓ Gesture Recognition', '✓ Multi-Factor Auth'],
            animation: 'captcha-scan'
        },
        {
            icon: '📡',
            title: 'Live Monitoring',
            desc: '24/7 real-time surveillance of all account activities with AI-powered threat detection. Instant alerts for suspicious transactions, login attempts, and unusual patterns to keep your finances secure.',
            features: ['✓ Real-Time Alerts', '✓ Anomaly Detection', '✓ Activity Dashboard'],
            animation: 'live-monitor'
        },
        {
            icon: '🤖',
            title: 'Bot Detection',
            desc: 'Advanced machine learning algorithms identify and block automated attacks. Our sophisticated bot detection system analyzes behavior patterns to distinguish humans from malicious bots.',
            features: ['✓ Behavioral Analysis', '✓ Pattern Recognition', '✓ Automated Blocking'],
            animation: 'bot-detect'
        }
    ];

    return (
        <section className="security-section advanced-security" id="advanced-security">
            <h2 className="section-title">Advanced Security Systems</h2>
            <AdvancedCarousel items={advancedFeatures} />
        </section>
    );
};

// Carousel Component
const Carousel = ({ items, type, isSecurity = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState(0);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div className="carousel-container">
            <div className="carousel-nav prev" onClick={prevSlide}>
                <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </div>
            <div className="carousel-wrapper" ref={wrapperRef} data-carousel={type}
                style={{ transform: `translateX(-${currentIndex * 420}px)` }}>
                {items.map((item, index) => (
                    <div key={index} className={`feature-card ${isSecurity ? 'security-card' : ''}`}>
                        <div className="feature-icon">{item.icon}</div>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                        {item.badge && <div className="security-badge">{item.badge}</div>}
                    </div>
                ))}
            </div>
            <div className="carousel-nav next" onClick={nextSlide}>
                <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </div>
            <div className="carousel-dots">
                {items.map((_, index) => (
                    <div key={index} className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}></div>
                ))}
            </div>
        </div>
    );
};

// Advanced Carousel Component
const AdvancedCarousel = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [items.length]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div className="security-carousel-container">
            <div className="carousel-nav security-prev" onClick={prevSlide}>
                <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </div>
            <div className="security-carousel-wrapper" style={{ transform: `translateX(-${currentIndex * 420}px)` }}>
                {items.map((item, index) => (
                    <div key={index} className="security-card">
                        <div className="security-icon-wrapper">
                            <div className="security-icon">{item.icon}</div>
                            <div className={`security-animation ${item.animation}`}></div>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.desc}</p>
                        <div className="security-features-list">
                            {item.features.map((feature, idx) => (
                                <div key={idx} className="security-feature-item">{feature}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="carousel-nav security-next" onClick={nextSlide}>
                <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </div>
            <div className="security-carousel-dots">
                {items.map((_, index) => (
                    <div key={index} className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}></div>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;
