// content.js - FocusFlow Pro Bridge
// Listens for messages from the dashboard web app and signals the background script

console.log("[FocusFlow] Bridge initialized");

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data && event.data.type === "focusflow-force-sync") {
        console.log("[FocusFlow] Signal received from dashboard, updating background state...");
        // Forward the data payload to the background script
        chrome.runtime.sendMessage({
            action: "force_check",
            data: event.data.payload
        });
    }
});
