import axios from 'axios';

// Use relative URL for Vite proxy (development) or full URL (production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    const isPublicAuthRoute = config.url && [
        '/api/auth/register',
        '/api/auth/login',
        '/api/auth/login-auto',
        '/api/auth/refresh',
    ].some((route) => config.url.includes(route));

    if (token) {
        // console.log(`[API] Attaching token to ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicAuthRoute) {
        console.warn(`[API] No token found for ${config.url}`);
    }
    return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    register: (userData) => api.post('/api/auth/register', userData),
    login: (credentials) => api.post('/api/auth/login', credentials),
    autoLogin: (faceData) => api.post('/api/auth/login-auto', faceData),
    logout: () => api.post('/api/auth/logout'),
};

// Facial CAPTCHA API
export const facialCaptchaAPI = {
    getChallenge: () => api.get('/api/facial-captcha/challenge'),
    verifyChallenge: (verificationData) =>
        api.post('/api/facial-captcha/verify', verificationData),
};

// Monitoring API
export const monitoringAPI = {
    sendHeartbeat: (signals) => api.post('/api/monitoring/heartbeat', signals),
    getThreatScore: () => api.get('/api/monitoring/threat-score'),
};

// Face Verification API
export const faceVerificationAPI = {
    verifyFace: (live_embedding) => api.post('/api/face-verification/check', { live_embedding }),
};

// Banking API
export const bankingAPI = {
    getBalance: () => api.get('/api/banking/balance'),
    getTransactions: (limit = 20) =>
        api.get('/api/banking/transactions', { params: { limit } }),
    createPayment: (paymentData) =>
        api.post('/api/banking/payment', paymentData),
    lockAccount: () => api.post('/api/banking/account/lock'),
    unlockAccount: () => api.post('/api/banking/account/unlock'),
};

export default api;
