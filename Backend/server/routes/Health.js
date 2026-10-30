'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const RedisService = require('../utils/redis');

// ─── Helper: ping the DB pool with timeout ──────────────────────────────────
function pingDatabase() {
    return new Promise((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            resolve({ connected: false, error: 'Database query timeout (5000ms)' });
        }, 5000);

        pool.query('SELECT 1', (err) => {
            if (timedOut) return;
            clearTimeout(timer);
            if (err) {
                resolve({ connected: false, error: err.message });
            } else {
                resolve({ connected: true });
            }
        });
    });
}

// ─── GET /health  (Combined health reporting) ────────────────────────────────
router.get('/', async (req, res) => {
    const timestamp = new Date().toISOString();
    const db = await pingDatabase();
    const redis = await RedisService.checkHealth();

    const isHealthy = db.connected;
    const statusCode = isHealthy ? 200 : 503;

    return res.status(statusCode).json({
        status: isHealthy ? (redis.status === 'connected' || redis.enabled === false ? 'healthy' : 'degraded') : 'unhealthy',
        message: isHealthy ? 'ClikGett API is running' : 'ClikGett API is running but database is unavailable',
        service: 'clikgett-backend',
        environment: process.env.NODE_ENV || 'development',
        dependencies: {
            database: {
                type: 'mysql',
                status: db.connected ? 'connected' : 'disconnected',
                host: process.env.DB_HOST || process.env.HOST || 'unknown',
                error: db.error || null
            },
            redis: {
                status: redis.status,
                enabled: redis.enabled,
                host: redis.host || null,
                latencyMs: redis.latencyMs || null
            }
        },
        timestamp
    });
});

// ─── GET /health/db (Dedicated database connectivity check) ─────────────────
router.get('/db', async (req, res) => {
    const timestamp = new Date().toISOString();
    const db = await pingDatabase();

    if (db.connected) {
        return res.status(200).json({
            status: 'healthy',
            database: 'connected',
            service: 'clikgett-backend',
            host: process.env.DB_HOST || process.env.HOST || 'unknown',
            port: process.env.DB_PORT || 3306,
            dbName: process.env.DB_NAME || process.env.db || 'unknown',
            timestamp
        });
    } else {
        return res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            service: 'clikgett-backend',
            host: process.env.DB_HOST || process.env.HOST || 'unknown',
            error: db.error || 'Connection failed',
            timestamp
        });
    }
});

// ─── GET /health/redis (Dedicated Redis check) ──────────────────────────────
router.get('/redis', async (req, res) => {
    const timestamp = new Date().toISOString();
    const redis = await RedisService.checkHealth();

    const statusCode = redis.status === 'connected' ? 200 : (redis.enabled ? 503 : 200);

    return res.status(statusCode).json({
        service: 'clikgett-backend',
        redis,
        timestamp
    });
});

// ─── POST /health/redis/test (Safe set/get/del verification) ─────────────────
router.post('/redis/test', async (req, res) => {
    if (!RedisService.isAvailable()) {
        return res.status(503).json({
            status: 'error',
            message: 'Redis is not connected or disabled',
            available: false
        });
    }

    const testKey = `clikgett:health:test:${Date.now()}`;
    const testVal = { probe: 'ok', timestamp: new Date().toISOString() };

    try {
        const setOk = await RedisService.set(testKey, testVal, 30);
        const retrieved = await RedisService.get(testKey);
        const delOk = await RedisService.del(testKey);

        const passed = setOk && retrieved && retrieved.probe === 'ok' && delOk;

        return res.status(passed ? 200 : 500).json({
            status: passed ? 'success' : 'failed',
            message: passed ? 'Redis set/get/del operations verified successfully' : 'Redis operations failed',
            operations: {
                set: setOk,
                get: retrieved,
                delete: delOk
            }
        });
    } catch (e) {
        return res.status(500).json({
            status: 'error',
            message: e.message
        });
    }
});

module.exports = router;
