package com.focusflow.blocker;

import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Promise;

public class AppBlockerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AppBlockerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "AppBlockerModule";
    }

    // Checks if the user has enabled the Accessibility Service
    @ReactMethod
    public void checkPermission(Promise promise) {
        int accessibilityEnabled = 0;
        final String service = reactContext.getPackageName() + "/" + AppBlockerService.class.getCanonicalName();
        try {
            accessibilityEnabled = Settings.Secure.getInt(reactContext.getContentResolver(), android.provider.Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            promise.resolve(false);
            return;
        }
        
        TextUtils.SimpleStringSplitter mStringColonSplitter = new TextUtils.SimpleStringSplitter(':');

        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (settingValue != null) {
                mStringColonSplitter.setString(settingValue);
                while (mStringColonSplitter.hasNext()) {
                    String accessibilityService = mStringColonSplitter.next();
                    if (accessibilityService.equalsIgnoreCase(service)) {
                        promise.resolve(true);
                        return;
                    }
                }
            }
        }
        promise.resolve(false);
    }

    // Opens the Accessibility Settings
    @ReactMethod
    public void requestPermission() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    // Called from React Native when Socket.io receives `command:block_apps`
    @ReactMethod
    public void startBlocking(ReadableArray apps, int durationSeconds) {
        AppBlockerService.isBlockingActive = true;
        AppBlockerService.blockedPackages.clear();
        for (int i = 0; i < apps.size(); i++) {
            AppBlockerService.blockedPackages.add(apps.getString(i));
        }
        // Duration logic can be handled in JS with `setTimeout` to call `stopBlocking`
        // Or natively here using a Handler
    }

    // Called from React Native when Socket.io receives `command:unblock_apps`
    @ReactMethod
    public void stopBlocking() {
        AppBlockerService.isBlockingActive = false;
        AppBlockerService.blockedPackages.clear();
    }
}
