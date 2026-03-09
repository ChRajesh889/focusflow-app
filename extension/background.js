// background.js - FocusFlow Pro Blocker Service Worker

let blockedAppRules = [];
let isFocusSessionActive = false;
let backendUrl = "https://focusflow-server-wuud.onrender.com"; // Default, will sync from options/storage
const USER_ID = "demo_user_123"; // Matches Dashboard.tsx value

// 1. High-Frequency Sync & Watchdog Setup
// We use a shorter period for alarms (minimum 1 minute in some Chrome versions, so we use setInterval as fallback)
chrome.alarms.create("sync-settings", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "sync-settings") {
        syncWithBackend();
    }
});

// Watchdog: Check ALL tabs every 5 seconds to catch existing distractions
setInterval(() => {
    runWatchdog();
}, 5000);

// Also sync every 30 seconds manually using setInterval
setInterval(() => {
    syncWithBackend();
}, 30000);

// Initial Sync
chrome.runtime.onInstalled.addListener(() => {
    syncWithBackend();
});

// Listen for messages from popup or Dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sync' || request.action === 'force_check') {
        syncWithBackend().then(() => {
            if (request.action === 'force_check') runWatchdog();
            sendResponse({ success: true });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true;
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
            syncData = data;

            chrome.storage.local.set({
                lastSyncStatus: 'success',
                lastSyncTime: Date.now(),
                syncData: data
            });

            console.log("[Watchdog] Sync Success:", data);

            // Immediately run watchdog after sync if focus is active
            if (data.focusActive || data.limits.some(l => l.limit_mins > 0)) {
                runWatchdog();
            }
        } else {
            throw new Error("HTTP Error " + response.status);
        }
    } catch (err) {
        chrome.storage.local.set({ lastSyncStatus: 'failed' });
        console.error("[Watchdog] Sync failed:", err);
    }
}

function runWatchdog() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url) {
                checkAndBlockTab(tab.id, tab.url);
            }
        });
    });
}

// 2. Tab Monitoring (Real-time)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check on every update if a focus session is active, not just URL changes
    if (tab.url) {
        checkAndBlockTab(tabId, tab.url);
    }
});

const APP_SITES = {
    "twitter": ["x.com", "twitter.com", "t.co"],
    "instagram": ["instagram.com", "instagr.am"],
    "facebook": ["facebook.com", "fb.com", "messenger.com", "facebook.net"],
    "youtube": ["youtube.com", "youtu.be", "m.youtube.com", "googlevideo.com"],
    "whatsapp": ["whatsapp.com", "whatsapp.net", "web.whatsapp.com"],
    "snapchat": ["snapchat.com", "snap.com"],
    "tiktok": ["tiktok.com", "vimeo.com"],
    "reddit": ["reddit.com", "reddit.app.link", "redd.it"]
};

function checkAndBlockTab(tabId, url) {
    if (!url) return;
    const lowerUrl = url.toLowerCase();

    // 1. Never block the FocusFlow dashboard or its variants
    if (lowerUrl.includes("focusflow-app-two.vercel.app") || lowerUrl.includes("localhost")) return;

    let matchedAppId = null;
    for (const [appId, domains] of Object.entries(APP_SITES)) {
        if (domains.some(domain => lowerUrl.includes(domain.toLowerCase()))) {
            matchedAppId = appId;
            break;
        }
    }

    if (!matchedAppId) return;

    const isBlockedByFocus = syncData.focusActive && syncData.focusApps.includes(matchedAppId);
    const appStatus = syncData.limits.find(l => l.app_id === matchedAppId);
    const isBlockedByLimit = appStatus && appStatus.limit_mins > 0 && (appStatus.usage_secs / 60) >= appStatus.limit_mins;

    if (isBlockedByFocus || isBlockedByLimit) {
        forceBlockTab(tabId, matchedAppId, isBlockedByFocus ? 'Focus Session' : 'Daily Limit');
    }
}

function forceBlockTab(tabId, appId, reason) {
    const blockUrl = `https://focusflow-app-two.vercel.app/`;

    // Use a clearer set of patterns for identifying the dashboard
    chrome.tabs.query({ url: "*://focusflow-app-two.vercel.app/*" }, (tabs) => {
        if (tabs.length > 0) {
            const dashboardTab = tabs[0];
            chrome.tabs.update(dashboardTab.id, { active: true });
            chrome.windows.update(dashboardTab.windowId, { focused: true });
            chrome.tabs.remove(tabId);
            console.log(`[Watchdog] Closed ${appId} for ${reason} (Reflected to Dashboard)`);
        } else {
            chrome.tabs.update(tabId, { url: blockUrl });
            console.log(`[Watchdog] No dashboard open, reused tab for ${appId} (Reason: ${reason})`);
        }
    });
}
