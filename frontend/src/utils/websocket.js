const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.reconnectInterval = null;
    }

    connect(token) {
        if (!token) {
            console.error('WebSocket connection failed: No token provided');
            return;
        }

        const fullUrl = `${WS_URL}/ws/${token}`;

        // Prevent redundant connections (Strict Mode fix)
        if (this.socket) {
            if (this.socket.url === fullUrl &&
                (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
                // Already connecting/connected to the same URL
                return;
            }
            // Close old socket if different
            this.socket.close();
        }

        console.log('Connecting to WebSocket:', fullUrl);

        try {
            this.socket = new WebSocket(fullUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.emit('connected', {});
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.emit('disconnected', {});

                // Attempt reconnect if not explicitly disconnected
                if (!this.reconnectInterval && this.socket) { // Only reconnect if socket wasn't nulled (explicit disconnect)
                    this.reconnectInterval = setInterval(() => {
                        console.log('Attempting WebSocket reconnect...');
                        this.connect(token);
                    }, 5000);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Native websockets receive a single 'message' event.
                    // We expect our backend to send JSON with a 'type' or 'event' field
                    // to multiplex logical events, OR we just support specific data schemas.

                    // Assuming backend sends { type: 'event_name', data: { ... } }
                    // If not, we emit a generic 'message' event
                    if (data.type) {
                        this.emit(data.type, data.data || data);
                    } else {
                        this.emit('message', data);
                    }

                    // Also emit universal event for debugging
                    this.emit('any', data);

                } catch (e) {
                    console.error('Failed to parse WebSocket message:', event.data);
                }
            };

        } catch (err) {
            console.error('WebSocket connection error:', err);
        }
    }

    disconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => {
                callback(data);
            });
        }
    }

    send(data) {
        if (this.socket && this.isConnected) {
            this.socket.send(JSON.stringify(data));
        }
    }
}

// Singleton instance
const wsManager = new WebSocketManager();

export default wsManager;
