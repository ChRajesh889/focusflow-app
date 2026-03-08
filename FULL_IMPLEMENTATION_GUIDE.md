
# FocusFlow AI: Full Implementation Guide

This guide explains how to get the real-time blocking working on your Windows machine.

## Phase 1: The Backend (The Brain)
1. Deploy `server.ts` to **Railway.app**.
2. Add your `API_KEY` (Gemini) and `DATABASE_URL` (Postgres) to Railway environment variables.
3. Note your public URL (e.g., `https://focusflow-hub.up.railway.app`).

## Phase 2: The Windows Agent (The Muscle)
To actually block apps on your PC:
1. Ensure you have **Node.js** installed on Windows.
2. Create a folder named `focusflow-agent`.
3. Inside that folder, create `agent.js` and paste the code from `WINDOWS_AGENT_SETUP.js`.
4. Update the `SERVER_URL` in the script to your Railway URL.
5. Open Command Prompt in that folder and run:
   ```bash
   npm install socket.io-client
   node agent.js
   ```
6. The script will now stay open and wait for signals from your website.

## Phase 3: The Mobile Integration (The Shield)
Since you cannot run Node.js easily on Mobile, you need a Native App:
- **Android**: Build a simple React Native app using `socket.io-client`. Use the `AppUsage` or `AccessibilityService` APIs to detect when a blocked package (e.g., `com.instagram.android`) is opened.
- **iOS**: Use the **Managed Settings Framework** and **Device Activity** API. When your backend sends the `command:block_apps` signal, your iOS app uses a "Shield Configuration" to lock the selected apps.

## How it works in real-time
1. **User** clicks "Start Focus" on the Website.
2. **Website** sends `session:start` to the Backend.
3. **Backend** finds all connected devices for that User ID.
4. **Backend** sends `command:block_apps` to the **Windows Agent**.
5. **Windows Agent** receives the list and starts a loop: `taskkill /F /IM instagram.exe`.
6. **User** tries to open Instagram on their PC; it immediately closes.
