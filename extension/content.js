// content.js - FocusFlow Pro Bridge
// Listens for events from the dashboard web app and signals the background script

console.log("[FocusFlow] Bridge initialized");

window.addEventListener("focusflow-force-sync", (event) => {
    console.log("[FocusFlow] Signal received from dashboard, forcing background sync...");
    // Forward the data payload if present
    chrome.runtime.sendMessage({
        action: "force_check",
        data: event.detail
    });
});
