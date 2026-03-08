// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const syncBtn = document.getElementById('sync-btn');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing...';

        try {
            // Signal background.js to sync
            chrome.runtime.sendMessage({ action: 'sync' }, (response) => {
                if (response && response.success) {
                    statusText.textContent = 'Synced successfully';
                    statusIndicator.style.backgroundColor = '#10B981';
                } else {
                    statusText.textContent = 'Sync failed';
                    statusIndicator.style.backgroundColor = '#EF4444';
                }

                setTimeout(() => {
                    syncBtn.disabled = false;
                    syncBtn.textContent = 'Force Sync Now';
                }, 1000);
            });
        } catch (err) {
            statusText.textContent = 'Connection Error';
            statusIndicator.style.backgroundColor = '#EF4444';
            syncBtn.disabled = false;
            syncBtn.textContent = 'Force Sync Now';
        }
    });

    // Check current status on open
    chrome.storage.local.get(['lastSyncStatus', 'lastSyncTime'], (result) => {
        if (result.lastSyncStatus === 'success') {
            const timeStr = result.lastSyncTime ? new Date(result.lastSyncTime).toLocaleTimeString() : 'Recently';
            statusText.textContent = `Last synced: ${timeStr}`;
            statusIndicator.style.backgroundColor = '#10B981';
        }
    });
});
