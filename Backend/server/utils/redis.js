'use strict';

const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let client = null;
let isConnected = false;

if (REDIS_ENABLED) {
    try {
        client = new Redis({
            host: REDIS_HOST,
            port: REDIS_PORT,
            password: REDIS_PASSWORD,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 5) {
                    console.warn('[Redis] Max reconnection attempts reached. Redis will remain inactive.');
                    return null;
                }
                const delay = Math.min(times * 200, 2000);
                return delay;
            },
            enableOfflineQueue: false
        });

        client.on('connect', () => {
            isConnected = true;
            console.log(`[Redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
        });

        client.on('error', (err) => {
            isConnected = false;
            // Log as warning rather than crashing the Express process
            console.warn(`[Redis] Connection warning: ${err.message}`);
        });

        client.on('close', () => {
            isConnected = false;
        });

        // Attempt initial connection asynchronously without blocking server startup
        client.connect().catch((err) => {
            console.warn(`[Redis] Initial connection deferred (${err.message}). Continuing in offline mode.`);
        });
    } catch (e) {
        console.warn(`[Redis] Initialization skipped: ${e.message}`);
        client = null;
    }
} else {
    console.log('[Redis] Disabled via REDIS_ENABLED=false');
}

const RedisService = {
    isAvailable: () => isConnected && client !== null,

    ping: async () => {
        if (!client || !isConnected) return false;
        try {
            const pong = await client.ping();
            return pong === 'PONG';
        } catch (e) {
            return false;
        }
    },

    get: async (key) => {
        if (!client || !isConnected) return null;
        try {
            const val = await client.get(key);
            if (!val) return null;
            try {
                return JSON.parse(val);
            } catch (_) {
                return val;
            }
        } catch (e) {
            console.warn(`[Redis] GET failed for key "${key}":`, e.message);
            return null;
        }
    },

    set: async (key, value, ttlSeconds = 300) => {
        if (!client || !isConnected) return false;
        try {
            const payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
            if (ttlSeconds && ttlSeconds > 0) {
                await client.set(key, payload, 'EX', ttlSeconds);
            } else {
                await client.set(key, payload);
            }
            return true;
        } catch (e) {
            console.warn(`[Redis] SET failed for key "${key}":`, e.message);
            return false;
        }
    },

    del: async (key) => {
        if (!client || !isConnected) return false;
        try {
            await client.del(key);
            return true;
        } catch (e) {
            console.warn(`[Redis] DEL failed for key "${key}":`, e.message);
            return false;
        }
    },

    checkHealth: async () => {
        if (!REDIS_ENABLED) {
            return { enabled: false, status: 'disabled' };
        }
        if (!client || !isConnected) {
            return { enabled: true, status: 'disconnected', host: REDIS_HOST, port: REDIS_PORT };
        }
        try {
            const start = Date.now();
            const pong = await client.ping();
            const latencyMs = Date.now() - start;
            return {
                enabled: true,
                status: pong === 'PONG' ? 'connected' : 'degraded',
                latencyMs,
                host: REDIS_HOST,
                port: REDIS_PORT
            };
        } catch (e) {
            return { enabled: true, status: 'error', error: e.message };
        }
    },

    quit: async () => {
        if (client) {
            try {
                await client.quit();
            } catch (_) {
                client.disconnect();
            }
        }
    }
};

module.exports = RedisService;
