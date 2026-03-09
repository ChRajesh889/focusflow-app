
// @ts-ignore
declare module 'pg';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
const cors = require('cors');
import pg from 'pg';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory (for the APK)
// We check both the current directory and the parent to be safe relative to the dist folder
const publicPath = fs.existsSync(path.join(process.cwd(), 'public'))
    ? path.join(process.cwd(), 'public')
    : path.join(__dirname, '..', 'public');

console.log('Final Public Path:', publicPath);
console.log('Exists:', fs.existsSync(publicPath));
if (fs.existsSync(publicPath)) {
    console.log('Contents:', fs.readdirSync(publicPath));
} else {
    console.log('Root contents:', fs.readdirSync(process.cwd()));
}
app.use(express.static(publicPath));

// --- REST API Endpoints ---
app.get('/', (req, res) => {
    res.status(200).send('FocusFlow Server is running and ready to accept connections.');
});

app.get('/api/limits/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Get Focus Sessions
        const focusRes = await pool.query(
            'SELECT apps_blocked FROM focus_sessions WHERE user_id = $1 AND status = $2',
            [userId, 'active']
        );
        const focusApps = focusRes.rows.length > 0 ? focusRes.rows[0].apps_blocked : [];

        // 2. Get Limits & Usage
        const statusRes = await pool.query(
            'SELECT l.app_id, l.limit_mins, COALESCE(u.usage_secs, 0) as usage_secs ' +
            'FROM app_limits l ' +
            'LEFT JOIN usage_stats u ON l.user_id = u.user_id AND l.app_id = u.app_id AND u.date = CURRENT_DATE ' +
            'WHERE l.user_id = $1',
            [userId]
        );

        res.status(200).json({
            focusActive: focusRes.rows.length > 0,
            focusApps,
            limits: statusRes.rows
        });
    } catch (err) {
        console.error("Status Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch status" });
    }
});

app.post('/api/limits/extend', async (req, res) => {
    try {
        const { appId, additionalMinutes, userId = 'anonymous_user' } = req.body;

        // Find existing limit
        const limitRes = await pool.query('SELECT limit_mins FROM app_limits WHERE user_id = $1 AND app_id = $2', [userId, appId]);
        let currentLimit = limitRes.rows.length > 0 ? limitRes.rows[0].limit_mins : 0;

        // Add time
        const newLimit = currentLimit + additionalMinutes;

        await pool.query(
            'INSERT INTO app_limits (user_id, app_id, limit_mins) VALUES ($1, $2, $3) ON CONFLICT (user_id, app_id) DO UPDATE SET limit_mins = EXCLUDED.limit_mins',
            [userId, appId, newLimit]
        );

        // Notify clients to unblock / update UI
        io.to(userId).emit('sync:limit_extended', { appId, newLimit });

        res.status(200).json({ success: true, newLimit });
    } catch (err) {
        console.error("Limit Extend Error:", err);
        res.status(500).json({ error: "Failed to extend limit" });
    }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Database Connection
let pool: any;
if (process.env.DATABASE_URL) {
    pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Database configuration loaded.');
} else {
    console.warn('WARNING: DATABASE_URL not set. Running in mock mode.');
    // Simple mock to prevent crashes
    pool = { query: async () => ({ rows: [] }) };
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || process.env.API_KEY)! });

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
            limits: Object.fromEntries(limitsRes.rows.map((r: any) => [r.app_id, r.limit_mins])),
            usage: Object.fromEntries(usageRes.rows.map((r: any) => [r.app_id, r.usage_secs]))
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
            await pool.query(
                'INSERT INTO usage_stats (user_id, app_id, usage_secs, date) VALUES ($1, $2, $3, CURRENT_DATE) ' +
                'ON CONFLICT (user_id, app_id, date) DO UPDATE SET usage_secs = usage_stats.usage_secs + EXCLUDED.usage_secs',
                [userId, appId, incrementSecs]
            );
            socket.to(userId).emit('sync:usage_increment', { appId, incrementSecs });
        } catch (err) { console.error("Usage Save Error:", err); }
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
