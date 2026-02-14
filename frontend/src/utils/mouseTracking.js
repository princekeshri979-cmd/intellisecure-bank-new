/**
 * Mouse Behavior Tracking for Bot Detection
 * 
 * Tracks mouse movements and calculates entropy and velocity variance
 * to detect automated/bot-like behavior.
 */

class MouseTracker {
    constructor() {
        this.movements = [];
        this.maxSamples = 100; // Keep last 100 movements
        this.isTracking = false;
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;
        this.movements = [];

        document.addEventListener('mousemove', this.handleMouseMove);
    }

    stop() {
        this.isTracking = false;
        document.removeEventListener('mousemove', this.handleMouseMove);
    }

    handleMouseMove = (event) => {
        const now = Date.now();
        const movement = {
            x: event.clientX,
            y: event.clientY,
            timestamp: now
        };

        this.movements.push(movement);

        // Keep only recent movements
        if (this.movements.length > this.maxSamples) {
            this.movements.shift();
        }
    };

    /**
     * Calculate Shannon entropy of movement directions
     * Low entropy = repetitive/predictable = bot
     * High entropy = random/varied = human
     */
    calculateEntropy() {
        if (this.movements.length < 10) {
            return 1.0; // Not enough data, assume human
        }

        // Calculate movement vectors (angles)
        const angles = [];
        for (let i = 1; i < this.movements.length; i++) {
            const dx = this.movements[i].x - this.movements[i - 1].x;
            const dy = this.movements[i].y - this.movements[i - 1].y;

            if (dx === 0 && dy === 0) continue; // Skip stationary points

            // Quantize angle into 8 bins (N, NE, E, SE, S, SW, W, NW)
            const angle = Math.atan2(dy, dx);
            const bin = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8);
            angles.push(bin);
        }

        if (angles.length === 0) return 1.0;

        // Count frequency of each bin
        const freq = new Array(8).fill(0);
        angles.forEach(bin => freq[bin]++);

        // Calculate Shannon entropy
        let entropy = 0;
        const total = angles.length;
        freq.forEach(count => {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        });

        // Normalize to 0-1 range (max entropy for 8 bins is log2(8) = 3)
        return entropy / 3.0;
    }

    /**
     * Calculate variance in mouse velocity
     * Low variance = constant speed = bot
     * High variance = varied speed = human
     */
    calculateVelocityVariance() {
        if (this.movements.length < 10) {
            return 1.0; // Not enough data
        }

        // Calculate velocities
        const velocities = [];
        for (let i = 1; i < this.movements.length; i++) {
            const dx = this.movements[i].x - this.movements[i - 1].x;
            const dy = this.movements[i].y - this.movements[i - 1].y;
            const dt = this.movements[i].timestamp - this.movements[i - 1].timestamp;

            if (dt === 0) continue;

            const distance = Math.sqrt(dx * dx + dy * dy);
            const velocity = distance / dt; // pixels per ms
            velocities.push(velocity);
        }

        if (velocities.length === 0) return 1.0;

        // Calculate mean
        const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

        // Calculate variance
        const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;

        // Normalize (typical variance for human is ~0.5-2.0)
        // We'll cap at 2.0 and normalize to 0-1
        return Math.min(variance / 2.0, 1.0);
    }

    /**
     * Get current mouse behavior metrics
     */
    getMetrics() {
        return {
            entropy: this.calculateEntropy(),
            velocityVariance: this.calculateVelocityVariance(),
            sampleCount: this.movements.length
        };
    }

    /**
     * Reset tracking data
     */
    reset() {
        this.movements = [];
    }
}

// Singleton instance
const mouseTracker = new MouseTracker();

export default mouseTracker;
