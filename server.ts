
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Database Connection
// Force IPv4 DNS resolution to prevent ENETUNREACH errors on Render
pg.defaults.family = 4;
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4 // Explicitly set for pg-pool
});

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * DATABASE SCHEMA SETUP (Reference)
 * -------------------------------
 * CREATE TABLE app_limits (user_id TEXT, app_id TEXT, limit_mins INTEGER, PRIMARY KEY(user_id, app_id));
 * CREATE TABLE usage_stats (user_id TEXT, app_id TEXT, usage_secs INTEGER, date DATE, PRIMARY KEY(user_id, app_id, date));
 * CREATE TABLE focus_sessions (id SERIAL, user_id TEXT, goal TEXT, duration INTEGER, apps_blocked JSONB, status TEXT, created_at TIMESTAMP DEFAULT NOW());
 */

const userDevices: Record<string, Set<string>> = {};

io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId as string || 'anonymous_user';
    const platform = socket.handshake.query.platform as string || 'web';

    socket.join(userId);
    socket.join(`${userId}:${platform}`); // Join platform-specific room

    if (!userDevices[userId]) userDevices[userId] = new Set();
    userDevices[userId].add(socket.id);

    console.log(`[Connect] User: ${userId} | Platform: ${platform} | Socket: ${socket.id}`);

    // --- 1. Initial Data Sync ---
    try {
        const limitsRes = await pool.query('SELECT app_id, limit_mins FROM app_limits WHERE user_id = $1', [userId]);
        const usageRes = await pool.query(
            'SELECT app_id, usage_secs FROM usage_stats WHERE user_id = $1 AND date = CURRENT_DATE',
            [userId]
        );

        socket.emit('sync:initial', {
            limits: Object.fromEntries(limitsRes.rows.map(r => [r.app_id, r.limit_mins])),
            usage: Object.fromEntries(usageRes.rows.map(r => [r.app_id, r.usage_secs]))
        });
    } catch (err) {
        console.error("Sync Error:", err);
    }

    // --- 2. Focus Session Handling ---
    socket.on('session:start', async (data) => {
        const { goal, duration, appsBlocked } = data;

        // Broadcast to all devices of this user
        io.to(userId).emit('command:block_apps', {
            apps: appsBlocked,
            duration,
            goal,
            startTime: Date.now(),
            initiatorPlatform: platform
        });

        // Special command for desktop agents if needed
        io.to(`${userId}:windows`).emit('agent:enforce_block', {
            apps: appsBlocked,
            goal: goal,
            duration: duration
        });

        try {
            await pool.query(
                'INSERT INTO focus_sessions (user_id, goal, duration, apps_blocked, status) VALUES ($1, $2, $3, $4, $5)',
                [userId, goal, duration, JSON.stringify(appsBlocked), 'active']
            );
        } catch (err) { console.error("DB Session Save Error:", err); }
    });

    socket.on('session:stop', () => {
        io.to(userId).emit('command:unblock_apps');
        io.to(`${userId}:windows`).emit('agent:release_block');
    });

    // --- 3. Limit & Usage Sync ---
    socket.on('limit:update', async ({ appId, limitMins }) => {
        try {
            await pool.query(
                'INSERT INTO app_limits (user_id, app_id, limit_mins) VALUES ($1, $2, $3) ON CONFLICT (user_id, app_id) DO UPDATE SET limit_mins = EXCLUDED.limit_mins',
                [userId, appId, limitMins]
            );
            socket.to(userId).emit('sync:limit_changed', { appId, limitMins });
        } catch (err) { console.error("Limit Save Error:", err); }
    });

    socket.on('usage:update', async ({ appId, incrementSecs }) => {
        try {
            // 1. Update usage in DB
            const usageResult = await pool.query(
                'INSERT INTO usage_stats (user_id, app_id, usage_secs, date) VALUES ($1, $2, $3, CURRENT_DATE) ' +
                'ON CONFLICT (user_id, app_id, date) DO UPDATE SET usage_secs = usage_stats.usage_secs + EXCLUDED.usage_secs ' +
                'RETURNING usage_secs',
                [userId, appId, incrementSecs]
            );

            const newUsageSecs = usageResult.rows[0].usage_secs;
            socket.to(userId).emit('sync:usage_increment', { appId, incrementSecs });

            // 2. Check against limit
            const limitResult = await pool.query(
                'SELECT limit_mins FROM app_limits WHERE user_id = $1 AND app_id = $2',
                [userId, appId]
            );

            if (limitResult.rows.length > 0) {
                const limitMins = limitResult.rows[0].limit_mins;
                if (limitMins > 0 && newUsageSecs >= limitMins * 60) {
                    console.log(`[Limit Reached] User: ${userId} | App: ${appId} | Usage: ${newUsageSecs}s | Limit: ${limitMins}m`);
                    // Trigger an automated block command for this specific app
                    io.to(userId).emit('command:block_apps', {
                        apps: [appId],
                        duration: 86400, // Block for the rest of the day (24h)
                        goal: `Daily limit reached for ${appId}`,
                        startTime: Date.now(),
                        initiatorPlatform: 'server'
                    });
                }
            }
        } catch (err) { console.error("Usage Sync/Enforce Error:", err); }
    });

    // --- 3.1 Limit Extension (Snooze) ---
    app.post('/api/limits/extend', async (req, res) => {
        const { appId, additionalMinutes, userId: bodyUserId } = req.body;
        const targetUserId = bodyUserId || userId; // Use socket userId or body userId

        try {
            // Get current limit
            const currentRes = await pool.query(
                'SELECT limit_mins FROM app_limits WHERE user_id = $1 AND app_id = $2',
                [targetUserId, appId]
            );

            const currentLimit = currentRes.rows.length > 0 ? currentRes.rows[0].limit_mins : 0;
            const newLimit = currentLimit + additionalMinutes;

            // Update DB
            await pool.query(
                'INSERT INTO app_limits (user_id, app_id, limit_mins) VALUES ($1, $2, $3) ON CONFLICT (user_id, app_id) DO UPDATE SET limit_mins = EXCLUDED.limit_mins',
                [targetUserId, appId, newLimit]
            );

            // Broadcast to all devices
            io.to(targetUserId).emit('sync:limit_changed', { appId, limitMins: newLimit });

            // Also explicitly unblock on Android/Web if they were showing the block screen
            io.to(targetUserId).emit('command:unblock_apps');

            console.log(`[Limit Extended] User: ${targetUserId} | App: ${appId} | New Limit: ${newLimit}m`);
            res.json({ success: true, newLimit });
        } catch (err) {
            console.error("Extend Limit Error:", err);
            res.status(500).json({ error: "Failed to extend limit" });
        }
    });

    // --- 3.5 Android Agent Sync ---
    socket.on('agent:android_status', (data) => {
        console.log(`[Android Status] User: ${userId} | Status:`, data);
        // Broadcast to the web client so the UI can show "Android Connected & Ready"
        io.to(`${userId}:web`).emit('sync:android_status', data);
    });

    socket.on('agent:blocked_app_event', async (data) => {
        console.log(`[Android Block Event] User: ${userId} | App: ${data.appId} | Success: ${data.success}`);
        io.to(`${userId}:web`).emit('sync:blocked_app_event', data);
    });

    // --- 4. Gemini AI Intervention Generator ---
    socket.on('intervention:request', async (data: { appId: string, goal: string }) => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `User attempted to access ${data.appId} while their focus goal was "${data.goal}". 
                Generate a 1-sentence supportive but firm encouragement and a quick 2-minute focus activity.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            encouragement: { type: Type.STRING },
                            suggestion: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            });
            socket.emit('intervention:received', JSON.parse(response.text));
        } catch (err) {
            console.error("Gemini Error:", err);
        }
    });

    socket.on('disconnect', () => {
        if (userId && userDevices[userId]) {
            userDevices[userId].delete(socket.id);
            console.log(`[Disconnect] User: ${userId} | Socket: ${socket.id}`);
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`\x1b[32m✔ FocusFlow Hub Online on port ${PORT}\x1b[0m`));
