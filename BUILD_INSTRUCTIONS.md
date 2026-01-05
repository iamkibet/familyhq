# Building APK for Testing

## Option 1: EAS Build (Recommended - Free for Android)

EAS Build is Expo's modern build service. It's free for Android APK builds.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

(If you don't have an Expo account, create one at https://expo.dev)

### Step 3: Configure EAS Build

```bash
eas build:configure
```

This will create an `eas.json` file with build configurations.

### Step 4: Build APK

```bash
eas build --platform android --profile preview
```

This will:
- Build your app in the cloud
- Generate an APK file
- Provide a download link when complete

**Note**: The first build may take 10-15 minutes. Subsequent builds are faster.

### Step 5: Download and Install

1. Once the build completes, you'll get a download link
2. Download the APK to your Android device
3. Enable "Install from Unknown Sources" in your device settings
4. Install the APK

---

## Option 2: Local Development Build (Advanced)

If you want to build locally, you'll need Android Studio and the Android SDK.

### Step 1: Install Android Studio

Download from: https://developer.android.com/studio

### Step 2: Prebuild Native Code

```bash
npx expo prebuild --platform android
```

### Step 3: Build APK Locally

```bash
cd android
./gradlew assembleRelease
```

The APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

---

## Option 3: Expo Go (Quick Testing - Limited)

For quick testing without building:

1. Install Expo Go app on your Android device
2. Run `npx expo start`
3. Scan the QR code with Expo Go

**Note**: Some features (like custom native code, app icons, etc.) won't work in Expo Go. For full testing, use Option 1 or 2.

---

## Recommended: EAS Build (Option 1)

For the best experience, use EAS Build:
- ✅ Free for Android APK builds
- ✅ No need to install Android Studio
- ✅ Handles all native configurations
- ✅ Builds in the cloud
- ✅ Easy to share with testers

### Quick Start:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure (first time only)
eas build:configure

# Build APK
eas build --platform android --profile preview
```

---

## Troubleshooting

### "EAS CLI not found"
- Make sure you installed it globally: `npm install -g eas-cli`
- Or use npx: `npx eas-cli build --platform android`

### "Not logged in"
- Run `eas login` and create an Expo account if needed

### Build fails

**Gradle Build Failed Error:**
If you see "Gradle build failed with unknown error", try these fixes:

1. **Check the build logs** - Click the logs link provided to see the exact error
2. **Add versionCode** - Make sure `app.json` has `"android": { "versionCode": 1 }`
3. **Clear cache and rebuild**:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```
4. **Check for missing dependencies** - Review the logs for missing packages
5. **Verify app.json is valid** - Run `npx expo-doctor` to check for issues
6. **Check environment variables** - Make sure all `.env` variables are set
7. **Update Expo SDK** - Make sure you're using a compatible Expo version

Common fixes:
- ✅ Add `"versionCode": 1` to `android` section in `app.json`
- ✅ Run `npx expo install --fix` to fix dependency versions
- ✅ Try building with `--clear-cache` flag
- ✅ Check build logs for specific error messages

### APK won't install
- Enable "Install from Unknown Sources" in Android settings
- Make sure you downloaded the APK (not AAB) file

