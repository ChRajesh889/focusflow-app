import { AppInfo } from '../types';

export const launchApp = (app: AppInfo): Window | null => {
    // Check if device is Android
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid && app.androidPackage) {
        // Strip the protocol from the URL for the Intent
        const urlWithoutProtocol = app.url.replace(/^https?:\/\//, '');

        // Android Intent URI format to open native app directly
        const intentUrl = `intent://${urlWithoutProtocol}/#Intent;package=${app.androidPackage};scheme=https;S.browser_fallback_url=${encodeURIComponent(app.url)};end`;

        // This will launch the native app (e.g. Instagram) without creating a new tab
        window.location.href = intentUrl;
        return null;
    } else {
        // Desktop or other mobile OS: 
        // Use app.id as window target (instead of _blank) to reuse the specific app's tab
        return window.open(app.url, app.id);
    }
};
