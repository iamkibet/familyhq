# Pre-Build Checklist for FamilyHQ

This checklist ensures your app is ready for building (APK/IPA).

## ✅ Pre-Build Checks

### 1. Environment Variables Configuration

**CRITICAL**: EAS Build does NOT automatically use your local `.env` file. You must configure environment variables in EAS.

#### Option A: Using EAS Secrets (Recommended)
```bash
# Set each environment variable as a secret
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-project-id.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-project-id.appspot.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-google-client-id"
```

#### Option B: Using eas.json (Less Secure - Not Recommended)
Add to `eas.json` under each build profile:
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_API_KEY": "your-api-key",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "your-project-id.firebaseapp.com",
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "your-project-id",
        "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET": "your-project-id.appspot.com",
        "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "your-sender-id",
        "EXPO_PUBLIC_FIREBASE_APP_ID": "your-app-id",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-google-client-id"
      }
    }
  }
}
```

**Verify your .env file exists and has all required variables:**
- ✅ `EXPO_PUBLIC_FIREBASE_API_KEY`
- ✅ `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `EXPO_PUBLIC_FIREBASE_APP_ID`
- ✅ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (if using Google Sign-In)

### 2. App Configuration (app.json)

**Verify the following in `app.json`:**

- ✅ **App Name**: `"name": "FamilyHQ"` - Display name
- ✅ **Slug**: `"slug": "FamilyHQ"` - URL-friendly identifier
- ✅ **Version**: `"version": "1.0.0"` - Semantic version
- ✅ **Bundle Identifiers**:
  - iOS: `"bundleIdentifier": "com.familyhq.app"`
  - Android: `"package": "com.familyhq.app"`
- ✅ **Android versionCode**: `"versionCode": 1` - Must be present for Android builds
- ✅ **EAS Project ID**: `"projectId": "1450b337-9f8b-4b31-9582-7827137bb935"` - Already configured
- ✅ **Icon**: `"./assets/images/icon.png"` - Must exist
- ✅ **Android Adaptive Icon**: All images must exist:
  - `./assets/images/android-icon-foreground.png`
  - `./assets/images/android-icon-background.png`
  - `./assets/images/android-icon-monochrome.png`

### 3. Assets Verification

**Check that all required assets exist:**

```bash
# Run this to verify assets
ls -la assets/images/
```

Required assets:
- ✅ `icon.png` (iOS/Android icon)
- ✅ `android-icon-foreground.png`
- ✅ `android-icon-background.png`
- ✅ `android-icon-monochrome.png`
- ✅ `favicon.png` (for web)
- ✅ `splash-icon.png` (if used)

### 4. Firebase Configuration

**Verify Firebase setup:**

- ✅ Firebase project is created and active
- ✅ Firestore Database is enabled
- ✅ Firebase Storage is enabled
- ✅ Authentication is enabled:
  - Email/Password authentication enabled
  - Google Sign-In enabled (if using)
- ✅ Firestore Security Rules are deployed (check `firestore.rules`)
- ✅ Storage Security Rules are deployed (check `storage.rules`)
- ✅ Firestore Indexes are deployed (check `firestore.indexes.json`)

**To deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

**To deploy Storage rules:**
```bash
firebase deploy --only storage
```

**To deploy Firestore indexes:**
```bash
firebase deploy --only firestore:indexes
```

### 5. Code Quality Checks

**Run these commands before building:**

```bash
# Check for configuration issues
npx expo-doctor

# Run linter (fix any errors, warnings are OK)
npm run lint

# Type check (if using TypeScript)
npx tsc --noEmit
```

**Current Status:**
- ✅ `expo-doctor`: All checks passed
- ⚠️ Linter: Has warnings (non-blocking) and 2 errors (should fix)
- ✅ TypeScript: No type errors detected

### 6. EAS Build Configuration

**Verify `eas.json` is properly configured:**

- ✅ Build profiles exist:
  - `development` - For development builds
  - `preview` - For APK/IPA testing builds
  - `production` - For app store releases
- ✅ Android preview profile has `"buildType": "apk"` (for direct APK download)
- ✅ EAS CLI version requirement: `">= 16.28.0"`

### 7. Dependencies

**Verify all dependencies are compatible:**

- ✅ All dependencies are installed: `npm install`
- ✅ No dependency conflicts
- ✅ Expo SDK version: `~54.0.30`
- ✅ React Native version: `0.81.5`
- ✅ Firebase version: `^12.7.0`

**To fix dependency issues:**
```bash
npx expo install --fix
```

### 8. Build-Specific Checks

#### For Android APK Build:
- ✅ `versionCode` is set in `app.json` (currently: 1)
- ✅ Package name is set: `"com.familyhq.app"`
- ✅ Adaptive icon images exist
- ✅ EAS build profile `preview` is configured for APK

#### For iOS Build:
- ✅ Bundle identifier is set: `"com.familyhq.app"`
- ✅ Apple Developer account is linked (for production builds)
- ✅ Provisioning profiles are configured (for production builds)

### 9. Testing Before Build

**Recommended testing:**

- ✅ App runs in development mode without errors
- ✅ Authentication works (Email/Password and/or Google)
- ✅ Firebase services work (Firestore, Storage)
- ✅ All main features are functional
- ✅ No console errors in development

### 10. EAS Account & Authentication

**Before building:**

- ✅ EAS CLI is installed: `npm install -g eas-cli`
- ✅ Logged into EAS: `eas login`
- ✅ Project is linked: `eas project:info` (should show your project)

## 🚀 Build Commands

### Build Android APK (Preview):
```bash
eas build --platform android --profile preview
```

### Build Android AAB (Production):
```bash
eas build --platform android --profile production
```

### Build iOS (Preview):
```bash
eas build --platform ios --profile preview
```

### Build iOS (Production):
```bash
eas build --platform ios --profile production
```

### Build with Cache Clear (if issues):
```bash
eas build --platform android --profile preview --clear-cache
```

## ⚠️ Common Build Issues & Solutions

### Issue: "Firebase configuration is incomplete"
**Solution**: Set environment variables in EAS secrets (see section 1)

### Issue: "Gradle build failed"
**Solution**: 
- Check build logs for specific errors
- Ensure `versionCode` is set in `app.json`
- Try `--clear-cache` flag
- Run `npx expo install --fix`

### Issue: "Missing assets"
**Solution**: Verify all asset files exist in `assets/images/`

### Issue: "Environment variables not found"
**Solution**: Configure EAS secrets (see section 1, Option A)

### Issue: "Firestore permission denied"
**Solution**: Deploy Firestore security rules (see section 4)

## 📋 Quick Pre-Build Checklist

Before running `eas build`, verify:

- [ ] Environment variables are set in EAS secrets
- [ ] `app.json` has correct version and bundle identifiers
- [ ] All asset images exist
- [ ] Firebase is configured and rules are deployed
- [ ] `npx expo-doctor` passes all checks
- [ ] Linter errors are fixed (warnings are OK)
- [ ] EAS CLI is installed and you're logged in
- [ ] App runs successfully in development mode

## 🎯 Next Steps

1. **Set EAS Secrets** (if not done):
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-value"
   # Repeat for all environment variables
   ```

2. **Fix Linting Errors** (if any):
   ```bash
   npm run lint
   # Fix any errors shown
   ```

3. **Deploy Firebase Rules** (if not done):
   ```bash
   firebase deploy --only firestore:rules,storage,firestore:indexes
   ```

4. **Run Final Check**:
   ```bash
   npx expo-doctor
   ```

5. **Build Your App**:
   ```bash
   eas build --platform android --profile preview
   ```

---

**Note**: The first build may take 10-15 minutes. Subsequent builds are faster due to caching.




