# Android App Blocker: Source Code Setup

This folder contains the core files required to build the Android natively-blocking companion app for the FocusFlow project. Because web apps cannot interfere with OS-level apps on Android, you must compile this as a real `.apk`.

## 1. Scaffold a React Native Project
You'll need React Native CLI (not just Expo Go, because we depend on custom Java code).
```bash
npx react-native@latest init FocusFlowBlocker
cd FocusFlowBlocker
```
Install the socket.io client:
```bash
npm install socket.io-client
```

## 2. Implement the Core Files
1. Replace the generated `App.tsx` with the `App.tsx` found in this folder.
2. Open `android/app/src/main/java/com/focusflowblocker/` and copy the three `.java` files from this folder into it:
   - `AppBlockerService.java`
   - `AppBlockerModule.java`
   - `BlockScreenActivity.java`

## 3. Register the Native Module
In your `MainApplication.java` (inside `android/app/src/main/java/com/focusflowblocker/`), register the package so React Native can talk to Java:
```java
// Add this below your imports
import com.focusflow.blocker.AppBlockerModule;
import com.facebook.react.ReactPackage;
import java.util.List;
import java.util.Collections;

// Inside the getPackages() method, add:
packages.add(new ReactPackage() {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.<NativeModule>singletonList(new AppBlockerModule(reactContext));
    }
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
});
```

## 4. Configure the Service in AndroidManifest.xml
1. Open `android/app/src/main/AndroidManifest.xml`.
2. Review the `AndroidManifest.xml` provided in this folder and merge the `<uses-permission>` and `<service>` blocks.

## 5. Enable Accessibility Config
1. Create a `res/xml` directory in `android/app/src/main/res/`.
2. Create `accessibility_service_config.xml` inside it:
```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description" />
```

## 6. Run the App
Connect your Android phone via USB (with USB Debugging enabled) and run:
```bash
npm run android
```
Once installed, open the app, grant the "Accessibility" permission, and start a focus session from your Web Dashboard!
