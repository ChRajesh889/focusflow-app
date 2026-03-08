
# FocusFlow AI: Professional Deployment Architecture

To achieve sub-50ms real-time synchronization across Mobile and Windows, follow this production deployment map.

## 1. The Real-time Backend (Option A: Recommended)
**Host:** [Railway.app](https://railway.app)
- **Service:** Node.js (TypeScript) + Socket.io.
- **Why:** Railway handles WebSocket "sticky sessions" better than AWS or Google Cloud Run without complex configuration. It scales vertically with one click.

## 2. The Database Layer
**Provider:** [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)
- **Database:** Serverless PostgreSQL.
- **Why:** Neon allows "Branching" (test changes on a copy of your DB before pushing to production). Supabase includes built-in real-time listeners.

## 3. Secure AI Interventions
**Provider:** [Vercel Edge Functions](https://vercel.com/features/edge-functions)
- **Integration:** Move the Gemini API calls from `geminiService.ts` to a Vercel Edge Function.
- **Why:** This hides your `API_KEY` and runs globally at the "Edge" (meaning the AI suggestion is generated in a data center closest to the user's physical location).

---

## Technical Step-by-Step for Windows Integration

The Windows Agent is usually a small **Electron** or **Rust (Tauri)** application.

### The Real-time Flow:
1. **Windows App** connects to your backend: `socket.emit('identify', { platform: 'windows' })`.
2. **Web Dashboard** starts session: `socket.emit('session_start')`.
3. **Backend** broadcasts to Windows App: `io.to(userId).emit('block_apps')`.
4. **Windows App** executes native command:
   ```javascript
   // Pseudo-code for Windows Agent
   if (message === 'block_apps') {
     const { exec } = require('child_process');
     exec('taskkill /IM instagram.exe /F');
   }
   ```

## Technical Step-by-Step for Mobile Integration

For Mobile, you cannot use `taskkill`. You must use native APIs.

- **iOS:** Requires **FamilyControls** (Screen Time API). You need an Apple Developer Program account ($99/year) to use this.
- **Android:** Requires **AccessibilityService** or **UsageStatsManager**. You can detect when a forbidden package (e.g., `com.instagram.android`) comes to the foreground and launch a "Focus Overlay" activity over it.

---

### Deployment URL Checklist
- **Backend API:** `https://api.focusflow.railway.app`
- **Frontend App:** `https://focusflow.ai`
- **Database:** `postgres://user:pass@ep-cool-name.neon.tech/neondb`
