
/**
 * FocusFlow Windows Agent
 * -----------------------
 * This script runs on your Windows machine and kills distractions.
 * 
 * SETUP:
 * 1. Install Node.js
 * 2. npm install socket.io-client
 * 3. node WINDOWS_AGENT_SETUP.js
 */

import { io } from "socket.io-client";
import { exec } from "child_process";

const SERVER_URL = "http://localhost:3001"; // Change to your public server URL
const USER_ID = "demo_user_123"; // Must match your web dashboard login

const socket = io(SERVER_URL, {
    query: { userId: USER_ID, platform: 'windows' }
});

// Map of FocusFlow IDs to Windows Executable Names
const APP_PROCESS_MAP = {
    'twitter': 'Twitter.exe',
    'instagram': 'Instagram.exe',
    'facebook': 'Facebook.exe',
    'chrome': 'chrome.exe', // Be careful blocking browsers!
    'whatsapp': 'WhatsApp.exe'
};

// Map of FocusFlow IDs to Browser Window Titles (to safely close tabs)
const APP_WINDOW_TITLE_MAP = {
    'twitter': 'X',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'youtube': 'YouTube',
    'whatsapp': 'WhatsApp'
};

let activeInterval = null;
let appsToBlock = [];

console.log(">>> FocusFlow Windows Guard Started...");
console.log(`>>> Connecting to Hub: ${SERVER_URL}`);

socket.on("connect", () => {
    console.log("Successfully connected to FocusFlow Hub.");
});

socket.on("agent:enforce_block", (data) => {
    console.log(`!!! AGENT ENFORCEMENT ACTIVATED: ${data.goal}`);
    appsToBlock = data.apps;

    // Start the enforcement loop (runs every 5 seconds)
    if (activeInterval) clearInterval(activeInterval);

    activeInterval = setInterval(() => {
        appsToBlock.forEach(appId => {
            const processName = APP_PROCESS_MAP[appId];
            if (processName) {
                // Execute Windows TaskKill command for native apps
                exec(`taskkill /F /IM ${processName} /T`, (err) => {
                    if (!err) console.log(`[Blocked] Terminated ${processName} to keep you focused on ${data.goal}`);
                });
            }

            const windowTitle = APP_WINDOW_TITLE_MAP[appId];
            if (windowTitle) {
                // Safely close the active browser tab if it matches the blocked app
                const psCommand = `powershell -NoProfile -Command "$wshell = New-Object -ComObject wscript.shell; Get-Process | Where-Object { $_.MainWindowTitle -match '${windowTitle}' } | ForEach-Object { $wshell.AppActivate($_.Id); Start-Sleep -Milliseconds 100; $wshell.SendKeys('^w'); echo 'Closed ${windowTitle}' }"`;
                exec(psCommand, (err, stdout) => {
                    if (stdout && stdout.trim().length > 0) {
                        console.log(`[Blocked] Closed ${windowTitle} browser tab to keep you focused.`);
                    }
                });
            }
        });
    }, 5000);
});

socket.on("agent:release_block", () => {
    console.log(">>> Agent unblock engaged.");
    if (activeInterval) {
        clearInterval(activeInterval);
        activeInterval = null;
    }
});

// Keep generic commands for cross-platform sync if needed
socket.on("command:block_apps", (data) => {
    if (!activeInterval) {
        console.log(`>>> Received generic block command: ${data.goal}`);
        // Logic could be shared or separate
    }
});

socket.on("command:unblock_apps", () => {
    if (activeInterval) {
        console.log(">>> Received generic unblock command.");
        clearInterval(activeInterval);
        activeInterval = null;
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from Hub. Safety unblock engaged.");
    if (activeInterval) clearInterval(activeInterval);
});
