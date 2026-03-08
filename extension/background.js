// background.js - FocusFlow Pro Blocker Service Worker

let blockedAppRules = [];
let isFocusSessionActive = false;
let backendUrl = "https://focusflow-server-wuud.onrender.com"; // Default, will sync from options/storage
const USER_ID = "demo_user_123"; // Matches Dashboard.tsx value

// Initialize Alarm to periodically sync settings
chrome.alarms.create("sync-settings", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "sync-settings") {
        syncWithBackend();
    }
});

// Initial Sync
chrome.runtime.onInstalled.addListener(() => {
    syncWithBackend();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sync') {
        syncWithBackend().then(() => {
            sendResponse({ success: true });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // keep channel open for async response
    }
});

async function syncWithBackend() {
    try {
        const response = await fetch(`${backendUrl}/api/limits/status/${USER_ID}`);
        if (response.ok) {
            const data = await response.json();

            // Update local storage so popup can show last sync time
            chrome.storage.local.set({
                lastSyncStatus: 'success',
                lastSyncTime: Date.now(),
                syncData: data
            });

            processSyncData(data);
        } else {
            throw new Error("HTTP Error " + response.status);
        }
    } catch (err) {
        chrome.storage.local.set({ lastSyncStatus: 'failed' });
        console.error("Sync failed:", err);
        throw err;
    }
}

function processSyncData(data) {
    // Logic to determine which apps are blocked based on usage vs limits
    // This will be expanded as we integrate more deeply
    console.log("Synced data:", data);
}

// Simple blocking by Tab Monitoring
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        checkAndBlockTab(tabId, changeInfo.url);
    }
});

const DISTRACTION_SITES = [
    "instagram.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "tiktok.com",
    "snapchat.com",
    "reddit.com"
];

function checkAndBlockTab(tabId, url) {
    const isDistraction = DISTRACTION_SITES.some(site => url.includes(site));

    // For the first version, we'll demonstrate "Manual Blocking" 
    // until the Socket.io client for Service Workers is fully ready.
    if (isDistraction) {
        // If it's a known distraction, we redirect to the dashboard's block page
        // or just close it to be "forceful"
        const blockUrl = `https://focusflow-app-two.vercel.app/`;

        // Optional: Only block if we have a signal from backend
        // For now, let's just close to show the power of the extension
        chrome.tabs.update(tabId, { url: blockUrl });
        console.log("Blocked distraction:", url);
    }
}
