
# 🚀 FocusFlow AI: Beginner Setup Guide

Welcome! This guide will help you set up your own distraction-blocking ecosystem. 

## Step 1: Get your "Keys" (Free Accounts)
To run this like a pro, you need three things:
1. **Google AI Studio**: [Get a Gemini API Key](https://aistudio.google.com/) (This powers the "AI Interventions").
2. **Neon.tech**: [Create a free PostgreSQL database](https://neon.tech/) (This stores your focus history).
3. **Railway.app**: [Create an account](https://railway.app/) (This hosts your server so it's online 24/7).

---

## Step 2: Set Up the Backend "Brain"
The backend lives in `server.ts`. 
1. **Create a folder** on your computer called `focus-server`.
2. **Open a terminal** in that folder and type:
   ```bash
   npm init -y
   npm install express socket.io pg dotenv cors @google/genai
   ```
3. **Create a file** named `.env` and paste your keys:
   ```env
   API_KEY=your_gemini_key_here
   DATABASE_URL=your_neon_postgres_url_here
   ```
4. **Start it**: `npx ts-node server.ts`. Your server is now waiting for connections!

---

## Step 3: Set Up the Windows Agent (The Enforcer)
This is the script that actually "kills" the apps on your computer.
1. **In a new folder** called `focus-agent`, create a file `agent.js`.
2. **Copy the code** from the `WINDOWS_AGENT_SETUP.js` file in this project.
3. **Install the connector**: `npm install socket.io-client`.
4. **Run it**: `node agent.js`. 
   *You should see: "Successfully connected to FocusFlow Hub."*

---

## Step 4: Using the Website
1. Open the `Dashboard.tsx` in this project.
2. Ensure the `BACKEND_URL` matches where your server is running (usually `http://localhost:3001`).
3. Select "Twitter" or "Instagram" from the list.
4. Set a Goal and click **"Start Focus Session"**.
5. **The Magic**: Watch your terminal where `agent.js` is running. If you try to open Twitter on your computer, the agent will instantly close it.

---

## Step 5: How to handle Mobile
Mobile is different because phones are more "locked down" than Windows.
1. **Android**: You need to create a simple app (using React Native). Your app must ask for "Accessibility Permissions". When your server sends a block signal, the Android app detects if a forbidden app is in the foreground and forces the user back to the FocusFlow app.
2. **iOS**: You must use the "Screen Time API" (FamilyControls). This requires an Apple Developer account.
