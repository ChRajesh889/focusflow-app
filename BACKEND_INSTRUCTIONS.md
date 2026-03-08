
# FocusFlow AI: Backend Setup Guide

Follow these steps to deploy the backend provided in `server.ts`.

## 1. Local Setup
1. Create a new directory: `mkdir focusflow-server && cd focusflow-server`
2. Initialize Node: `npm init -y`
3. Install dependencies:
   ```bash
   npm install express socket.io pg dotenv cors @google/genai
   npm install --save-dev typescript @types/express @types/node ts-node
   ```
4. Copy the content of `server.ts` into a file named `server.ts` in your new directory.

## 2. Database (PostgreSQL)
1. Go to [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a new project and copy the **Connection String**.
3. Run this SQL in your database console:
   ```sql
   CREATE TABLE focus_sessions (
       id SERIAL PRIMARY KEY,
       user_id TEXT NOT NULL,
       goal TEXT,
       duration INTEGER,
       apps_blocked JSONB,
       status TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

## 3. Environment Variables
Create a file named `.env` in your server directory:
```env
PORT=3001
API_KEY=your_gemini_api_key
DATABASE_URL=your_postgres_connection_string
```

## 4. Run the Server
```bash
npx ts-node server.ts
```

## 5. Deployment
Push your code to GitHub and connect it to [Railway.app](https://railway.app). It will automatically detect the Node.js environment and start the server.
