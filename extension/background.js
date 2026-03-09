// background.js - FocusFlow Pro Blocker Service Worker

let backendUrl = "https://focusflow-server-wuud.onrender.com";
const USER_ID = "demo_user_123";

let syncData = {
    focusActive: false,
    focusApps: [],
    limits: []
};

// 1. Load initial data from storage
chrome.storage.local.get(['syncData'], (result) => {
    if (result.syncData) {
        syncData = result.syncData;
        console.log("[Watchdog] Restored syncData from storage:", syncData);
    }
    // Initial sync after loading storage
    syncWithBackend();
});

// Watchdog: Check ALL tabs every 5 seconds
setInterval(() => {
    runWatchdog();
}, 5000);

// Sync with backend every 60 seconds
setInterval(() => {
    syncWithBackend();
}, 60000);

// Listen for messages from Dashboard Bridge (content.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sync' || request.action === 'force_check') {
        if (request.data) {
            syncData = request.data;
            chrome.storage.local.set({ syncData: syncData });
            console.log("[Watchdog] Sync data received via bridge:", syncData);
            runWatchdog();
            sendResponse({ success: true, source: 'bridge' });
            return;
        }

        syncWithBackend().then(() => {
            sendResponse({ success: true, source: 'manual-sync' });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true;
    }
});

async function syncWithBackend() {
    try {
        const response = await fetch(`${backendUrl}/api/limits/status/${USER_ID}`, {
            cache: 'no-cache'
        });

        if (response.ok) {
            const data = await response.json();
            syncData = data;
            chrome.storage.local.set({
                syncData: data,
                lastSyncStatus: 'success',
                lastSyncTime: Date.now()
            });
            console.log("[Watchdog] Sync Success:", data);
            runWatchdog();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (err) {
        console.info("[Watchdog] Background sync unavailable (using local cache):", err.message);
        chrome.storage.local.set({ lastSyncStatus: 'failed', lastError: err.message });
    }
}

function runWatchdog() {
    chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) return;
        tabs.forEach(tab => {
            if (tab.id && tab.url) {
                checkAndBlockTab(tab.id, tab.url);
            }
        });
    });
}

// 2. Tab Monitoring (Real-time)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && changeInfo.status === 'complete') {
        checkAndBlockTab(tabId, tab.url);
    }
});

const APP_SITES = {
    "twitter": ["x.com", "twitter.com", "t.co", "abs.twimg.com"],
    "instagram": ["instagram.com", "instagr.am", "cdninstagram.com"],
    "facebook": ["facebook.com", "fb.com", "messenger.com", "facebook.net", "fbcdn.net"],
    "youtube": ["youtube.com", "youtu.be", "m.youtube.com", "googlevideo.com", "youtube-nocookie.com"],
    "whatsapp": ["whatsapp.com", "whatsapp.net", "web.whatsapp.com"],
    "snapchat": ["snapchat.com", "snap.com", "sc-static.net"],
    "tiktok": ["tiktok.com", "vimeo.com", "tiktokv.com"],
    "reddit": ["reddit.com", "reddit.app.link", "redd.it", "redditmedia.com", "redditstatic.com"]
};

function checkAndBlockTab(tabId, url) {
    if (!url) return;
    const lowerUrl = url.toLowerCase();

    // Safety check for internal pages and the dashboard
    if (lowerUrl.includes("focusflow-app-two.vercel.app") ||
        lowerUrl.includes("localhost") ||
        lowerUrl.startsWith("chrome://") ||
        lowerUrl.startsWith("about:") ||
        lowerUrl.startsWith("edge://")) return;

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
        console.log(`[Watchdog] Targeting tab ${tabId} (${matchedAppId}). Reason: ${isBlockedByFocus ? 'Focus' : 'Limit'}`);
        forceBlockTab(tabId, matchedAppId, isBlockedByFocus ? 'Focus Session' : 'Daily Limit');
    }
}

function forceBlockTab(tabId, appId, reason) {
    const blockUrl = `https://focusflow-app-two.vercel.app/`;

    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) return;

        chrome.tabs.query({ url: "*://focusflow-app-two.vercel.app/*" }, (tabs) => {
            if (chrome.runtime.lastError) return;

            if (tabs.length > 0) {
                const dashboardTab = tabs[0];
                chrome.tabs.update(dashboardTab.id, { active: true });
                chrome.windows.update(dashboardTab.windowId, { focused: true });

                chrome.tabs.remove(tabId, () => {
                    if (!chrome.runtime.lastError) {
                        console.log(`[Watchdog] Closed ${appId} for ${reason}`);
                    }
                });
            } else {
                chrome.tabs.update(tabId, { url: blockUrl });
            }
        });
    });
}
