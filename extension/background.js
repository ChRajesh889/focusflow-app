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

let syncData = {
    focusActive: false,
    focusApps: [],
    limits: []
};

async function syncWithBackend() {
    try {
        const response = await fetch(`${backendUrl}/api/limits/status/${USER_ID}`);
        if (response.ok) {
            const data = await response.json();

            // Update local state
            syncData = data;

            // Update local storage so popup can show last sync time
            chrome.storage.local.set({
                lastSyncStatus: 'success',
                lastSyncTime: Date.now(),
                syncData: data
            });

            console.log("Synced data:", data);
        } else {
            throw new Error("HTTP Error " + response.status);
        }
    } catch (err) {
        chrome.storage.local.set({ lastSyncStatus: 'failed' });
        console.error("Sync failed:", err);
        throw err;
    }
}

// Simple blocking by Tab Monitoring
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        checkAndBlockTab(tabId, changeInfo.url);
    }
});

const APP_SITES = {
    "instagram": ["instagram.com"],
    "facebook": ["facebook.com"],
    "twitter": ["twitter.com", "x.com"],
    "youtube": ["youtube.com"],
    "tiktok": ["tiktok.com"],
    "snapchat": ["snapchat.com"],
    "reddit": ["reddit.com"],
    "whatsapp": ["whatsapp.com", "web.whatsapp.com"]
};

function checkAndBlockTab(tabId, url) {
    // 1. Never block the FocusFlow dashboard itself
    if (url.includes("focusflow-app-two.vercel.app")) return;

    // 2. Determine if the current URL belongs to a tracked app
    let matchedAppId = null;
    for (const [appId, domains] of Object.entries(APP_SITES)) {
        if (domains.some(domain => url.includes(domain))) {
            matchedAppId = appId;
            break;
        }
    }

    if (!matchedAppId) return;

    // 3. Check Focus Session Blocking
    const isBlockedByFocus = syncData.focusActive && syncData.focusApps.includes(matchedAppId);

    // 4. Check Daily Limit Blocking
    const appStatus = syncData.limits.find(l => l.app_id === matchedAppId);
    const isBlockedByLimit = appStatus && appStatus.limit_mins > 0 && (appStatus.usage_secs / 60) >= appStatus.limit_mins;

    if (isBlockedByFocus || isBlockedByLimit) {
        const blockUrl = `https://focusflow-app-two.vercel.app/`;

        // Search for an existing FocusFlow tab to reuse it
        chrome.tabs.query({ url: "*://focusflow-app-two.vercel.app/*" }, (tabs) => {
            if (tabs.length > 0) {
                // Focus the existing dashboard and close this distraction tab
                chrome.tabs.update(tabs[0].id, { active: true });
                chrome.tabs.remove(tabId);
                console.log(`[Extension] Blocked ${matchedAppId} (Reason: ${isBlockedByFocus ? 'Focus' : 'Limit'})`);
            } else {
                // No dashboard open: Update this tab to show the dashboard
                chrome.tabs.update(tabId, { url: blockUrl });
                console.log(`[Extension] No dashboard open, redirected ${matchedAppId} to block page`);
            }
        });
    }
}
