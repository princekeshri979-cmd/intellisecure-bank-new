import React, { createContext, useContext, useState, useEffect } from 'react';
import wsManager from '../utils/websocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);
    const [captchaPending, setCaptchaPending] = useState(
        localStorage.getItem('captcha_pending') === 'true'
    );

    useEffect(() => {
        // Check if user is logged in
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        const pending = localStorage.getItem('captcha_pending') === 'true';

        setCaptchaPending(pending);

        if (storedToken && storedUser && !pending) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));

            // Connect WebSocket
            wsManager.connect(storedToken);
        }

        setLoading(false);
    }, []);

    const login = (accessToken, refreshToken, userData) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('captcha_pending');
        localStorage.removeItem('pending_username');

        setToken(accessToken);
        setUser(userData);
        setCaptchaPending(false);

        // Connect WebSocket
        wsManager.connect(accessToken);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        setCaptchaPending(false);

        // Disconnect WebSocket
        wsManager.disconnect();
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user && !captchaPending,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
