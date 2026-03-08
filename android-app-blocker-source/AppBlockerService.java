package com.focusflow.blocker;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;
import java.util.ArrayList;
import java.util.List;

public class AppBlockerService extends AccessibilityService {
    private static final String TAG = "AppBlockerService";
    
    // Controlled by the React Native module (which gets the signal from Node.js)
    public static boolean isBlockingActive = false;
    public static List<String> blockedPackages = new ArrayList<>();

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // We only care about window state changes (when an app comes to the foreground)
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }

        if (!isBlockingActive) {
            return;
        }

        if (event.getPackageName() != null) {
            String packageName = event.getPackageName().toString();
            Log.d(TAG, "Foreground App: " + packageName);

            if (blockedPackages.contains(packageName)) {
                Log.w(TAG, "BLOCKED APP OPENED! Intercepting: " + packageName);
                
                // Immediately launch our Block Screen Activity over the distracting app
                Intent intent = new Intent(this, BlockScreenActivity.class);
                intent.putExtra("packageName", packageName);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
                startActivity(intent);
            }
        }
    }

    @Override
    public void onInterrupt() {
        Log.e(TAG, "Accessibility Service Interrupted");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Accessibility Service Connected!");
    }
}
